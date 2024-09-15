import angular from "@analogjs/astro-angular";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  markdown: { shikiConfig: { theme: "css-variables" } },
  assetsInclude: ["**/*.vtt"],
  server: { port: 1716, host: true },
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
});
