---
title: gcloud builds submit Error
description: When attempting to build and deploy a Docker image to Google Cloud Run I ran into an error that I couldn't find any information on.
draft: false
tags:
  - google
  - cloud-run
  - docker
lastmod: 2023-11-08T19:35:00.004Z
date: 2023-11-08T19:35:00.004Z
slug: gcloud-builds-submit-error
---

```console
denied: Token exchange failed for project 'project-name'. Caller does not have permission or the resource may not exist 'storage.buckets.get'. To configure permissions, follow instructions at: https://cloud.google.com/container-registry/docs/access-control
ERROR: push attempt 10 detected failure, retrying: step exited with non-zero status: 1
ERROR: failed to push because we ran out of retries.
ERROR
ERROR: error pushing image "gcr.io/project-name/container-name": generic::unknown: retry budget exhausted (10 attempts): step exited with non-zero status: 1
```

These are the steps I took to resolve the issue:

1. Uninstall `google-cloud-sdk` [https://cloud.google.com/sdk/docs/uninstall-cloud-sdk](https://cloud.google.com/sdk/docs/uninstall-cloud-sdk)
2. Reinstall `google-cloud-sdk` via the bash script [https://cloud.google.com/sdk/docs/downloads-interactive#linux-and-macos](https://cloud.google.com/sdk/docs/downloads-interactive#linux-and-macos)
`curl https://sdk.cloud.google.com | bash`
3. Reinstall Docker Credential Helper

```console
gcloud auth configure-docker
gcloud components install docker-credential-gcr
docker-credential-gcr configure-docker
 ```
