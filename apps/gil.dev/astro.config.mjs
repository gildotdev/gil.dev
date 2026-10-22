import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import { defineConfig } from "astro/config";
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';
import remarkWikilinks from './src/lib/remark-wikilinks.ts';

// https://astro.build/config
export default defineConfig({
  // Preserve spacing between inline elements across the Astro 7 upgrade.
  compressHTML: true,
  output: "static",
  markdown: {
    processor: unified({ remarkPlugins: [remarkWikilinks] }),
    shikiConfig: { theme: "css-variables" },
  },
  server: { port: 1716, host: true },
  integrations: [mdx()],
  vite: {
    assetsInclude: ["**/*.vtt"],
    plugins: [tailwindcss()],
  },
  redirects: {
    "/posts": "/posts/1",
    "/blog": "/posts/1",
  },
  // Live collections require an adapter for on-demand rendering
  adapter: netlify(),
});
