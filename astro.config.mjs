import { defineConfig } from "astro/config";
// https://astro.build/config
import angular from "@analogjs/astro-angular";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [
    tailwind(),
    angular({
      vite: {
        tsconfig: "tsconfig.app.json",
        workspaceRoot: "rootDir",
      },
    }),
  ],
});
