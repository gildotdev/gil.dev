---
title: Hosting an Astro Project on Firebase
description: Firebase announced at Google I/O 2023 that they were launching support for hosting Astro projects.
draft: false
tags:
  - google
  - firebase
  - astro
lastmod: 2023-07-17T21:59:00.594Z
date: 2023-07-17T13:00:00Z
slug: hosting-astro-on-firebase
---

Firebase announced at Google I/O 2023 that [they were launching support for hosting Astro projects](https://firebase.blog/posts/2023/05/whats-new-at-google-io/#deploy-astro-nuxt-sveltekit-with-firebase-hosting). This is great news for Astro developers as Firebase is a great platform for hosting static sites at it's free tier is generous. 

When I went to deploy my Astro SSR project to Firebase I could not get it to display when I went to the URL. I ran across [this Stack Overflow post](https://stackoverflow.com/questions/76699640/how-does-i-deploy-astro-ssr-to-firebase-hosting) hoping to find the answer but it had gone unanswered (it had only been lass than a day). After some digging around I did find the answer and I'm sharing it here in case anyone else runs into this issue.    

This isn't documented anywhere specifically for Astro but I followed [the Next.js instructions](https://firebase.google.com/docs/hosting/frameworks/nextjs#initialize_a_new_project) and the app is working. The key parts are:

> `firebase experiments:enable webframeworks`
>
> `firebase init hosting` and answer yes to "Do you want to use a web framework? (experimental)"

Then when you run `firebase deploy` you will see that the build process looks completely different. Hope this helps.

P.S. Austin Crim [responded to my answer](https://stackoverflow.com/a/76705301) with some additional information. I'm including it here for reference. I had my adapter mode set to `standalone` and it was working but the `middleware` mode seems like the correct one to use.


<span data-filename>`astro.config.mjs`</span>
```typescript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: "middleware"
  })
});
```