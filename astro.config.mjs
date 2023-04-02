import { defineConfig } from "astro/config";
// https://astro.build/config
import analogjsangular from "@analogjs/astro-angular";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), analogjsangular(), mdx()],
});
