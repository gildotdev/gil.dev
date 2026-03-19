import type { Loader } from 'astro/loaders';

const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

export function micropubLoader(): Loader {
  return {
    name: 'micropub-loader',
    load: async ({ store, meta, logger }) => {
      const lastFetched = meta.get('lastFetched');
      const now = Date.now();

      if (lastFetched && now - parseInt(lastFetched) < CACHE_TTL_MS) {
        logger.info('micropub-loader: cache is still valid, skipping fetch');
        return;
      }

      const token = import.meta.env.SECRET_MICROBLOG_TOKEN;
      if (!token) {
        logger.warn('micropub-loader: SECRET_MICROBLOG_TOKEN is not set, skipping fetch');
        return;
      }

      logger.info('micropub-loader: fetching posts from micro.blog...');

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

      store.clear();

      for (const item of data.items) {
        const uid: string = item.properties.uid[0];
        store.set({
          id: uid,
          data: {
            uid,
            rawContent: item.properties.content?.[0] ?? '',
            published: item.properties.published[0],
            title:
              item.properties.name && item.properties.name[0] !== ''
                ? item.properties.name[0]
                : null,
            canonicalURL: item.properties.url[0],
            category: item.properties.category ?? [],
          },
        });
      }

      meta.set('lastFetched', now.toString());
      logger.info(`micropub-loader: loaded ${data.items.length} posts`);
    },
  };
}
