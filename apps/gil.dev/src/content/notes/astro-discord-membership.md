---
title: "Astro Discord Membership"
created: 2026-08-12T10:00:00-0400
type: note
tags:
  - dev/astro
  - discord
  - community
updated: 2026-08-12T10:00:00-0400
slug: astro-discord-membership
topics: ["astro", "community"]
status: growing
---

## Devlog: Bringing Community Membership into an Astro Site

[Astro Discord Membership](https://github.com/SpaceCoastDevs/astro-discord-membership) is an Astro integration for communities that use Discord as their front door but want to make membership visible and useful on their own website.

The project adds Discord OAuth, a Discord-server membership check, member profiles, a public directory, email verification, and optional Discord notifications. The goal is not to replace Discord. It is to give a community a home for its member information that it owns and can shape around its own site.

For a group like [Space Coast Devs](https://space-coast.dev/), that means someone can sign in with Discord, create a public-facing profile, and appear in a searchable member directory without making a third-party membership platform the center of the experience.

## How the Integration Works

The package registers the routes it needs during Astro configuration, including:

* `/members` and `/members/[username]` for the public directory and profiles.
* `/profile` for a member to manage their information.
* Discord authentication and email-verification API routes.
* `/admin/labels` for managing the categories and labels members can use on their profiles.

It deliberately leaves persistence to the host application. A site provides a `MembershipDatabaseAdapter`, which keeps the integration independent of a particular database. The repository includes adapters for [Firestore](https://firebase.google.com/docs/firestore) and [Drizzle](https://orm.drizzle.team/), plus a SQLite-backed playground for local development.

The package also exports individual components—such as `MemberDirectory`, `MemberCard`, `LatestMembers`, and `MemberSpotlight`—so a host site can use the ready-made routes or build a more custom experience from the same pieces.

## First Public Release Candidate

[932d0a6 — Release v0.1.0-rc.1](https://github.com/SpaceCoastDevs/astro-discord-membership/commit/932d0a6) introduced the first public release candidate on July 25, 2026.

### What changed

The release included:

* Discord authentication and a guild-membership gate.
* Public profiles, a directory, and profile editing.
* A time-limited six-digit email-verification flow.
* Label categories for describing members by interests, skills, or other community-defined attributes.
* Firestore and Drizzle persistence adapters.
* Package-owned styles that can be disabled when a host site supplies its own theme.
* A SQLite playground and Playwright coverage for exercising the integration in a real Astro app.

### Why

Community membership involves more than authentication. A usable directory needs identity, visibility controls, profile data, and a way to describe what people are interested in. Email verification adds a second confirmation step for information that lives beyond Discord, while the adapter boundary keeps the project portable for different community sites.

The playground is particularly important here. An Astro integration needs to work inside another application’s configuration, routing, database setup, and deployment model—not only inside its own repository.

⸻

[e762066 — Prepare the v0.1.0-rc.1 release workflow](https://github.com/SpaceCoastDevs/astro-discord-membership/commit/e762066) completed the release setup.

### What changed

Updated the publishing workflow so GitHub Releases can publish the package through npm Trusted Publishing.

### Why

The release process uses OIDC instead of a long-lived npm token. That keeps publishing tied to a reviewed GitHub release while reducing the number of credentials the project needs to maintain.

## Current Direction

Astro Discord Membership is at the release-candidate stage, with version `0.1.0-rc.1` published as `@space-coast-devs/astro-discord-membership`.

The next measure of success is not simply adding more features. It is making the integration straightforward for another Astro site to install, configure with its own storage, and style as part of its existing community experience.

For Space Coast Devs, it is a step toward a more connected community site: Discord stays where conversations happen, while the website becomes a place to discover the people behind the community.
