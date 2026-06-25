---
title: "DevRelish Astro Plugin"
created: 2026-06-25T00:20:04-0400
type: note
tags:
  - dev/astro
updated: 2026-06-25T00:20:04-0400
slug: devrelish-astro-plugin
topics: ["astro", "community"]
status: seed
---
## Devlog: Turning DevRelish into an Astro Integration

While exploring alternatives to Meetup.com, I came across [Brian Rinaldi’s](https://remotesynthesis.com/) excellent open source project:

* [DevRelish](https://devrelish.tech/)
* [Introducing DevRelish](https://remotesynthesis.com/posts/introducting-devrelish/)

DevRelish is designed to help communities organize events, manage groups, and build local developer ecosystems without relying on commercial meetup platforms.

Since it was built with [Astro](https://astro.build/), I started wondering whether those capabilities could be packaged as an [Astro Integration](https://astro.build/integrations/) instead of requiring a completely separate application.

The result is [AstroDevRelish](https://github.com/SpaceCoastDevs/AstroDevRelish), an experiment focused on making [DevRel-ish-](https://github.com/remotesynth/DevRel-ish-) easier to integrate into existing Astro sites like [Space Coast Devs](https://space-coast.dev/).

## Commit History

[8df0f86 — Add DevRelish Integration](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/8df0f86)⁠￼

### What changed

Added the initial Astro Integration, including route definitions and configuration options.

### Why

This was the foundation for everything that followed. The original DevRelish project is a complete application. This commit started the process of turning it into something that can be installed and configured within an existing Astro site.

⸻

[9740c9a — Remove Netlify Adapter](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/9740c9a)⁠￼

### What changed

Removed the Netlify adapter from the Astro configuration.

### Why

An integration should not make assumptions about how the host application is deployed. Removing platform-specific dependencies is an important step toward making AstroDevRelish portable across different hosting providers.

⸻

[b6fcb9f — Refactor Project Structure](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/b6fcb9f)⁠￼

### What changed

Reorganized and refactored the codebase for improved readability and maintainability.

### Why

Before extracting reusable functionality, it was important to make the structure easier to navigate. This refactor helped identify which parts belong to the integration and which parts are specific to the original application.

⸻

[69d47fc — Update Routing Paths and Add Database Hooks](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/69d47fc)⁠￼

### What changed

* Updated integration entry points to use the new source structure.
* Added database setup hooks.
* Updated package management configuration.

### Why

This commit moved more of the startup and initialization logic into the integration itself. The database hooks are particularly important because they allow AstroDevRelish to provision and configure data requirements during installation rather than requiring manual setup steps.

⸻

[3e54fb0 — Add Playground Application](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/3e54fb0)⁠￼

### What changed

Added a dedicated playground application and supporting configuration.

### Why

As the integration becomes more independent from the original application, it needs a place where features can be tested in isolation. The playground serves as both a development environment and a future reference implementation.

⸻

[e38433b — Ignore PNPM Store](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/e38433b)⁠￼

### What changed

Added `.pnpm-store` to `.gitignore`.

### Why

A small housekeeping change due to my recent change in package management from npm to pnpm. The .pnpm-store directory is not needed in version control and can be safely ignored.

⸻

[85902ca — Improve Routing and URL Management](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/85902ca)⁠￼

### What changed

* Introduced a shared `withBase()` utility.
* Updated redirects and internal links throughout groups, gatherings, RSVPs, follows, and unsubscribe flows.
* Added favicon and Open Graph image endpoints.

### Why

One of the biggest assumptions in the original application is that it owns the site’s URL structure. An integration can’t make that assumption.

This commit centralizes URL generation so AstroDevRelish can be mounted under paths like:

`/community` or `/events` or`/meetups`

instead of assuming it controls the root of the site.

This is a major milestone toward making the project installable in existing Astro applications.

⸻

[5fdb7be — Make Database Layer Adapter Agnostic](https://github.com/SpaceCoastDevs/AstroDevRelish/commit/5fdb7be)⁠￼

### What changed

Removed assumptions about the underlying database implementation and began abstracting database access.

### Why

The original project relied on Astro DB. Since Astro DB has been deprecated, AstroDevRelish needs a more flexible and future-proof approach.

Making the database layer adapter agnostic allows communities to use the storage solution that best fits their environment while reducing dependence on framework-specific database tooling.

## Current Direction

At this point, AstroDevRelish is transitioning from a fork of DevRelish into a reusable Astro package.

The goal is to give existing Astro sites the ability to manage events, groups, organizers, speakers, and community engagement directly within their own websites.

For Space Coast Devs, that means eventually running more of the community platform from our own site instead of relying on external services.

For other communities, it could provide a path toward owning their event platform while still using the Astro ecosystem they already know and trust.

---

A huge thanks to [Brian Rinaldi](https://remotesynthesis.com/) for creating and open sourcing DevRelish. This experiment exists because that work was available to study, learn from, and build upon.