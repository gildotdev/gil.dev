# Changelog

Release Please maintains this file from Conventional Commits when preparing a release.

## Unreleased

### Changed

- Reorganized the repository as a pnpm monorepo with the Astro site in `apps/gil.dev` and the Obsidian plugin in `apps/gil-publisher`.
- Centralized dependency installation, workspace commands, CI validation, and build-script approvals at the repository root.
- Updated Gil Publisher defaults and legacy-setting migration for the site's new monorepo paths.
- Updated Gil Publisher to recursively publish wikilinked notes and their attachments while treating configured ignored folders as hard traversal boundaries.
- Quoted generated YAML scalar values so clipping metadata containing colons, quotes, or URLs remains valid Astro frontmatter.
- Added root-level, monorepo-aware Netlify build and publish configuration for the Astro app.
- Updated the Astro stack and GitHub Actions workflow, including pnpm dependency caching and a compatible Node.js pin.
- Added a `reference` note stage so published clippings remain available from their parent notes and tag pages while staying out of prominent site listings and feeds.
- Replaced recency-based note discovery with balanced garden paths, interactive filters and shuffling, related-note suggestions, and wider responsive discovery layouts.
