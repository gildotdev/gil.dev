import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeCanonicalUrl,
  normalizeReferenceDescription,
  normalizeReferenceMarkdown,
  normalizeReferenceNote,
  transformYoutubeEmbeds,
} from "../src/reference-note.ts";

test("normalizes a YouTube reference preamble", () => {
  const input = `![](https://www.youtube.com/watch?v=TkdP_-83c8M&t=4s)

<iframe src="https://www.youtube-nocookie.com/embed/TkdP_-83c8M"></iframe>

🔗 LINKS & RESOURCES MENTIONED:

Essays & Reading Material:
Mark Bernstein's Essay: https://www.eastgate.com/garden/Enter.html
The Sweater Curse: https://en.wikipedia.org/wiki/Sweater\\_curse
⛅ Wild Geese Instagram - https://www.instagram.com/wildgeesepod/#

⏱️ TIMESTAMPS:
0:26 - What is a digital garden?
2:36 - History of digital gardens

## Transcript

**0:00** · Transcript text stays unchanged.`;

  const result = normalizeReferenceMarkdown(
    input,
    "Digital Gardening 101",
    "https://www.youtube.com/watch?v=TkdP_-83c8M"
  );

  assert.match(
    result,
    /^<iframe width="1024" height="576" src="https:\/\/www\.youtube-nocookie\.com\/embed\/TkdP_-83c8M"/
  );
  assert.equal(
    (result.match(/youtube-nocookie\.com\/embed\/TkdP_-83c8M/g) ?? []).length,
    1
  );
  assert.match(result, /## Links and resources mentioned/);
  assert.match(result, /### Essays and reading material/);
  assert.match(
    result,
    /- \[Mark Bernstein's Essay\]\(https:\/\/www\.eastgate\.com\/garden\/Enter\.html\)/
  );
  assert.match(
    result,
    /- \[The Sweater Curse\]\(https:\/\/en\.wikipedia\.org\/wiki\/Sweater_curse\)/
  );
  assert.match(
    result,
    /- \[⛅ Wild Geese Instagram\]\(https:\/\/www\.instagram\.com\/wildgeesepod\/\)/
  );
  assert.match(result, /## Timestamps/);
  assert.match(
    result,
    /- \[2:36\]\(https:\/\/www\.youtube\.com\/watch\?v=TkdP_-83c8M&t=156s\) — History of digital gardens/
  );
  assert.match(result, /## Transcript\n\n\*\*0:00\*\* · Transcript text stays unchanged\.$/);
});

test("embeds a referenced YouTube video when the canonical source is elsewhere", () => {
  const result = normalizeReferenceMarkdown(
    "### Watch the video version\n\n![](https://www.youtube.com/watch?v=lHQr5ingftk&si=tracking)",
    "Language Model Builder with Felix Rieseberg",
    "https://www.hanselminutes.com/1053/language-model-builder-with-felix-rieseberg"
  );

  assert.match(
    result,
    /<iframe width="1024" height="576" src="https:\/\/www\.youtube-nocookie\.com\/embed\/lHQr5ingftk"/
  );
  assert.doesNotMatch(result, /youtube\.com\/watch|si=tracking/);
});

test("embeds standalone YouTube links in regular notes without expanding inline links", () => {
  const result = transformYoutubeEmbeds(
    `Watch this:\n\n[Video walkthrough](https://youtu.be/lHQr5ingftk?si=tracking)\n\nKeep [this inline video](https://www.youtube.com/watch?v=another123) as a link.`,
    "Fallback title"
  );

  assert.match(
    result,
    /<iframe width="1024" height="576" src="https:\/\/www\.youtube-nocookie\.com\/embed\/lHQr5ingftk" title="Video walkthrough"/
  );
  assert.doesNotMatch(result, /si=tracking/);
  assert.match(
    result,
    /Keep \[this inline video\]\(https:\/\/www\.youtube\.com\/watch\?v=another123\) as a link\./
  );
});

test("normalizes arrow links, tool lists, decorated headings, and timestamp groups", () => {
  const result = normalizeReferenceMarkdown(
    `![](https://youtu.be/abc123)

▼ ▽ LINKS MENTIONED IN VIDEO
Watch module 👉 https://example.com/module

🤖 3D Printed
\\* Printed case (https://example.com/case)

00:51 Strap Removal
01:31 Logo Mod

## Transcript
Body`,
    "Watch & Build",
    "https://www.youtube.com/watch?v=abc123"
  );

  assert.match(result, /title="Watch &amp; Build"/);
  assert.match(result, /## Links and resources mentioned/);
  assert.match(result, /- \[Watch module\]\(https:\/\/example\.com\/module\)/);
  assert.match(result, /### 3D-printed options/);
  assert.match(result, /- \[Printed case\]\(https:\/\/example\.com\/case\)/);
  assert.match(result, /## Timestamps/);
  assert.match(result, /watch\?v=abc123&t=91s\) — Logo Mod/);
});

test("turns non-image URLs using image syntax into descriptive links", () => {
  assert.equal(
    normalizeReferenceMarkdown(
      "![](https://x.com/example/status/123)",
      "An article",
      "https://example.com/article"
    ),
    "[View referenced content on X](https://x.com/example/status/123)"
  );
});

test("sets a clean canonical URL and replaces truncated descriptions", () => {
  const result = normalizeReferenceNote(
    {
      title: "Digital Gardening 101",
      slug: "digital-gardening-101",
      created: "2026-10-01T00:00:00+0000",
      updated: "2026-10-01T00:00:00+0000",
      tags: ["clippings"],
      topics: [],
      status: "reference",
      source: "https://www.youtube.com/watch?v=TkdP_-83c8M&t=4s#watching",
      description: "LINKS: https://example.com and more conte",
    },
    "Reference body"
  );

  assert.equal(
    result.frontmatter.canonicalURL,
    "https://www.youtube.com/watch?v=TkdP_-83c8M"
  );
  assert.equal(
    result.frontmatter.description,
    "Reference material for “Digital Gardening 101”, including the original source and supporting notes."
  );
});

test("keeps complete reference descriptions", () => {
  assert.equal(
    normalizeReferenceDescription(
      "A complete introduction to digital gardening.",
      "Digital Gardening 101"
    ),
    "A complete introduction to digital gardening."
  );
});

test("normalizes canonical tracking parameters and requires a reference source", () => {
  assert.equal(
    normalizeCanonicalUrl("https://example.com/article?utm_source=test&id=7#section"),
    "https://example.com/article?id=7"
  );

  assert.throws(
    () =>
      normalizeReferenceNote(
        {
          title: "Missing Source",
          slug: "missing-source",
          created: "2026-10-01T00:00:00+0000",
          updated: "2026-10-01T00:00:00+0000",
          tags: [],
          topics: [],
          status: "reference",
        },
        "Body"
      ),
    /requires a source or canonicalURL/
  );
});
