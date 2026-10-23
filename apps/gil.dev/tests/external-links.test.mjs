import assert from "node:assert/strict";
import test from "node:test";

import {
  collectTopicExternalLinks,
  extractMarkdownLinks,
  normalizeExternalUrl,
} from "../src/lib/external-links.ts";

test("extracts Markdown and HTML anchors without treating images as links", () => {
  const links = extractMarkdownLinks(`
[Useful guide](https://example.com/guide)
![Diagram](https://example.com/diagram.png)
<a class="source" href="https://another.example/docs"><strong>HTML docs</strong></a>
`);

  assert.deepEqual(links, [
    { title: "Useful guide", url: "https://example.com/guide" },
    { title: "HTML docs", url: "https://another.example/docs" },
  ]);
});

test("normalizes tracking, fragments, and YouTube timestamp variants", () => {
  assert.equal(
    normalizeExternalUrl(
      "https://example.com/guide/?utm_source=garden&id=7#section",
    ),
    "https://example.com/guide?id=7",
  );
  assert.equal(
    normalizeExternalUrl("https://youtu.be/abc123?t=42"),
    "https://www.youtube.com/watch?v=abc123",
  );
  assert.equal(normalizeExternalUrl("https://gil.dev/about"), null);
  assert.equal(normalizeExternalUrl("/local-note"), null);
});

test("merges curated and discovered links with stable deduplication", () => {
  const links = collectTopicExternalLinks(
    [
      {
        data: {
          title: "Garden Note",
          canonicalURL: "https://example.com/guide#top",
        },
        body: `
[Duplicate guide](https://example.com/guide?utm_medium=note)
[Same guide over HTTP](http://www.example.com/guide)
[Timestamp](https://www.youtube.com/watch?v=abc123&t=45s)
[Same video](https://youtu.be/abc123)
[Internal](/garden-note)
`,
      },
    ],
    [{ title: "Curated guide", url: "https://example.com/guide/" }],
  );

  assert.deepEqual(links, [
    { title: "Curated guide", url: "https://example.com/guide" },
    { title: "Timestamp", url: "https://www.youtube.com/watch?v=abc123" },
  ]);
});
