import assert from "node:assert/strict";
import test from "node:test";

import {
  extractReferencedNotes,
  transformWikilinks,
} from "../src/wikilink.ts";

const clip = {
  slug: "clip-one",
  sourcePath: "clippings/Clip One.md",
};

const slugMap = new Map([
  ["clippings/Clip One", clip],
  ["Clip One", clip],
]);

test("transforms related notes and collects image and file attachments", () => {
  const result = transformWikilinks(
    "See [[clippings/Clip One|the clip]], ![[Photo One.PNG|photo]], and [[Manual.pdf]].",
    slugMap,
    "../../assets",
    new Set([clip.sourcePath]),
    (name) => name.toLowerCase().replaceAll(" ", "-")
  );

  assert.equal(
    result.transformed,
    "See [the clip](/clip-one), ![photo](../../assets/photo-one.png), and [Manual.pdf](../../assets/manual.pdf)."
  );
  assert.deepEqual(result.referencedAttachments, [
    { vaultPath: "Photo One.PNG", destName: "photo-one.png", isImage: true },
    { vaultPath: "Manual.pdf", destName: "manual.pdf", isImage: false },
  ]);
});

test("extracts each related note once, including note names ending in punctuation", () => {
  const punctuatedClip = {
    slug: "a-new-kind-of-smart-watch",
    sourcePath: "clippings/a new kind of Smart Watch..md",
  };
  const map = new Map([
    ...slugMap,
    ["clippings/a new kind of Smart Watch.", punctuatedClip],
  ]);

  const references = extractReferencedNotes(
    "[[clippings/Clip One]] and [[Clip One]] and [[clippings/a new kind of Smart Watch.]]",
    map
  );

  assert.deepEqual(references, [clip, punctuatedClip]);
});

test("keeps a resolvable but unpublished note as plain text", () => {
  const result = transformWikilinks(
    "See [[clippings/Clip One|the clip]].",
    slugMap,
    "../../assets",
    new Set()
  );

  assert.equal(result.transformed, "See the clip.");
});
