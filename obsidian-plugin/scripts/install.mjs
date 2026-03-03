#!/usr/bin/env node
/**
 * Installs the built plugin into an Obsidian vault.
 *
 * Usage:
 *   node scripts/install.mjs --vault /path/to/vault
 *
 * This copies main.js and manifest.json to:
 *   {vault}/.obsidian/plugins/gil-publisher/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const vaultFlagIndex = args.indexOf("--vault");
if (vaultFlagIndex === -1 || !args[vaultFlagIndex + 1]) {
  console.error("Usage: node scripts/install.mjs --vault /path/to/vault");
  process.exit(1);
}

const vaultPath = args[vaultFlagIndex + 1];
const pluginDestDir = path.join(vaultPath, ".obsidian", "plugins", "gil-publisher");

if (!fs.existsSync(vaultPath)) {
  console.error(`Vault path does not exist: ${vaultPath}`);
  process.exit(1);
}

fs.mkdirSync(pluginDestDir, { recursive: true });

const filesToCopy = ["main.js", "manifest.json"];
const optional = ["styles.css"];

for (const file of filesToCopy) {
  const src = path.join(pluginRoot, file);
  if (!fs.existsSync(src)) {
    console.error(`Required file not found: ${src}\nRun "npm run build" first.`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(pluginDestDir, file));
  console.log(`Copied ${file} → ${pluginDestDir}/`);
}

for (const file of optional) {
  const src = path.join(pluginRoot, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(pluginDestDir, file));
    console.log(`Copied ${file} → ${pluginDestDir}/`);
  }
}

console.log(`\nPlugin installed to: ${pluginDestDir}`);
console.log("In Obsidian: Settings → Community plugins → enable \"Gil Publisher\"");
