import { access, mkdir, open } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const notesDir = path.join(repoRoot, "src", "content", "notes");

const args = process.argv.slice(2);
const title = args.join(" ").trim();

if (!title) {
  console.error('Usage: npm run new:note -- "My note title"');
  process.exit(1);
}

const slug = slugify(title);
const created = formatTimestamp(new Date());
const filePath = await nextAvailablePath(path.join(notesDir, `${slug}.md`));

const template = `---
title: ${quoteYaml(title)}
created: ${created}
type: note
tags:
  - inbox
updated: ${created}
slug: ${slug}
topics: []
status: seed
---

`;

await mkdir(notesDir, { recursive: true });

const file = await open(filePath, "wx");
try {
  await file.writeFile(template, "utf8");
} finally {
  await file.close();
}

console.log(path.relative(repoRoot, filePath));

if (process.env.VSCODE_CLI === "1") {
  const child = spawn("code", ["--reuse-window", filePath], {
    detached: true,
    stdio: "ignore",
  });
  child.on("error", () => {});
  child.unref();
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatTimestamp(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}${timeZoneOffset(date, values)}`;
}

function timeZoneOffset(date, values) {
  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  const offsetMinutes = Math.round((zonedAsUtc - date.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");

  return `${sign}${hours}${minutes}`;
}

function quoteYaml(value) {
  return JSON.stringify(value);
}

async function nextAvailablePath(initialPath) {
  const parsed = path.parse(initialPath);

  for (let index = 0; ; index += 1) {
    const candidate =
      index === 0
        ? initialPath
        : path.join(parsed.dir, `${parsed.name}-${index + 1}${parsed.ext}`);

    try {
      await access(candidate);
    } catch (error) {
      if (error.code === "ENOENT") {
        return candidate;
      }

      throw error;
    }

    continue;
  }
}
