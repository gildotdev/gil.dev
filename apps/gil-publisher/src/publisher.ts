import fs from "fs";
import path from "path";
import slugify from "slugify";
import type { App, TFile } from "obsidian";
import type { PluginSettings } from "./settings";
import {
  parseFrontmatter,
  stripFrontmatter,
  serializeFrontmatter,
  normalizeFrontmatter,
} from "./frontmatter";
import {
  extractReferencedNotes,
  transformWikilinks,
  isImageFile,
  type ReferencedAttachment,
  type SlugMap,
} from "./wikilink";
import {
  buildRecursivePublicationPaths,
  isIgnoredVaultPath,
} from "./publication-plan";
import { normalizeReferenceNote } from "./reference-note";

export interface PublishResult {
  published: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
}

/**
 * Build a SlugMap by scanning all markdown files in the vault.
 * Each file contributes two keys: its filename stem and its frontmatter title.
 */
export function buildSlugMap(app: App, ignoredFolders: string[]): SlugMap {
  const map: SlugMap = new Map();
  const files = app.vault.getMarkdownFiles();

  for (const file of files) {
    if (isIgnoredVaultPath(file.path, ignoredFolders)) continue;

    const stem = path.basename(file.path, path.extname(file.path));
    const slug = frontmatterSlugOrDerived(app, file);
    const entry = { slug, sourcePath: file.path };
    const normalizedPath = file.path.replace(/\\/g, "/");
    const pathWithoutExtension = normalizedPath.replace(/\.mdx?$/i, "");

    // Register path-qualified targets before the shorter aliases so links such
    // as [[clippings/example]] resolve even when filenames repeat elsewhere.
    map.set(normalizedPath, entry);
    map.set(pathWithoutExtension, entry);

    // Register by stem
    if (!map.has(stem)) map.set(stem, entry);

    // Also register by title if different
    const title = frontmatterTitle(app, file);
    if (title && title.toLowerCase() !== stem.toLowerCase()) {
      if (!map.has(title)) map.set(title, entry);
    }
  }

  return map;
}

/**
 * Publish all qualifying markdown files in the vault.
 */
export async function publishAll(
  app: App,
  settings: PluginSettings,
  onProgress?: (msg: string) => void
): Promise<PublishResult> {
  const result: PublishResult = { published: [], skipped: [], errors: [] };

  if (!settings.targetRepoPath) {
    result.errors.push({ file: "", error: "Target repo path is not configured." });
    return result;
  }

  const slugMap = buildSlugMap(app, settings.ignoredFolders);
  const files = app.vault.getMarkdownFiles();
  const roots = files.filter(
    (file) =>
      !isIgnoredVaultPath(file.path, settings.ignoredFolders) &&
      isInPublishFolder(file.path, settings.publishFolder)
  );
  const publication = await buildPublicationSet(app, roots, slugMap);

  for (const file of publication.files) {
    try {
      onProgress?.(`Publishing ${file.path}…`);
      await publishFile(app, file, settings, slugMap, publication.paths);
      result.published.push(file.path);
    } catch (err) {
      result.errors.push({ file: file.path, error: String(err) });
    }
  }

  for (const file of files) {
    if (!publication.paths.has(file.path)) result.skipped.push(file.path);
  }

  return result;
}

/**
 * Publish one note plus all non-ignored Markdown notes reachable through its
 * wikilinks. Cycles are safe and ignored folders are hard traversal boundaries.
 */
export async function publishFileWithRelated(
  app: App,
  file: TFile,
  settings: PluginSettings,
  onProgress?: (msg: string) => void
): Promise<PublishResult> {
  const result: PublishResult = { published: [], skipped: [], errors: [] };

  if (!settings.targetRepoPath) {
    result.errors.push({ file: "", error: "Target repo path is not configured." });
    return result;
  }

  if (isIgnoredVaultPath(file.path, settings.ignoredFolders)) {
    result.skipped.push(file.path);
    return result;
  }

  const slugMap = buildSlugMap(app, settings.ignoredFolders);
  const publication = await buildPublicationSet(app, [file], slugMap);

  for (const relatedFile of publication.files) {
    try {
      onProgress?.(`Publishing ${relatedFile.path}…`);
      await publishFile(
        app,
        relatedFile,
        settings,
        slugMap,
        publication.paths
      );
      result.published.push(relatedFile.path);
    } catch (err) {
      result.errors.push({ file: relatedFile.path, error: String(err) });
    }
  }

  return result;
}

/**
 * Publish a single TFile to the Astro repo.
 * @param publishedPaths  Optional set of vault-relative paths considered published.
 *                        Wikilinks pointing outside this set render as plain text.
 */
export async function publishFile(
  app: App,
  file: TFile,
  settings: PluginSettings,
  slugMap: SlugMap,
  publishedPaths?: Set<string>
): Promise<void> {
  const raw = await app.vault.read(file);
  const stat = await app.vault.adapter.stat(file.path);

  // Parse and normalize frontmatter
  const existingFm = parseFrontmatter(raw);
  const normalizedFm = normalizeFrontmatter(
    existingFm,
    file.name,
    stat?.ctime ?? Date.now(),
    stat?.mtime ?? Date.now(),
    file.path
  );

  // Strip old frontmatter and transform wikilinks
  const body = stripFrontmatter(raw);
  const imageAssetsSubpath = buildImageRelativePath(settings);
  const { transformed, referencedAttachments } = transformWikilinks(
    body,
    slugMap,
    imageAssetsSubpath,
    publishedPaths,
    slugifyFilename
  );
  const normalizedReference = normalizeReferenceNote(normalizedFm, transformed);

  // Copy referenced images to the assets directory
  const assetsDir = path.join(settings.targetRepoPath, settings.imageTargetSubpath);
  await ensureDir(assetsDir);

  const copiedAttachments = new Set<string>();
  for (const attachment of referencedAttachments) {
    if (copiedAttachments.has(attachment.destName)) continue;
    await copyAttachment(app, attachment, assetsDir, file.path);
    copiedAttachments.add(attachment.destName);
  }

  // Write the transformed note using a slugified filename
  const notesDir = path.join(settings.targetRepoPath, settings.notesTargetSubpath);
  await ensureDir(notesDir);

  const outputName = slugifyFilename(file.name);
  const outputPath = path.join(notesDir, outputName);
  const outputContent =
    serializeFrontmatter(normalizedReference.frontmatter) +
    "\n\n" +
    normalizedReference.body;
  fs.writeFileSync(outputPath, outputContent, "utf-8");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the file should be published based on the publishFolder setting.
 * If publishFolder is empty, all files qualify.
 * Otherwise, the file must live directly inside (or nested under) publishFolder.
 */
function isInPublishFolder(filePath: string, publishFolder: string): boolean {
  if (!publishFolder) return true;
  const prefix = publishFolder.endsWith("/") ? publishFolder : publishFolder + "/";
  return filePath.startsWith(prefix);
}

function frontmatterSlugOrDerived(app: App, file: TFile): string {
  const cache = app.metadataCache.getFileCache(file);
  const fm = cache?.frontmatter ?? {};
  if (typeof fm.slug === "string" && fm.slug) return fm.slug;
  const stem = path.basename(file.path, path.extname(file.path));
  const withoutDate = stem.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const slug = slugify(withoutDate, { lower: true, strict: true, trim: true });
  return slug.slice(0, 64).replace(/-+$/, "");
}

function frontmatterTitle(app: App, file: TFile): string | null {
  const cache = app.metadataCache.getFileCache(file);
  const fm = cache?.frontmatter ?? {};
  return typeof fm.title === "string" ? fm.title : null;
}

async function copyAttachment(
  app: App,
  attachment: ReferencedAttachment,
  destDir: string,
  sourcePath: string
): Promise<void> {
  // Prefer Obsidian's own resolver so relative links and duplicate filenames
  // resolve the same way they do inside the source note.
  const { vaultPath, destName } = attachment;
  const vaultFiles = app.vault.getFiles();
  const resolved = app.metadataCache.getFirstLinkpathDest(vaultPath, sourcePath);
  const match = resolved ?? vaultFiles.find(
    (candidate) =>
      candidate.path === vaultPath ||
      candidate.name === path.basename(vaultPath) ||
      (isImageFile(candidate.name) && candidate.name === vaultPath)
  );
  if (!match) {
    throw new Error(`Referenced attachment not found: ${vaultPath}`);
  }

  const data = await app.vault.readBinary(match);
  const destPath = path.join(destDir, destName);
  fs.writeFileSync(destPath, Buffer.from(data));
}

async function buildPublicationSet(
  app: App,
  roots: TFile[],
  slugMap: SlugMap
): Promise<{ files: TFile[]; paths: Set<string> }> {
  const markdownByPath = new Map(
    app.vault.getMarkdownFiles().map((file) => [file.path, file])
  );
  const uniqueRootPaths = [...new Set(roots.map((file) => file.path))];
  const plannedPaths = await buildRecursivePublicationPaths(
    uniqueRootPaths,
    async (filePath) => {
      const file = markdownByPath.get(filePath);
      if (!file) return [];

      const raw = await app.vault.read(file);
      return extractReferencedNotes(stripFrontmatter(raw), slugMap).map(
        (reference) => reference.sourcePath
      );
    }
  );
  const files = plannedPaths
    .map((filePath) => markdownByPath.get(filePath))
    .filter((file): file is TFile => file !== undefined);
  const paths = new Set(files.map((file) => file.path));

  return { files, paths };
}

/**
 * Slugify a filename, preserving the extension.
 * e.g. "My Note (Draft).md" → "my-note-draft.md"
 *      "Screenshot 2026-02-26 at 12.38.01 PM.png" → "screenshot-2026-02-26-at-12-38-01-pm.png"
 */
function slugifyFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const stem = path.basename(filename, path.extname(filename));
  const slugged = slugify(stem, { lower: true, strict: true, trim: true });
  return slugged + ext;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Build the relative path string from a note (in notesTargetSubpath)
 * up to the images directory (imageTargetSubpath).
 *
 * Example:
 *   notes: apps/gil.dev/src/content/notes   → ../../assets
 *   images: apps/gil.dev/src/assets
 */
function buildImageRelativePath(settings: PluginSettings): string {
  return path.relative(settings.notesTargetSubpath, settings.imageTargetSubpath);
}
