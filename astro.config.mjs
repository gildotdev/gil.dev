import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  experimental: {
    liveContentCollections: true,
  },
  output: "static",
  markdown: { shikiConfig: { theme: "css-variables" } },
  assetsInclude: ["**/*.vtt"],
  server: { port: 1716, host: true },
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    "/posts": "/posts/1",
    "/blog": "/posts/1",
  },
  // Live collections require an adapter for on-demand rendering
  adapter: netlify(),
});
