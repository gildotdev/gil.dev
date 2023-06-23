---
title: Using Pick<T,K> in TypeScript
microblog: false
guid: http://gilcreque.micro.blog/2020/04/21/using-picktk-in.html
post_id: 1077063
date: 2020-04-21T16:54:00-0400
type: note
tags:
  - web-dev
  - typescript
images:
  - https://cdn.uploads.micro.blog/7795/2020/67f6bb8830.png
photos: null
photos_with_metadata: null
url: /2020/04/21/using-picktk-in.html
lastmod: 2023-06-22T23:35:04.751Z
slug: pick-typescript
---
![Using Pick<T,K> in TypeScript](../../assets/67f6bb8830.png)


I used `Pick<T,K>` for the first time today in TypeScript. I had been using `Partial<T>` for a while to allow some properties of a class/interface to be used in other places in my application. After doing a lot more reading on TypeScript lately I decided to find a way to grab specific properties from a class/interface and lo and behold that’s what `Pick<T,K>` is for. I was going to do a write up on how I am using it but I [found a post that sums it up quite nicely](https://medium.com/codafication-blog/typescript-2-1-and-the-power-of-pick-ff433f1e6fb).
