import type { LiveLoader } from 'astro/loaders';

const CACHE_MAX_AGE_SECONDS = 60 * 60; // 60 minutes

export interface MicroblogPost {
  uid: string;
  slug: string;
  rawContent: string;
  published: string;
  title: string | null | undefined;
  canonicalURL: string;
  category: string[];
}

function extractSlug(canonicalURL: string, fallback: string): string {
  try {
    // Strip leading slash and .html extension to get e.g. "2026/03/19/post-name"
    return new URL(canonicalURL).pathname.replace(/^\//, '').replace(/\.html?$/, '');
  } catch {
    return fallback;
  }
}

function mapItem(item: any): { id: string; data: MicroblogPost } {
  const uid: string = String(item.properties.uid[0]);
  const canonicalURL: string = item.properties.url[0];
  const slug = extractSlug(canonicalURL, uid);
  return {
    id: slug,
    data: {
      uid,
      slug,
      rawContent: item.properties.content?.[0] ?? '',
      published: item.properties.published[0],
      title: item.properties.name?.[0] || null,
      canonicalURL,
      category: item.properties.category ?? [],
    },
  };
}

async function fetchAllPosts(): Promise<any[]> {
  // Use process.env first (reliably available in Node.js at Netlify build time).
  // Fall back to import.meta.env for the Astro dev server.
  const token =
    process.env.SECRET_MICROBLOG_TOKEN ?? import.meta.env.SECRET_MICROBLOG_TOKEN;
  if (!token) return [];

  const response = await fetch('https://micro.blog/micropub?q=source', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `micropub-loader: failed to fetch posts: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}

export function micropubLoader(): LiveLoader<MicroblogPost, { id: string }> {
  // Memoize the fetch within a single loader lifecycle to avoid fetching
  // the full list repeatedly when loadEntry is called for multiple posts.
  let cachedItemsPromise: Promise<any[]> | null = null;

  const getItems = (): Promise<any[]> => {
    if (!cachedItemsPromise) {
      cachedItemsPromise = fetchAllPosts();
    }
    return cachedItemsPromise;
  };

  return {
    name: 'micropub-loader',
    loadCollection: async () => {
      const items = await fetchAllPosts();
      // Reset memo so a subsequent loadCollection always gets fresh data.
      cachedItemsPromise = null;
      return {
        entries: items.map(mapItem),
        cacheHint: { maxAge: CACHE_MAX_AGE_SECONDS },
      };
    },
    loadEntry: async ({ filter }) => {
      const items = await getItems();
      const item = items.find((p: any) => extractSlug(p.properties.url?.[0] ?? '', String(p.properties.uid[0])) === filter.id);
      if (!item) return undefined;
      return {
        ...mapItem(item),
        cacheHint: { maxAge: CACHE_MAX_AGE_SECONDS },
      };
    },
  };
}
