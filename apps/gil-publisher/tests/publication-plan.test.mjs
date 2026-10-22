import assert from "node:assert/strict";
import test from "node:test";

import { buildDirectPublicationPaths } from "../src/publication-plan.ts";

test("publishes direct references without traversing their links", () => {
  const references = new Map([
    ["notes/watch.md", ["clippings/clip-one.md", "clippings/clip-two.md"]],
    ["clippings/clip-one.md", ["daily/2026-10-22.md"]],
  ]);

  assert.deepEqual(
    buildDirectPublicationPaths(["notes/watch.md"], references),
    ["notes/watch.md", "clippings/clip-one.md", "clippings/clip-two.md"]
  );
});

test("includes direct references for every full-publish root", () => {
  const references = new Map([
    ["published/one.md", ["clippings/clip-one.md"]],
    ["published/two.md", ["clippings/clip-two.md"]],
  ]);

  assert.deepEqual(
    buildDirectPublicationPaths(
      ["published/one.md", "published/two.md"],
      references
    ),
    [
      "published/one.md",
      "published/two.md",
      "clippings/clip-one.md",
      "clippings/clip-two.md",
    ]
  );
});
