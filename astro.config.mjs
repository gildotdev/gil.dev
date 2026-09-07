import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  // Preserve spacing between inline elements across the Astro 7 upgrade.
  compressHTML: true,
  output: "static",
  markdown: { shikiConfig: { theme: "css-variables" } },
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
