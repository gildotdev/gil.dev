import fs from "fs";
import path from "path";
import type { App, TFile } from "obsidian";
import type { PluginSettings } from "./settings";
import { parseFrontmatter } from "./frontmatter";
import { isImageFile } from "./wikilink";

export interface SyncResult {
  synced: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
  imagesSynced: number;
  imagesSkipped: number;
}

/**
 * Sync notes from the Astro repo back into the Obsidian vault.
 * Conflict resolution: overwrite only if the repo note has a strictly newer lastmod.
 * Images referenced in the notes are copied to the vault's configured attachment folder
 * and their links are rewritten to Obsidian wikilink syntax (![[image.ext]]).
 */
export async function syncFromRepo(
  app: App,
  settings: PluginSettings,
  onProgress?: (msg: string) => void
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: [],
    skipped: [],
    errors: [],
    imagesSynced: 0,
    imagesSkipped: 0,
  };

  if (!settings.targetRepoPath) {
    result.errors.push({ file: "", error: "Target repo path is not configured." });
    return result;
  }

  const notesDir = path.join(settings.targetRepoPath, settings.notesTargetSubpath);

  let repoFiles: Array<{ abs: string; rel: string }>;
  try {
    repoFiles = walkMarkdownFiles(notesDir);
  } catch {
    result.errors.push({ file: notesDir, error: "Notes directory not found in repo." });
    return result;
  }

  // Ensure vault destination folder exists (creates parent segments as needed)
  await ensureVaultFolder(app, settings.publishFolder);

  // Resolve attachment folder once for the whole sync
  const attachmentFolder = resolveAttachmentFolder(app);
  let attachmentFolderEnsured = false;

  for (const { abs: repoFilePath, rel: relPath } of repoFiles) {
    // relPath uses the OS separator — normalise to forward slashes for vault paths
    const vaultRelPath = settings.publishFolder
      ? `${settings.publishFolder}/${relPath.split(path.sep).join("/")}`
      : relPath.split(path.sep).join("/");

    let repoContent: string;
    try {
      repoContent = fs.readFileSync(repoFilePath, "utf-8");
    } catch (err) {
      result.errors.push({ file: relPath, error: String(err) });
      continue;
    }

    const repoFm = parseFrontmatter(repoContent);
    const repoLastmod = typeof repoFm.lastmod === "string" ? repoFm.lastmod : undefined;

    const vaultFile = app.vault.getAbstractFileByPath(vaultRelPath);

    if (vaultFile) {
      // File exists in vault — check if repo is newer
      const vaultContent = await app.vault.read(vaultFile as TFile);
      const vaultFm = parseFrontmatter(vaultContent);
      const vaultLastmod = typeof vaultFm.lastmod === "string" ? vaultFm.lastmod : undefined;

      if (!shouldOverwrite(repoLastmod, vaultLastmod)) {
        onProgress?.(`Skipping ${relPath} (vault is same or newer)`);
        result.skipped.push(relPath);
        continue;
      }
    }

    // Copy referenced images
    const imageNames = extractImageNames(repoContent);
    if (imageNames.length > 0) {
      if (!attachmentFolderEnsured) {
        await ensureVaultFolder(app, attachmentFolder);
        attachmentFolderEnsured = true;
      }

      for (const imageName of imageNames) {
        const repoImgPath = path.join(
          settings.targetRepoPath,
          settings.imageTargetSubpath,
          imageName
        );

        if (!fs.existsSync(repoImgPath)) {
          result.imagesSkipped++;
          continue;
        }

        const attachmentPath = attachmentFolder
          ? `${attachmentFolder}/${imageName}`
          : imageName;

        if (app.vault.getAbstractFileByPath(attachmentPath)) {
          result.imagesSkipped++;
          continue;
        }

        try {
          const imgBuffer = fs.readFileSync(repoImgPath);
          await app.vault.adapter.writeBinary(attachmentPath, imgBuffer.buffer as ArrayBuffer);
          result.imagesSynced++;
        } catch (err) {
          result.errors.push({ file: imageName, error: String(err) });
        }
      }
    }

    // Rewrite image links to Obsidian wikilink syntax before writing to vault
    const vaultContent = rewriteImageLinks(repoContent);

    // Ensure any intermediate subdirectory exists in the vault
    const parentFolder = vaultRelPath.includes("/")
      ? vaultRelPath.slice(0, vaultRelPath.lastIndexOf("/"))
      : "";
    await ensureVaultFolder(app, parentFolder);

    // Write the note to the vault
    try {
      if (vaultFile) {
        await app.vault.modify(vaultFile as TFile, vaultContent);
      } else {
        await app.vault.create(vaultRelPath, vaultContent);
      }
      onProgress?.(`Synced ${relPath}`);
      result.synced.push(relPath);
    } catch (err) {
      result.errors.push({ file: relPath, error: String(err) });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively walk a directory and return all .md/.mdx files as
 * { abs: absolute path, rel: path relative to the root dir }.
 */
function walkMarkdownFiles(
  dir: string,
  base = dir
): Array<{ abs: string; rel: string }> {
  const results: Array<{ abs: string; rel: string }> = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(abs, base));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
    ) {
      results.push({ abs, rel: path.relative(base, abs) });
    }
  }

  return results;
}

/**
 * Rewrite markdown image links to Obsidian wikilink syntax.
 * ![alt](../../assets/image.png) → ![[image.png]]
 */
function rewriteImageLinks(content: string): string {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, _alt, src) => {
    const name = path.basename(src);
    if (isImageFile(name)) {
      return `![[${name}]]`;
    }
    return match;
  });
}

function shouldOverwrite(
  repoLastmod: string | undefined,
  vaultLastmod: string | undefined
): boolean {
  if (!repoLastmod) return false; // can't determine repo age — skip
  if (!vaultLastmod) return true; // vault has no date — repo wins

  const repoMs = Date.parse(repoLastmod);
  const vaultMs = Date.parse(vaultLastmod);

  if (isNaN(repoMs) || isNaN(vaultMs)) return false; // unparseable — skip

  return repoMs > vaultMs; // overwrite only if repo is strictly newer
}

function resolveAttachmentFolder(app: App): string {
  const configured = (app.vault as unknown as { getConfig: (k: string) => unknown })
    .getConfig("attachmentFolderPath") as string | undefined;

  if (!configured || configured === "/" || configured === "") return "";

  // "./" prefix means relative to current note — treat as vault root for batch ops
  if (configured.startsWith("./")) return configured.slice(2);

  return configured;
}

function extractImageNames(content: string): string[] {
  const IMAGE_LINK_REGEX = /!\[[^\]]*\]\(([^)]+)\)/g;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = IMAGE_LINK_REGEX.exec(content)) !== null) {
    const name = path.basename(match[1]);
    if (isImageFile(name) && !seen.has(name)) {
      seen.add(name);
    }
  }

  return Array.from(seen);
}

/**
 * Ensure a vault folder and all its parent segments exist.
 * Creates each path component in order so nested paths work correctly.
 */
async function ensureVaultFolder(app: App, folderPath: string): Promise<void> {
  if (!folderPath) return;

  const parts = folderPath.split("/").filter(Boolean);
  let current = "";

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(current)) {
      await app.vault.createFolder(current);
    }
  }
}
