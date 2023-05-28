import { defineConfig } from "astro/config";
// https://astro.build/config
import tailwind from "@astrojs/tailwind";
import analogjsangular from "@analogjs/astro-angular";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), analogjsangular()]
});