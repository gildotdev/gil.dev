import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeFrontmatter,
  parseFrontmatter,
  serializeFrontmatter,
} from "../src/frontmatter.ts";

test("quotes YAML-sensitive scalar values", () => {
  const serialized = serializeFrontmatter({
    title: "Project: Blackbird",
    description: "+Full Build Write-up: https://example.com",
    author: ['[[Casi "Mods"]]'],
  });

  assert.match(serialized, /title: "Project: Blackbird"/);
  assert.match(
    serialized,
    /description: "\+Full Build Write-up: https:\/\/example.com"/
  );
  assert.match(serialized, /  - "\[\[Casi \\"Mods\\"\]\]"/);
});

test("round-trips quoted strings", () => {
  const frontmatter = {
    title: 'A "quoted" title',
    description: "Label: value",
    tags: ["one", "two: three"],
  };

  assert.deepEqual(parseFrontmatter(`${serializeFrontmatter(frontmatter)}\nBody`), frontmatter);
});

test("marks clippings as reference notes", () => {
  const fromFolder = normalizeFrontmatter(
    {},
    "Watch Source.md",
    0,
    0,
    "Clippings/Watch Source.md"
  );
  const fromTag = normalizeFrontmatter(
    { tags: ["clippings"] },
    "Watch Source.md",
    0,
    0
  );
  const explicitStage = normalizeFrontmatter(
    { tags: ["clippings"], status: "growing" },
    "Watch Source.md",
    0,
    0
  );

  assert.equal(fromFolder.status, "reference");
  assert.equal(fromTag.status, "reference");
  assert.equal(explicitStage.status, "growing");
});

test("publishes Obsidian status and topics as normalized note properties", () => {
  const normalized = normalizeFrontmatter(
    {
      status: " Growing ",
      topics: [" astro ", "community"],
    },
    "Astro Community.md",
    0,
    0
  );

  assert.equal(normalized.status, "growing");
  assert.deepEqual(normalized.topics, ["astro", "community"]);
});

test("adds garden defaults when status and topics are missing", () => {
  const normalized = normalizeFrontmatter({}, "New Idea.md", 0, 0);
  const serialized = serializeFrontmatter(normalized);

  assert.equal(normalized.status, "seed");
  assert.deepEqual(normalized.topics, []);
  assert.match(serialized, /topics: \[\]/);
  assert.match(serialized, /status: "seed"/);
});

test("accepts a single Obsidian topic value and rejects invalid statuses", () => {
  const normalized = normalizeFrontmatter(
    { topics: "astro", status: "finished" },
    "Astro Note.md",
    0,
    0
  );

  assert.deepEqual(normalized.topics, ["astro"]);
  assert.equal(normalized.status, "seed");
});
