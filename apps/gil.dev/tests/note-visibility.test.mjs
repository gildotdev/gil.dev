import assert from "node:assert/strict";
import test from "node:test";

import {
  getNoteSummary,
  isDiscoverableNote,
  isPublishedNote,
  isReferenceNote,
  seededShuffle,
  selectGardenNotes,
  selectRelatedNotes,
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

const gardenNotes = [
  {
    id: "one",
    data: { title: "One", status: "seed", topics: ["astro"], tags: ["dev"] },
  },
  {
    id: "two",
    data: { title: "Two", status: "growing", topics: ["ai"], tags: ["dev"] },
  },
  {
    id: "three",
    data: { title: "Three", status: "evergreen", topics: ["community"], tags: [] },
  },
  {
    id: "four",
    data: { title: "Four", status: "seed", topics: ["astro"], tags: [] },
  },
];

test("seeded garden paths are stable and diverse", () => {
  assert.deepEqual(
    seededShuffle(gardenNotes, "today").map((note) => note.id),
    seededShuffle(gardenNotes, "today").map((note) => note.id),
  );

  const selected = selectGardenNotes(gardenNotes, 3, "today");
  assert.equal(new Set(selected.map((note) => note.data.status)).size, 3);
  assert.equal(new Set(selected.flatMap((note) => note.data.topics)).size, 3);
});

test("related paths prefer shared topics and tags", () => {
  const related = selectRelatedNotes(gardenNotes, gardenNotes[0], 2, "today");
  assert.equal(related[0].id, "four");
  assert.equal(related[1].id, "two");
});

test("note summaries remove markdown and truncate cleanly", () => {
  assert.equal(
    getNoteSummary(undefined, "# Heading\nA [useful](https://example.com) note.", 30),
    "Heading A useful note.",
  );
});
