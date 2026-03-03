import path from "path";

/**
 * A map from a lookup key (filename stem or title) to (slug, sourcePath).
 * Used to resolve [[wikilinks]] to URL slugs.
 */
export interface SlugEntry {
  slug: string;
  sourcePath: string;
}

export type SlugMap = Map<string, SlugEntry>;

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp", ".tiff",
]);

/**
 * Returns true if the filename looks like an image asset.
 */
export function isImageFile(name: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase());
}

/**
 * Transform all Obsidian wikilinks and image embeds in `content`.
 *
 * - [[note]]             → [note](/{slug})      if note is published
 * - [[note]]             → note                 if note is outside publishedPaths
 * - [[note|alias]]       → [alias](/{slug})     if note is published
 * - [[note|alias]]       → alias                if note is outside publishedPaths
 * - ![[image.png]]       → ![image.png](../../assets/image.png)
 * - ![[image.png|alt]]   → ![alt](../../assets/image.png)
 *
 * @param content          Raw markdown body (no frontmatter)
 * @param slugMap          Pre-built map of filename-stem/title → SlugEntry
 * @param imageAssetsSubpath  Relative path from a note to the assets dir
 * @param publishedPaths   Set of vault-relative source paths that are published.
 *                         When provided, wikilinks to paths outside this set
 *                         are rendered as plain text rather than anchor tags.
 *                         Omit (or pass undefined) to link everything.
 */
export function transformWikilinks(
  content: string,
  slugMap: SlugMap,
  imageAssetsSubpath = "../../assets",
  publishedPaths?: Set<string>
): { transformed: string; referencedImages: string[] } {
  const referencedImages: string[] = [];

  // Match both image embeds (![[...]]) and regular links ([[...]])
  // Capture group 1: "!" if present (image embed)
  // Capture group 2: target
  // Capture group 3: alias (optional, after |)
  const wikilinkRegex = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?((?:\|[^\]]*)?)\]\]/g;

  const transformed = content.replace(
    wikilinkRegex,
    (_, bang: string, target: string, aliasPart: string) => {
      const isEmbed = bang === "!";
      const alias = aliasPart ? aliasPart.slice(1) : ""; // strip leading "|"
      const trimmedTarget = target.trim();

      if (isEmbed && isImageFile(trimmedTarget)) {
        const imgName = path.basename(trimmedTarget);
        referencedImages.push(trimmedTarget);
        const displayAlt = alias || imgName;
        return `![${displayAlt}](${imageAssetsSubpath}/${imgName})`;
      }

      // Regular link or non-image embed — resolve and check publish status
      const entry = resolveEntry(trimmedTarget, slugMap);
      const displayText = alias || trimmedTarget;

      if (!entry) {
        // Completely unresolvable — render as plain text
        return displayText;
      }

      if (publishedPaths && !publishedPaths.has(entry.sourcePath)) {
        // Resolved but outside the publish folder — render as plain text
        return displayText;
      }

      return `[${displayText}](/${entry.slug})`;
    }
  );

  return { transformed, referencedImages };
}

/**
 * Resolve a wikilink target to its SlugEntry.
 * Resolution order:
 *   1. Exact filename stem match
 *   2. Case-insensitive filename stem match
 *   3. Case-insensitive title match
 *   4. Returns null if unresolvable
 */
function resolveEntry(target: string, slugMap: SlugMap): SlugEntry | null {
  const stem = path.basename(target, path.extname(target));

  // 1. Exact key match
  if (slugMap.has(stem)) return slugMap.get(stem)!;

  // 2. Case-insensitive key match
  const lower = stem.toLowerCase();
  for (const [key, entry] of slugMap) {
    if (key.toLowerCase() === lower) return entry;
  }

  // 3. Title match (slugMap also stores titles as keys)
  for (const [key, entry] of slugMap) {
    if (key.toLowerCase() === target.toLowerCase()) return entry;
  }

  return null;
}
