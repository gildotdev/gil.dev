import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
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
  },
});
