import angular from "@analogjs/astro-angular";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  server: {port: 1234},
  integrations: [
    tailwind(),
    angular({
      vite: {
        inlineStylesExtension: "scss|sass|less",
        ssr: {
          // transform these packages during SSR. Globs supported
          noExternal: ["@rx-angular/**"],
        },
      },
    }),
    mdx(),
  ],
  markdown: { shikiConfig: { theme: "css-variables" } },
});
