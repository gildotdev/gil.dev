const ONE_HOUR_SECONDS = 60 * 60;
const ONE_DAY_SECONDS = 24 * ONE_HOUR_SECONDS;

/**
 * Cache public Micro.blog-backed pages at Netlify's edge while keeping browser
 * caches revalidating normally. The durable cache lets regions share a warm
 * function response, and stale-while-revalidate keeps refreshes off the
 * visitor's critical path.
 */
export function setMicroblogPageCacheHeaders(headers: Headers): void {
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  headers.set(
    "Netlify-CDN-Cache-Control",
    `public, durable, s-maxage=${ONE_HOUR_SECONDS}, stale-while-revalidate=${ONE_DAY_SECONDS}`,
  );
}
