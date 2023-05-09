import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import analogjsangular from "@analogjs/astro-angular";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), analogjsangular()]
});