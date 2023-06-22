---
layout: post
title: Empty functions.config() in Firebase Functions
microblog: false
guid: http://gilcreque.micro.blog/2020/04/28/empty-functionsconfig-in.html
post_id: 1082059
date: 2020-04-28T01:23:18-0400
type: post
tags:
  - web-dev
  - firebase
url: /2020/04/28/empty-functionsconfig-in.html
lastmod: 2023-06-21T23:36:39.097Z
slug: empty-functions-config-firebase-functions
---
After upgrading `firebase-admin`, `firebase-functions`, and `typescript` and making some changes in my cloud functions to accommodate stricter types in `express`, I had one last nagging problem. When running `firebase serve` the functions would not load properly because `functions.config()` was returning an empty object. This was confusing because we make sure to create the `.runtimeconfig.json` file whenever we run `npm start` (which creates the file and then runs `firebase serve`). After several hours of digging around trying to figure out why this was happening I gave up for the day &hellip; or so I thought. I came back to this problem after laying in bed and came across [a comment left 6 hours ago](https://github.com/firebase/firebase-functions/issues/437#issuecomment-620278306) that got me pointed in the right direction. After running `npm list -depth=0` to see what the actual version of `firebase-tools` I was using (`@7.16.2`). I upgraded my Angular app and my Firebase functions app.

> `npm install --save-dev firebase-tools@latest`

This brought `firebase-tools` to version `@8.2.0` and everything started working again.
🍾 🎉
