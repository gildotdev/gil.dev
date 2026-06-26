---
title: "Rebase Only The Last Few Commits Onto A Branch"
created: 2026-06-25T23:16:31-0400
type: note
tags:
  - dev/git
updated: 2026-06-25T23:16:31-0400
slug: rebase-only-the-last-few-commits-onto-a-branch
topics: []
status: seed
---

Suppose you have a branch with a few commits on top of a divergent branch, and you want to rebase only the last few commits onto `main`. You can use the `git rebase` command with the `--onto` option. The following command rebases the last 4 commits onto the `main` branch:

```shell
git rebase --onto main HEAD~4
```
