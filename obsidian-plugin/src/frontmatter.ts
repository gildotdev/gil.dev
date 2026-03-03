import path from "path";

/**
 * Represents the normalized frontmatter fields we inject/guarantee
 * for the Astro content schema.
 */
export interface NormalizedFrontmatter {
  title: string;
  slug: string;
  date: string;
  lastmod: string;
  tags: string[];
  draft?: boolean;
  [key: string]: unknown;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;

/**
 * Parse the YAML frontmatter from a markdown string.
 * Returns the fields as a plain object using a naive line-by-line parser
 * (avoids a heavy YAML dep inside the Obsidian plugin bundle).
 */
export function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) return {};
  return parseSimpleYaml(match[1]);
}

/**
 * Strip the existing frontmatter block and return the body.
 */
export function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_REGEX, "").replace(/^\r?\n/, "");
}

/**
 * Serialize a frontmatter object back to a YAML block string.
 */
export function serializeFrontmatter(fm: Record<string, unknown>): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${String(item)}`);
        }
      }
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

/**
 * Given a file's existing frontmatter + file metadata, return a complete
 * frontmatter object satisfying the Astro notes schema.
 */
export function normalizeFrontmatter(
  existing: Record<string, unknown>,
  fileName: string,
  ctime: number,
  mtime: number
): NormalizedFrontmatter {
  const slug =
    typeof existing.slug === "string" && existing.slug
      ? existing.slug
      : fileNameToSlug(fileName);

  const title =
    typeof existing.title === "string" && existing.title
      ? existing.title
      : slugToTitle(slug);

  const date =
    typeof existing.date === "string" && existing.date
      ? ensureDateFormat(existing.date)
      : formatDate(ctime);

  const lastmod =
    typeof existing.lastmod === "string" && existing.lastmod
      ? ensureDateFormat(existing.lastmod)
      : formatDate(mtime);

  const tags: string[] = Array.isArray(existing.tags)
    ? (existing.tags as string[]).map(String)
    : [];

  const result: NormalizedFrontmatter = {
    ...existing,
    title,
    slug,
    date,
    lastmod,
    tags,
  };

  // Remove undefined values
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) delete result[key];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fileNameToSlug(fileName: string): string {
  // Strip directory, extension, and optional YYYY-MM-DD- prefix
  const base = path.basename(fileName, path.extname(fileName));
  return base
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a Unix timestamp (ms) as YYYY-MM-DDTHH:mm:ss+HHMM.
 * The schema regex requires no colon in the tz offset.
 */
function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const tzOffset = -d.getTimezoneOffset(); // minutes
  const sign = tzOffset >= 0 ? "+" : "-";
  const absOffset = Math.abs(tzOffset);
  const tzHH = pad(Math.floor(absOffset / 60));
  const tzMM = pad(absOffset % 60);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${tzHH}${tzMM}`
  );
}

/**
 * Ensure an existing date string matches YYYY-MM-DDTHH:mm:ss±HHMM.
 * If it already matches, return as-is.
 * If it ends with ±HH:MM (colon in offset), strip the colon.
 * If it's a plain YYYY-MM-DD, append T00:00:00+0000.
 */
function ensureDateFormat(raw: string): string {
  const exactMatch = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{4}$/.test(raw);
  if (exactMatch) return raw;

  // ISO 8601 with colon in offset: 2025-07-18T00:00:00-05:00
  const colonOffset = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}):(\d{2})$/);
  if (colonOffset) return colonOffset[1] + colonOffset[2];

  // ISO 8601 with Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(raw)) {
    return raw.replace("Z", "+0000");
  }

  // Plain date
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00+0000`;
  }

  // Try to parse as a date and reformat
  const parsed = Date.parse(raw);
  if (!isNaN(parsed)) return formatDate(parsed);

  return raw;
}

/**
 * Very simple YAML parser that handles the subset used in Obsidian frontmatter:
 *  - key: scalar value
 *  - key:
 *      - item
 *      - item
 *  - key: true/false/null
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)?$/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const rest = keyMatch[2]?.trim() ?? "";

    if (rest === "" || rest === "|" || rest === ">") {
      // Possibly a sequence or block scalar — look ahead
      const items: string[] = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s+-\s+/, "").trim();
        // Strip surrounding quotes
        items.push(item.replace(/^['"]|['"]$/g, ""));
        i++;
      }
      result[key] = items;
    } else if (rest === "null") {
      result[key] = null;
      i++;
    } else if (rest === "true") {
      result[key] = true;
      i++;
    } else if (rest === "false") {
      result[key] = false;
      i++;
    } else if (/^\[.*\]$/.test(rest)) {
      // Inline array: [a, b, c]
      const inner = rest.slice(1, -1);
      result[key] = inner
        ? inner.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        : [];
      i++;
    } else {
      // Scalar — strip surrounding quotes
      result[key] = rest.replace(/^['"]|['"]$/g, "");
      i++;
    }
  }

  return result;
}
