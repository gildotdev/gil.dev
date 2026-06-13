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
import { transformWikilinks, isImageFile, type SlugMap } from "./wikilink";
import type { ReferencedImage } from "./wikilink";

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
    if (isInIgnoredFolder(file.path, ignoredFolders)) continue;

    const stem = path.basename(file.path, path.extname(file.path));
    const slug = frontmatterSlugOrDerived(app, file);
    const entry = { slug, sourcePath: file.path };

    // Register by stem
    map.set(stem, entry);

    // Also register by title if different
    const title = frontmatterTitle(app, file);
    if (title && title.toLowerCase() !== stem.toLowerCase()) {
      map.set(title, entry);
    }
  }

  return map;
}

/**
 * Build the set of vault-relative paths that qualify for publishing
 * (inside publishFolder, not in ignoredFolders).
 * Used to filter wikilinks when publishing individual notes.
 */
export function buildPublishedPaths(app: App, settings: PluginSettings): Set<string> {
  const files = app.vault.getMarkdownFiles();
  return new Set(
    files
      .filter((f) => !isInIgnoredFolder(f.path, settings.ignoredFolders))
      .filter((f) => isInPublishFolder(f.path, settings.publishFolder))
      .map((f) => f.path)
  );
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
  const publishedPaths = buildPublishedPaths(app, settings);

  for (const file of files) {
    if (isInIgnoredFolder(file.path, settings.ignoredFolders)) {
      result.skipped.push(file.path);
      continue;
    }

    if (!isInPublishFolder(file.path, settings.publishFolder)) {
      result.skipped.push(file.path);
      continue;
    }

    try {
      onProgress?.(`Publishing ${file.path}…`);
      await publishFile(app, file, settings, slugMap, publishedPaths);
      result.published.push(file.path);
    } catch (err) {
      result.errors.push({ file: file.path, error: String(err) });
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
    stat?.mtime ?? Date.now()
  );

  // Strip old frontmatter and transform wikilinks
  const body = stripFrontmatter(raw);
  const imageAssetsSubpath = buildImageRelativePath(settings);
  const { transformed, referencedImages } = transformWikilinks(
    body,
    slugMap,
    imageAssetsSubpath,
    publishedPaths,
    slugifyFilename
  );

  // Copy referenced images to the assets directory
  const assetsDir = path.join(settings.targetRepoPath, settings.imageTargetSubpath);
  await ensureDir(assetsDir);

  for (const img of referencedImages) {
    await copyImage(app, img, assetsDir);
  }

  // Write the transformed note using a slugified filename
  const notesDir = path.join(settings.targetRepoPath, settings.notesTargetSubpath);
  await ensureDir(notesDir);

  const outputName = slugifyFilename(file.name);
  const outputPath = path.join(notesDir, outputName);
  const outputContent = serializeFrontmatter(normalizedFm) + "\n\n" + transformed;
  fs.writeFileSync(outputPath, outputContent, "utf-8");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isInIgnoredFolder(filePath: string, ignoredFolders: string[]): boolean {
  if (ignoredFolders.length === 0) return false;
  const parts = filePath.split("/");
  return parts.some((part) => ignoredFolders.includes(part));
}

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

async function copyImage(app: App, img: ReferencedImage, destDir: string): Promise<void> {
  // vaultPath may be a vault-relative path or just a filename
  const { vaultPath, destName } = img;
  const vaultFiles = app.vault.getFiles();
  const match = vaultFiles.find(
    (f) =>
      f.path === vaultPath ||
      f.name === path.basename(vaultPath) ||
      (isImageFile(f.name) && f.name === vaultPath)
  );
  if (!match) return; // Image not found in vault — skip silently

  const data = await app.vault.readBinary(match);
  const destPath = path.join(destDir, destName);
  fs.writeFileSync(destPath, Buffer.from(data));
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
 *   notes: src/content/notes   → ../../assets
 *   images: src/assets
 */
function buildImageRelativePath(settings: PluginSettings): string {
  return path.relative(settings.notesTargetSubpath, settings.imageTargetSubpath);
}
