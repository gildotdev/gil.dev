# Changelog

Release Please maintains this file from Conventional Commits when preparing a release.

## Unreleased

### Changed

- Reorganized the repository as a pnpm monorepo with the Astro site in `apps/gil.dev` and the Obsidian plugin in `apps/gil-publisher`.
- Centralized dependency installation, workspace commands, CI validation, and build-script approvals at the repository root.
- Updated Gil Publisher defaults and legacy-setting migration for the site's new monorepo paths.
- Updated Gil Publisher to publish directly wikilinked notes and copy their referenced image and file attachments without recursively pulling in the rest of the vault.
- Added monorepo-aware Netlify build and publish configuration for the Astro app.
