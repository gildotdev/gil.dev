import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRecursivePublicationPaths,
  isIgnoredVaultPath,
} from "../src/publication-plan.ts";

test("recursively publishes references without looping", async () => {
  const references = new Map([
    ["notes/watch.md", ["clippings/clip-one.md", "clippings/clip-two.md"]],
    ["clippings/clip-one.md", ["daily/2026-10-22.md"]],
    ["daily/2026-10-22.md", ["notes/watch.md"]],
  ]);

  assert.deepEqual(
    await buildRecursivePublicationPaths(
      ["notes/watch.md"],
      async (filePath) => references.get(filePath) ?? []
    ),
    [
      "notes/watch.md",
      "clippings/clip-one.md",
      "clippings/clip-two.md",
      "daily/2026-10-22.md",
    ]
  );
});

test("matches ignored folder names across common naming styles", () => {
  const ignored = [
    "Clients",
    "ai-work",
    "daily-notes",
    "codecraft-works",
    "codceraft-works",
  ];

  assert.equal(isIgnoredVaultPath("Clients/Acme/brief.md", ignored), true);
  assert.equal(isIgnoredVaultPath("AI Work/Daily/2026-10-22.md", ignored), true);
  assert.equal(isIgnoredVaultPath("Daily_Notes/today.md", ignored), true);
  assert.equal(isIgnoredVaultPath("CodeCraft Works/project.md", ignored), true);
  assert.equal(isIgnoredVaultPath("codceraft-works/project.md", ignored), true);
  assert.equal(isIgnoredVaultPath("clippings/watch.md", ignored), false);
});
