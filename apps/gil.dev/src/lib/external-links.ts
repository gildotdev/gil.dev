import { lexer, walkTokens, type Tokens } from "marked";

export interface ExternalLink {
  title: string;
  url: string;
}

export interface ExternalLinkNote {
  body?: string;
  data: {
    title: string;
    source?: string | null;
    canonicalURL?: string;
  };
}

const INTERNAL_HOSTS = new Set(["gil.dev", "www.gil.dev"]);
const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
]);
const YOUTUBE_POSITION_PARAMETERS = new Set([
  "feature",
  "si",
  "start",
  "t",
  "time_continue",
]);

/**
 * Merge curated topic links with external links found in the topic's notes.
 * Curated entries are kept first and win when a normalized URL is duplicated.
 */
export function collectTopicExternalLinks(
  notes: readonly ExternalLinkNote[],
  curatedLinks: readonly ExternalLink[] = [],
): ExternalLink[] {
  const seen = new Set<string>();
  const curated: ExternalLink[] = [];
  const discovered: ExternalLink[] = [];

  const add = (target: ExternalLink[], title: string, rawUrl: string) => {
    const url = normalizeExternalUrl(rawUrl);
    if (!url) return;

    const key = externalUrlKey(url);
    if (seen.has(key)) return;

    seen.add(key);
    target.push({
      title: cleanLinkTitle(title, url),
      url,
    });
  };

  for (const link of curatedLinks) add(curated, link.title, link.url);

  for (const note of notes) {
    const source = note.data.canonicalURL ?? note.data.source;
    if (source) {
      add(discovered, `${note.data.title} — original source`, source);
    }

    for (const link of extractMarkdownLinks(note.body ?? "")) {
      add(discovered, link.title, link.url);
    }
  }

  discovered.sort(
    (a, b) =>
      a.title.localeCompare(b.title, "en", { sensitivity: "base" }) ||
      a.url.localeCompare(b.url),
  );

  return [...curated, ...discovered];
}

function externalUrlKey(url: string): string {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  return `${host}${parsed.pathname}${parsed.search}`;
}

export function extractMarkdownLinks(markdown: string): ExternalLink[] {
  const links: ExternalLink[] = [];
  const tokens = lexer(markdown);

  walkTokens(tokens, (token) => {
    if (token.type === "link") {
      const link = token as Tokens.Link;
      links.push({ title: link.text, url: link.href });
      return;
    }
  });

  for (const match of markdown.matchAll(
    /<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    links.push({
      title: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      url: match[1],
    });
  }

  return links;
}

export function normalizeExternalUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.replace(/\\([_~.*])/g, "$1"));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (INTERNAL_HOSTS.has(hostname)) return null;

    const youtubeId = getYoutubeVideoId(url);
    if (youtubeId) return `https://www.youtube.com/watch?v=${youtubeId}`;

    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.startsWith("utm_") ||
        TRACKING_PARAMETERS.has(normalizedKey) ||
        (isYoutubeHost(hostname) &&
          YOUTUBE_POSITION_PARAMETERS.has(normalizedKey))
      ) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();

    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

function getYoutubeVideoId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }
  if (!isYoutubeHost(hostname)) return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");

  const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
  return match?.[1] ?? null;
}

function isYoutubeHost(hostname: string): boolean {
  return ["m.youtube.com", "youtube.com", "youtube-nocookie.com"].includes(
    hostname,
  );
}

function cleanLinkTitle(title: string, url: string): string {
  const cleaned = title
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_`~]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned && !/^https?:\/\//i.test(cleaned)) return cleaned;
  return new URL(url).hostname.replace(/^www\./, "");
}
