import assert from "node:assert/strict";
import test from "node:test";

import {
  isDiscoverableNote,
  isPublishedNote,
  isReferenceNote,
} from "../src/lib/notes.ts";

test("reference-stage notes stay out of discovery listings", () => {
  const note = { status: "reference", tags: [] };

  assert.equal(isPublishedNote(note), true);
  assert.equal(isReferenceNote(note), true);
  assert.equal(isDiscoverableNote(note), false);
});

test("legacy clipping tags are treated as references", () => {
  assert.equal(isReferenceNote({ tags: ["Clippings"] }), true);
});

test("regular published notes remain discoverable", () => {
  assert.equal(
    isDiscoverableNote({ status: "growing", tags: ["watches"] }),
    true,
  );
  assert.equal(isDiscoverableNote({ draft: true, tags: [] }), false);
});
