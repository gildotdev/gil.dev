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
