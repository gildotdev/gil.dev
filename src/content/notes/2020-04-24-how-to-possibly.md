---
layout: post
title: How to possibly fix your npm globally installed binary not being found
microblog: false
guid: http://gilcreque.micro.blog/2020/04/24/how-to-possibly.html
post_id: 1079760
date: 2020-04-24T22:09:01-0400
type: post
tags:
  - web-dev
url: /2020/04/24/how-to-possibly.html
lastmod: 2023-06-21T23:35:23.905Z
slug: possibly-fix-npm-globally-installed-binary
---
This line in my `~/.npmrc` file has been killing my sanity for longer than I want to admit. 

> `prefix=/Users/myusername/.nvm/versions/node/v10.0.0`

If your globally installed npm binaries are not being found it could be because somehow you have a prefix set like the one above. I'm using nvm and I could not figure this out. All I had to do was delete this line and my binaries were finally installing in to the correct directory. I slayed the beast just now thanks to [this handy issue comment](https://github.com/nvm-sh/nvm/issues/1954#issuecomment-442275974).


