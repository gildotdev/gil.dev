---
title: Problems deploying your Docker container?
guid: http://gilcreque.micro.blog/2022/10/31/are-you-having.html
date: 2022-10-31T13:54:00-0400
type: note
url: /2022/10/31/are-you-having.html
slug: problems-deploying-google-cloud-run-container
description: Does your Google Cloud Run container run fine locally but it won't start when deployed and revisioned?
lastmod: 2023-06-23T02:03:09.661Z
tags:
  - cloud-run
  - google-cloud
  - docker
---
Does it run fine locally but it won't start when deployed and revisioned? Are you using an M1 Mac? You likely need to add this target flag to your `docker build` command.

`--platform linux/amd64`

```bash
docker build --platform linux/amd64
```

[https://stackoverflow.com/a/68766137/332586](https://stackoverflow.com/a/68766137/332586)
