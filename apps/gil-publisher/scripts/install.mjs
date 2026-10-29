#!/usr/bin/env node
/**
 * Installs the built plugin into an Obsidian vault.
 *
 * Vault resolution order:
 *   1. --vault /path/to/vault
 *   2. GIL_PUBLISHER_VAULT
 *   3. {repo root}/.gil-publisher-vault
 *
 * Pass --vault without a value to enter the path interactively. Press Tab in
 * the prompt to complete filesystem paths.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { createInterface } from "readline/promises";
import { fileURLToPath, pathToFileURL } from "url";

export const VAULT_ENV_VAR = "GIL_PUBLISHER_VAULT";
export const VAULT_CONFIG_FILE = ".gil-publisher-vault";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(pluginRoot, "../..");

export function expandHome(input) {
  if (input === "~") return os.homedir();
  if (input.startsWith(`~${path.sep}`)) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

export function readVaultConfig(configPath) {
  if (!fs.existsSync(configPath)) return undefined;

  return fs
    .readFileSync(configPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
}

export function parseVaultArgument(args) {
  const index = args.indexOf("--vault");
  if (index === -1) return { present: false, value: undefined };

  const candidate = args[index + 1];
  return {
    present: true,
    value: candidate && !candidate.startsWith("--") ? candidate : undefined,
  };
}

export function completePath(input, cwd = process.cwd()) {
  const expandedInput = expandHome(input);
  const absoluteInput = path.resolve(cwd, expandedInput || ".");
  const hasTrailingSeparator = input.endsWith(path.sep);
  const searchDir = hasTrailingSeparator
    ? absoluteInput
    : path.dirname(absoluteInput);
  const prefix = hasTrailingSeparator ? "" : path.basename(absoluteInput);

  let entries;
  try {
    entries = fs.readdirSync(searchDir, { withFileTypes: true });
  } catch {
    return [[], input];
  }

  const matches = entries
    .filter((entry) => entry.name.startsWith(prefix))
    .map((entry) => {
      const absoluteMatch = path.join(searchDir, entry.name);
      const withSeparator = entry.isDirectory()
        ? `${absoluteMatch}${path.sep}`
        : absoluteMatch;

      if (input.startsWith("~")) {
        return `~${withSeparator.slice(os.homedir().length)}`;
      }
      if (path.isAbsolute(input)) return withSeparator;

      const relative = `${path.relative(cwd, absoluteMatch)}${
        entry.isDirectory() ? path.sep : ""
      }`;
      return input.startsWith(`.${path.sep}`) ? `.${path.sep}${relative}` : relative;
    });

  return [matches, input];
}

async function promptForVault(defaultPath) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line) => completePath(line),
  });
  const defaultLabel = defaultPath ? ` [${defaultPath}]` : "";

  try {
    const answer = await readline.question(`Obsidian vault path${defaultLabel}: `);
    return answer.trim() || defaultPath;
  } finally {
    readline.close();
  }
}

export async function resolveVaultPath({
  args = process.argv.slice(2),
  env = process.env,
  configPath = path.join(repoRoot, VAULT_CONFIG_FILE),
} = {}) {
  const vaultArgument = parseVaultArgument(args);
  const configuredPath = env[VAULT_ENV_VAR] || readVaultConfig(configPath);

  let selectedPath;
  if (vaultArgument.value) {
    selectedPath = vaultArgument.value;
  } else if (vaultArgument.present) {
    if (!process.stdin.isTTY) {
      throw new Error(
        `--vault needs a path when input is not interactive. Set ${VAULT_ENV_VAR} or ${VAULT_CONFIG_FILE} instead.`
      );
    }
    selectedPath = await promptForVault(configuredPath);
  } else {
    selectedPath = configuredPath;
  }

  return selectedPath
    ? path.resolve(expandHome(selectedPath.trim()))
    : undefined;
}

function printUsage() {
  console.log(`Usage: pnpm plugin:install -- [--vault [path]]

Vault path sources, in precedence order:
  --vault /path/to/vault       Command-line value
  ${VAULT_ENV_VAR}             Environment variable
  ${VAULT_CONFIG_FILE}         Repository-local hidden file

Use --vault without a path for an interactive prompt with Tab completion.`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  let vaultPath;
  try {
    vaultPath = await resolveVaultPath({ args });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (!vaultPath) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault path does not exist: ${vaultPath}`);
    process.exitCode = 1;
    return;
  }

  const pluginDestDir = path.join(
    vaultPath,
    ".obsidian",
    "plugins",
    "gil-publisher"
  );
  fs.mkdirSync(pluginDestDir, { recursive: true });

  const filesToCopy = ["main.js", "manifest.json"];
  const optional = ["styles.css"];

  for (const file of filesToCopy) {
    const src = path.join(pluginRoot, file);
    if (!fs.existsSync(src)) {
      console.error(`Required file not found: ${src}\nRun "pnpm build" first.`);
      process.exitCode = 1;
      return;
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
  console.log('In Obsidian: Settings → Community plugins → enable "Gil Publisher"');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
