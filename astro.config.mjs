import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "static",
  markdown: { shikiConfig: { theme: "css-variables" } },
  assetsInclude: ["**/*.vtt"],
  server: { port: 1716, host: true },
  integrations: [tailwind(), mdx()],
});
