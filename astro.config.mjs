import analogjsangular from "@analogjs/astro-angular";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), analogjsangular(), mdx()],
  markdown: { shikiConfig: { theme: "css-variables" } },
  assetsInclude: ["**/*.vtt"],
  server: { port: 1716, host: true },
});
