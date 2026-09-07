# Gil Creque’s Digital Garden

![A laptop and plants beneath a starry sky, representing a digital garden](public/img/gil-dev-digital-garden-banner.png)

This repository contains the source for [gil.dev](https://gil.dev): my personal digital garden for notes, experiments, and the things I am learning as a software engineer.

I’m a Director of Engineering and full-stack web developer at [Codecraft Works](https://www.codecraftworks.com/), where I lead development on an education technology platform. My work spans Astro, Firebase, Google Cloud, .NET, AWS, and STEM education. Outside of work, I help organize [Google Developer Group Space Coast](https://gdg.community.dev/gdg-space-coast/), [Space Coast Devs](https://space-coast.dev/), and contribute to [Space Coast Mesh](https://scmesh.org/). I also volunteer with [c11y](https://c11y.org/), a cybersecurity team for students in grades 6–12.

## What you’ll find here

The site is a place for small, useful pieces of work rather than a polished archive waiting for everything to be finished. Notes can be early seeds, actively growing ideas, or evergreen references.

Topics include:

* Web development and Astro
* Developer tooling and automation
* Cloud platforms, open source, and community technology
* Local developer-community work and cybersecurity education

New notes are also available through the [RSS feed](https://gil.dev/rss.xml).

## Colophon

This garden is intentionally built with a small, understandable stack:

* [Astro](https://astro.build/) powers the site and its content collections.
* [Netlify](https://www.netlify.com/) hosts and deploys it.
* Markdown and MDX keep notes close to the source code, so writing and maintaining the site share one workflow.
* And, occasionally, it is fueled by [burritos 🌯](https://gil.dev/chipotle).

The design goal is a site that feels personal, quick to load, and easy to keep tending. The content lives in [`src/content/notes`](src/content/notes), and the site pages, layouts, and components remain deliberately straightforward to modify.

## Run it locally

Use Node.js 22.22.3 (pinned in `.nvmrc`) and pnpm 11.5.2 (pinned in `package.json`). The supported Node ranges are 22.22.2+, 24.15.0+, or 26+ within the majors listed in `package.json`.

```bash
pnpm install
pnpm dev
```

The local development server runs at `http://localhost:1716` by default.

To create a production build:

```bash
pnpm build
```

Commit `pnpm-lock.yaml` with dependency changes. pnpm is the project's package manager; do not generate an npm lockfile.

Run `pnpm test` to check post HTML processing with Lambda's module-loading restrictions. jsdom stays on 26.x because newer releases require CommonJS-to-ESM loading that Lambda disables by default. Keep this check passing when upgrading it.

## Versioning and releases

[Release Please](https://github.com/googleapis/release-please-action) manages semantic versions, starting from the existing `0.0.1` version. Use Conventional Commits for commits merged into `main` (or for PR titles when squash merging):

* `fix: correct RSS links` bumps the patch version.
* `feat: add a topic index` bumps the minor version.
* `feat!: change public URLs` or a `BREAKING CHANGE:` footer bumps the major version, including before 1.0.0.
* `docs:`, `chore:`, and other non-release changes alone do not trigger a release.

After a successful build on `main`, the workflow opens or updates a release PR containing the version bump and `CHANGELOG.md`. Merge that PR to create the `vX.Y.Z` tag and GitHub release. The package remains private; the workflow does not publish to npm. Initial release history starts after the bootstrap commit recorded in `release-please-config.json`.

In GitHub Settings → Actions → General, enable **Allow GitHub Actions to create and approve pull requests**. The workflow uses the built-in `GITHUB_TOKEN`; PRs it creates do not trigger other GitHub Actions runs automatically. If branch protection requires PR checks, use a GitHub App token or a suitable personal access token for Release Please, or manually run the build workflow on the release branch. The release job only runs on `main` and is gated by a successful build.

## Add a note

Use the included script to create a note with the expected frontmatter:

```bash
pnpm new:note "A note title"
```

The new file is placed in `src/content/notes`. Update its tags, topics, and status as the idea develops.
