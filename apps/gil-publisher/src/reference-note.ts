import type { NormalizedFrontmatter } from "./frontmatter";

const URL_PATTERN = /https?:\/\/\S+/;
const COMPLETE_DESCRIPTION_PATTERN = /[.!?]["'”’)]?$/;

export interface NormalizedReferenceNote {
  frontmatter: NormalizedFrontmatter;
  body: string;
}

/**
 * Turn standalone YouTube references into privacy-enhanced embeds. Inline
 * links and list items remain links so prose and timestamp lists are not
 * unexpectedly expanded into players.
 */
export function transformYoutubeEmbeds(body: string, fallbackTitle: string): string {
  const emittedVideoIds = new Set<string>();

  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      const image = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
      const link = trimmed.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      const iframe = trimmed.match(
        /^<iframe\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*><\/iframe>$/i
      );
      const bare = trimmed.match(/^(https?:\/\/\S+)$/);
      const url = image?.[2] ?? link?.[2] ?? iframe?.[1] ?? bare?.[1];
      if (!url) return line;

      const videoId = youtubeVideoId(url);
      if (!videoId) return line;
      if (emittedVideoIds.has(videoId)) return "";

      emittedVideoIds.add(videoId);
      return youtubeEmbed(videoId, image?.[1] || link?.[1] || fallbackTitle);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Clean imported reference material before it is written to the Astro site.
 * Regular garden notes pass through unchanged.
 */
export function normalizeReferenceNote(
  frontmatter: NormalizedFrontmatter,
  body: string
): NormalizedReferenceNote {
  if (frontmatter.status !== "reference") return { frontmatter, body };

  const rawCanonical = stringValue(frontmatter.canonicalURL) || stringValue(frontmatter.source);
  if (!rawCanonical) {
    throw new Error(
      `Reference note “${frontmatter.title}” requires a source or canonicalURL.`
    );
  }

  const canonicalURL = normalizeCanonicalUrl(rawCanonical);
  const description = normalizeReferenceDescription(
    stringValue(frontmatter.description),
    frontmatter.title
  );

  return {
    frontmatter: {
      ...frontmatter,
      canonicalURL,
      description,
    },
    body: normalizeReferenceMarkdown(body, frontmatter.title, canonicalURL),
  };
}

/** Normalize the source URL used by canonical metadata. */
export function normalizeCanonicalUrl(rawUrl: string): string {
  const cleaned = unescapeMarkdownUrl(rawUrl);
  const videoId = youtubeVideoId(cleaned);
  if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const url = new URL(cleaned);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (
        key.toLowerCase().startsWith("utm_") ||
        ["fbclid", "gclid", "mc_cid", "mc_eid"].includes(key.toLowerCase())
      ) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    throw new Error(`Invalid reference canonical URL: ${rawUrl}`);
  }
}

/**
 * Keep useful complete descriptions, replacing URL dumps and visibly truncated
 * clipper excerpts with a stable summary.
 */
export function normalizeReferenceDescription(
  description: string | undefined,
  title: string
): string {
  const cleaned = description?.replace(/\s+/g, " ").trim();
  if (
    cleaned &&
    !URL_PATTERN.test(cleaned) &&
    !/(?:\.\.\.|…)$/u.test(cleaned) &&
    COMPLETE_DESCRIPTION_PATTERN.test(cleaned)
  ) {
    return cleaned;
  }

  return `Reference material for “${title}”, including the original source and supporting notes.`;
}

/**
 * Normalize the imported preamble while leaving transcript text untouched.
 */
export function normalizeReferenceMarkdown(
  body: string,
  title: string,
  canonicalURL: string
): string {
  const transcriptMatch = body.match(/^##\s+Transcript\s*$/im);
  const preambleEnd = transcriptMatch?.index ?? body.length;
  const preamble = body.slice(0, preambleEnd);
  const transcript = body.slice(preambleEnd);
  const videoId = youtubeVideoId(canonicalURL);
  const emittedYoutubeEmbeds = new Set<string>();
  let sawTimestampHeading = false;

  const normalizedLines = preamble.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";

    const videoImage = trimmed.match(/^!\[[^\]]*\]\((https?:\/\/[^)]+)\)$/);
    const imageVideoId = videoImage ? youtubeVideoId(videoImage[1]) : null;
    if (imageVideoId) {
      if (emittedYoutubeEmbeds.has(imageVideoId)) return "";
      emittedYoutubeEmbeds.add(imageVideoId);
      return youtubeEmbed(imageVideoId, title);
    }
    if (videoImage && !looksLikeImageUrl(videoImage[1])) {
      const url = normalizeResourceUrl(videoImage[1]);
      return `[View referenced content on ${linkLabelForUrl(url)}](${url})`;
    }

    const standaloneLink = trimmed.match(
      /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/
    );
    const linkedVideoId = standaloneLink
      ? youtubeVideoId(standaloneLink[2])
      : null;
    if (standaloneLink && linkedVideoId) {
      if (emittedYoutubeEmbeds.has(linkedVideoId)) return "";
      emittedYoutubeEmbeds.add(linkedVideoId);
      return youtubeEmbed(linkedVideoId, standaloneLink[1] || title);
    }

    const iframe = trimmed.match(
      /^<iframe\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*><\/iframe>$/i
    );
    const iframeVideoId = iframe ? youtubeVideoId(iframe[1]) : null;
    if (iframeVideoId) {
      if (emittedYoutubeEmbeds.has(iframeVideoId)) return "";
      emittedYoutubeEmbeds.add(iframeVideoId);
      return youtubeEmbed(iframeVideoId, title);
    }

    const heading = resourceHeading(trimmed);
    if (heading) {
      if (heading === "## Timestamps") sawTimestampHeading = true;
      return heading;
    }

    const timestamp = trimmed.match(
      /^(\d{1,2}):(\d{2})(?:\s*[-–—]\s*|\s+)(.+)$/
    );
    if (timestamp && videoId) {
      const seconds = Number(timestamp[1]) * 60 + Number(timestamp[2]);
      const label = timestamp[3].replace(/[?]\s*$/, "").trim();
      const timestampLink = `- [${timestamp[1]}:${timestamp[2]}](https://www.youtube.com/watch?v=${videoId}&t=${seconds}s) — ${label}`;
      if (!sawTimestampHeading) {
        sawTimestampHeading = true;
        return `## Timestamps\n\n${timestampLink}`;
      }
      return timestampLink;
    }

    const parenthesizedUrl = trimmed.match(
      /^(?:\\?[*-]\s+)?(.+?)\s+\((https?:\/\/[^)]+)\)$/
    );
    if (parenthesizedUrl) {
      return `- [${parenthesizedUrl[1].trim()}](${normalizeResourceUrl(parenthesizedUrl[2])})`;
    }

    const labeledUrl = splitLabeledUrl(trimmed);
    if (labeledUrl) {
      return `- [${labeledUrl.label}](${normalizeResourceUrl(labeledUrl.url)})`;
    }

    const bareUrl = trimmed.match(/^(?:[-*]\s+)?(https?:\/\/\S+)$/);
    if (bareUrl) {
      const url = normalizeResourceUrl(bareUrl[1]);
      const bareVideoId = youtubeVideoId(url);
      if (bareVideoId) {
        if (emittedYoutubeEmbeds.has(bareVideoId)) return "";
        emittedYoutubeEmbeds.add(bareVideoId);
        return youtubeEmbed(bareVideoId, title);
      }
      return `- [${linkLabelForUrl(url)}](${url})`;
    }

    if (/^[^\p{L}\p{N}]+$/u.test(trimmed)) return "";

    return line.replace(/[ \t]+$/g, "");
  });

  const cleanedPreamble = normalizedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const cleanedTranscript = transcript.trimStart();

  return `${cleanedPreamble}${cleanedTranscript ? `\n\n${cleanedTranscript}` : ""}`.trimEnd();
}

function resourceHeading(line: string): string | null {
  const withoutEmoji = line.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  const label = withoutEmoji.replace(/:\s*$/, "").trim();
  if (!label || label.length > 80 || URL_PATTERN.test(label)) return null;

  if (
    /links?\s*(?:&|and)?\s*resources?|resources? mentioned|links? mentioned/i.test(
      label
    )
  ) {
    return "## Links and resources mentioned";
  }
  if (/timestamps?/i.test(label)) return "## Timestamps";
  if (/^connect with me$/i.test(label)) return "### Connect with me";
  if (/^3d printed$/i.test(label)) return "### 3D-printed options";
  if (/^alternatives? menitoned$/i.test(label)) return "### Alternatives mentioned";
  if (
    /^(?:essays?|reading|platforms?|featured|tools?|materials?|websites?|socials?)/i.test(
      label
    )
  ) {
    return `### ${sentenceCase(label)}`;
  }
  return null;
}

function splitLabeledUrl(line: string): { label: string; url: string } | null {
  const match = line.match(
    /^(?:\\?[-*]\s+)?(.+?)\s*(?::|👉|\s[-–—])\s*(https?:\/\/\S+)\s*$/
  );
  if (!match || match[1].includes("](")) return null;

  const label = match[1].replace(/^[-*]\s+/, "").trim();
  return label ? { label, url: match[2] } : null;
}

function normalizeResourceUrl(rawUrl: string): string {
  const cleaned = unescapeMarkdownUrl(rawUrl)
    .replace(/[.,;:]+$/, "")
    .replace(/#$/, "");
  try {
    const url = new URL(cleaned);
    return url.toString();
  } catch {
    return cleaned;
  }
}

function unescapeMarkdownUrl(url: string): string {
  return url.trim().replace(/\\([_~.*])/g, "$1");
}

function youtubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(unescapeMarkdownUrl(rawUrl));
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (
      host !== "youtube.com" &&
      host !== "m.youtube.com" &&
      host !== "youtube-nocookie.com"
    ) {
      return null;
    }
    if (url.pathname === "/watch") return url.searchParams.get("v");

    const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function linkLabelForUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host.endsWith("youtube.com") || host === "youtu.be") return "YouTube";
    if (host.endsWith("instagram.com")) return "Instagram";
    if (host === "x.com" || host.endsWith("twitter.com")) return "X";
    return host;
  } catch {
    return "Source link";
  }
}

function looksLikeImageUrl(rawUrl: string): boolean {
  try {
    const url = new URL(unescapeMarkdownUrl(rawUrl));
    return /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function sentenceCase(value: string): string {
  const lower = value.replace(/\s*&\s*/g, " and ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function youtubeEmbed(videoId: string, title: string): string {
  const escapedTitle = title
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<iframe width="1024" height="576" src="https://www.youtube-nocookie.com/embed/${videoId}" title="${escapedTitle}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}
