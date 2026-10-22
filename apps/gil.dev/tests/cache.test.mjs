import assert from "node:assert/strict";
import test from "node:test";

import { setMicroblogPageCacheHeaders } from "../src/lib/cache.ts";

test("caches Micro.blog pages at Netlify's durable edge cache", () => {
  const headers = new Headers();

  setMicroblogPageCacheHeaders(headers);

  assert.equal(
    headers.get("Cache-Control"),
    "public, max-age=0, must-revalidate",
  );
  assert.equal(
    headers.get("Netlify-CDN-Cache-Control"),
    "public, durable, s-maxage=3600, stale-while-revalidate=86400",
  );
});
