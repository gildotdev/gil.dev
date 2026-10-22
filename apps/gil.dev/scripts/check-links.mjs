import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(appRoot, "dist");
const siteOrigin = "https://gil.dev";
const serverRenderedPaths = new Set(["/blog", "/blog/", "/posts", "/posts/"]);
const baseUrlFlag = process.argv.indexOf("--base-url");
const liveBaseUrl =
  baseUrlFlag >= 0 && process.argv[baseUrlFlag + 1]
    ? new URL(process.argv[baseUrlFlag + 1])
    : null;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(entryPath) : entryPath;
    }),
  );
  return files.flat();
}

function routeForFile(filePath) {
  const relativePath = path.relative(distRoot, filePath);
  const directory = path.dirname(relativePath);

  if (path.basename(relativePath) === "index.html") {
    return directory === "." ? "/" : `/${directory.split(path.sep).join("/")}/`;
  }

  return `/${relativePath.split(path.sep).join("/")}`;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function localTargetExists(pathname) {
  if (serverRenderedPaths.has(pathname)) return true;

  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, "");
  const directPath = path.join(distRoot, relativePath);
  const candidates = [directPath];

  if (decodedPath.endsWith("/")) {
    candidates.push(path.join(directPath, "index.html"));
  } else if (!path.extname(decodedPath)) {
    candidates.push(path.join(directPath, "index.html"));
    candidates.push(`${directPath}.html`);
  }

  return (await Promise.all(candidates.map(exists))).some(Boolean);
}

const htmlFiles = (await walk(distRoot)).filter((file) => file.endsWith(".html"));
const brokenLinks = [];
const liveTargets = new Map();
let checkedLinks = 0;

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  const sourceRoute = routeForFile(htmlFile);
  const hrefPattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;

  for (const match of html.matchAll(hrefPattern)) {
    const href = match[2].trim();
    if (!href || href.startsWith("#")) continue;

    let target;
    try {
      target = new URL(href, `${siteOrigin}${sourceRoute}`);
    } catch {
      brokenLinks.push({ sourceRoute, href, resolvedPath: "invalid URL" });
      continue;
    }

    if (target.origin !== siteOrigin) continue;
    checkedLinks += 1;

    if (liveBaseUrl) {
      const targetPath = `${target.pathname}${target.search}`;
      const sources = liveTargets.get(targetPath) ?? new Set();
      sources.add(sourceRoute);
      liveTargets.set(targetPath, sources);
    } else if (!(await localTargetExists(target.pathname))) {
      brokenLinks.push({
        sourceRoute,
        href,
        resolvedPath: target.pathname,
      });
    }
  }
}

if (liveBaseUrl) {
  const targets = [...liveTargets.entries()];
  const concurrency = 10;

  for (let index = 0; index < targets.length; index += concurrency) {
    const batch = targets.slice(index, index + concurrency);
    const results = await Promise.all(
      batch.map(async ([targetPath, sources]) => {
        const url = new URL(targetPath, liveBaseUrl);
        try {
          const response = await fetch(url, { redirect: "follow" });
          return response.ok
            ? null
            : {
                sourceRoute: [...sources].join(", "),
                href: url.href,
                resolvedPath: `HTTP ${response.status}`,
              };
        } catch (error) {
          return {
            sourceRoute: [...sources].join(", "),
            href: url.href,
            resolvedPath: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );
    brokenLinks.push(...results.filter(Boolean));
  }
}

if (brokenLinks.length > 0) {
  console.error(`Found ${brokenLinks.length} broken internal link(s):`);
  for (const { sourceRoute, href, resolvedPath } of brokenLinks) {
    console.error(`- ${sourceRoute} -> ${href} (${resolvedPath})`);
  }
  process.exitCode = 1;
} else {
  const targetSummary = liveBaseUrl
    ? `${liveTargets.size} unique deployed URLs`
    : `${checkedLinks} internal links`;
  console.log(
    `Checked ${targetSummary} across ${htmlFiles.length} generated pages; all targets exist.`,
  );
}
