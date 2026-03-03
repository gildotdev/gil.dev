/**
 * remark-wikilinks
 *
 * A remark plugin that transforms any remaining [[wikilinks]] in Astro content
 * that were not pre-processed by the Obsidian publisher plugin.
 *
 * Supports:
 *   [[note]]          → <a href="/slug">note</a>
 *   [[note|alias]]    → <a href="/slug">alias</a>
 *   ![[image.png]]    → <img src="../../assets/image.png" alt="image.png">
 */
import { visit } from "unist-util-visit";
import type { Root, Text, Link, Image, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, extname, basename } from "path";

// ---------------------------------------------------------------------------
// Slug map (built lazily, cached for the build)
// ---------------------------------------------------------------------------

let cachedSlugMap: Map<string, string> | null = null;

function getSlugMap(): Map<string, string> {
  if (cachedSlugMap) return cachedSlugMap;
  cachedSlugMap = new Map();

  const notesDir = join(process.cwd(), "src", "content", "notes");
  if (!existsSync(notesDir)) return cachedSlugMap;

  const files = readdirSync(notesDir, { recursive: true, withFileTypes: true })
    .filter((d) => !d.isDirectory())
    .filter((d) => d.name.endsWith(".md") || d.name.endsWith(".mdx"));

  for (const dirent of files) {
    const filePath = join(notesDir, dirent.name);
    const slug = extractSlug(filePath, dirent.name);
    const stem = basename(dirent.name, extname(dirent.name));
    const title = extractTitle(filePath);

    cachedSlugMap.set(stem, slug);
    if (title && title.toLowerCase() !== stem.toLowerCase()) {
      cachedSlugMap.set(title, slug);
    }
  }

  return cachedSlugMap;
}

function extractSlug(filePath: string, fileName: string): string {
  try {
    const content = readFileSync(filePath, "utf-8");
    const match = content.match(/^---[\r\n]([\s\S]*?)[\r\n]---/);
    if (match) {
      const slugLine = match[1].match(/^slug:\s*(.+)$/m);
      if (slugLine) return slugLine[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // ignore
  }
  const stem = basename(fileName, extname(fileName));
  return stem
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractTitle(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const match = content.match(/^---[\r\n]([\s\S]*?)[\r\n]---/);
    if (match) {
      const titleLine = match[1].match(/^title:\s*(.+)$/m);
      if (titleLine) return titleLine[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // ignore
  }
  return null;
}

function resolveSlug(target: string, slugMap: Map<string, string>): string {
  const stem = basename(target, extname(target));

  if (slugMap.has(stem)) return slugMap.get(stem)!;

  const lower = stem.toLowerCase();
  for (const [key, slug] of slugMap) {
    if (key.toLowerCase() === lower) return slug;
  }

  for (const [key, slug] of slugMap) {
    if (key.toLowerCase() === target.toLowerCase()) return slug;
  }

  return target
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Remark plugin
// ---------------------------------------------------------------------------

const IMAGE_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp",
]);

function isImageRef(name: string): boolean {
  return IMAGE_EXTS.has(extname(name).toLowerCase());
}

const WIKILINK_REGEX = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?((?:\|[^\]]*)?)\]\]/g;

const remarkWikilinks: Plugin<[], Root> = () => {
  return (tree) => {
    const slugMap = getSlugMap();

    visit(tree, "text", (node: Text, index, parent) => {
      if (index === undefined || !parent) return;
      if (!node.value.includes("[[")) return;

      const newNodes: PhrasingContent[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      WIKILINK_REGEX.lastIndex = 0;
      const text = node.value;

      while ((match = WIKILINK_REGEX.exec(text)) !== null) {
        const [full, bang, target, aliasPart] = match;
        const before = text.slice(lastIndex, match.index);
        if (before) newNodes.push({ type: "text", value: before });

        const alias = aliasPart ? aliasPart.slice(1) : "";
        const trimmedTarget = target.trim();
        const isEmbed = bang === "!";

        if (isEmbed && isImageRef(trimmedTarget)) {
          const imgName = basename(trimmedTarget);
          const imgNode: Image = {
            type: "image",
            url: `../../assets/${imgName}`,
            alt: alias || imgName,
          };
          newNodes.push(imgNode);
        } else {
          const slug = resolveSlug(trimmedTarget, slugMap);
          const displayText = alias || trimmedTarget;
          const linkNode: Link = {
            type: "link",
            url: `/${slug}`,
            children: [{ type: "text", value: displayText }],
          };
          newNodes.push(linkNode);
        }

        lastIndex = match.index + full.length;
      }

      WIKILINK_REGEX.lastIndex = 0;

      if (newNodes.length === 0) return; // No wikilinks found

      const trailing = text.slice(lastIndex);
      if (trailing) newNodes.push({ type: "text", value: trailing });

      // Replace the text node with the expanded node list
      parent.children.splice(index, 1, ...newNodes);
    });
  };
};

export default remarkWikilinks;
