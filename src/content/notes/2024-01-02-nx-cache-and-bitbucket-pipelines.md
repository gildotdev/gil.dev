---
title: NX Cache and Bitbucket Pipelines
description: When deploying an Angular application to Firebase Hosting using Bitbucket Pipelines, the NX cache was causing the build to fail.
draft: false
tags:
  - nx
  - bitbucket
lastmod: 2024-01-03T14:00:00Z
date: 2024-01-03T14:00:00Z
slug: nx-cache-and-bitbucket-pipelines
---

We recently added Nx to our Angular application. Nx is a set of extensible dev tools for monorepos. We were trying to deploy our application to Firebase Hosting using Bitbucket Pipelines. The build was failing because the NX cache was not being cleared. We were able to fix this by adding the following environment variable to our Bitbucket Pipelines configuration:

`NX_SKIP_NX_CACHE=true`

The problem is the cache is machine specific and we had different steps for building versus deploying and the cache was not being cleared between steps. We could have added a step to clear the cache, but we decided to skip the cache altogether.
