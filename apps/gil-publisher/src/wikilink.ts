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

export interface ReferencedAttachment {
  /** Vault-relative link target used to locate the source file in the vault. */
  vaultPath: string;
  /** Final filename to write on disk and reference in the markdown URL. */
  destName: string;
  /** Whether the attachment can be rendered with Markdown image syntax. */
  isImage: boolean;
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
 * - [[document.pdf]]     → [document.pdf](../../assets/document.pdf)
 * - ![[document.pdf]]    → [document.pdf](../../assets/document.pdf)
 *
 * @param content             Raw markdown body (no frontmatter)
 * @param slugMap             Pre-built map of filename-stem/title → SlugEntry
 * @param imageAssetsSubpath  Relative path from a note to the assets dir
 * @param publishedPaths      Set of vault-relative source paths that are published.
 * @param imageNameTransform  Optional fn to transform the image filename (e.g. slugify).
 */
export function transformWikilinks(
  content: string,
  slugMap: SlugMap,
  imageAssetsSubpath = "../../assets",
  publishedPaths?: Set<string>,
  imageNameTransform?: (name: string) => string
): { transformed: string; referencedAttachments: ReferencedAttachment[] } {
  const referencedAttachments: ReferencedAttachment[] = [];

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
      const entry = resolveEntry(trimmedTarget, slugMap);

      if (!entry && isAttachmentFile(trimmedTarget)) {
        const attachmentName = path.basename(trimmedTarget);
        const destName = imageNameTransform
          ? imageNameTransform(attachmentName)
          : attachmentName;
        const isImage = isImageFile(trimmedTarget);
        referencedAttachments.push({
          vaultPath: trimmedTarget,
          destName,
          isImage,
        });
        const displayText = alias || attachmentName;
        // Slugified names are already URL-safe; encode originals that may have spaces.
        const urlName = imageNameTransform
          ? destName
          : attachmentName.split("/").map(encodeURIComponent).join("/");
        const url = `${imageAssetsSubpath}/${urlName}`;
        return isEmbed && isImage
          ? `![${displayText}](${url})`
          : `[${displayText}](${url})`;
      }

      // Regular link or non-image embed — resolve and check publish status
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

  return { transformed, referencedAttachments };
}

/**
 * Return the unique Markdown notes referenced by Obsidian wikilinks in content.
 * Attachments are intentionally excluded from the note dependency graph.
 */
export function extractReferencedNotes(
  content: string,
  slugMap: SlugMap
): SlugEntry[] {
  const references = new Map<string, SlugEntry>();
  const wikilinkRegex = /!?\[\[([^\]|#]+)(?:#[^\]|]*)?((?:\|[^\]]*)?)\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = wikilinkRegex.exec(content)) !== null) {
    const target = match[1].trim();
    const entry = resolveEntry(target, slugMap);
    if (entry) references.set(entry.sourcePath, entry);
  }

  return [...references.values()];
}

function isAttachmentFile(name: string): boolean {
  const extension = path.extname(name).toLowerCase();
  return extension !== "" && extension !== ".md" && extension !== ".mdx";
}

/**
 * Resolve a wikilink target to its SlugEntry.
 * Resolution order:
 *   1. Exact filename stem match
 *   2. Case-insensitive filename stem match
 *   3. Case-insensitive title match
 *   4. Returns null if unresolvable
 */
export function resolveEntry(target: string, slugMap: SlugMap): SlugEntry | null {
  const normalizedTarget = target.replace(/\\/g, "/");
  const withoutExtension = normalizedTarget.replace(/\.mdx?$/i, "");
  if (slugMap.has(normalizedTarget)) return slugMap.get(normalizedTarget)!;
  if (slugMap.has(withoutExtension)) return slugMap.get(withoutExtension)!;

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
