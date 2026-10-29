# gil.dev monorepo

![A laptop and plants beneath a starry sky, representing a digital garden](apps/gil.dev/public/img/gil-dev-digital-garden-banner.png)

This pnpm workspace contains [gil.dev](https://gil.dev), my personal digital garden, and Gil Publisher, the Obsidian plugin I use to publish notes to it.

I’m a Director of Engineering and full-stack web developer at [Codecraft Works](https://www.codecraftworks.com/), where I lead development on an education technology platform. My work spans Astro, Firebase, Google Cloud, .NET, AWS, and STEM education. Outside of work, I help organize [Google Developer Group Space Coast](https://gdg.community.dev/gdg-space-coast/), [Space Coast Devs](https://space-coast.dev/), and contribute to [Space Coast Mesh](https://scmesh.org/). I also volunteer with [c11y](https://c11y.org/), a cybersecurity team for students in grades 6–12.

## Workspace layout

```text
apps/
├── gil.dev/          # Astro site and its content
└── gil-publisher/    # Obsidian publishing plugin
```

- [`apps/gil.dev`](apps/gil.dev) contains the Astro application, Markdown and MDX content, tests, and note-creation script.
- [`apps/gil-publisher`](apps/gil-publisher) contains the TypeScript source, build configuration, and generated bundle for the Obsidian plugin.
- [`pnpm-workspace.yaml`](pnpm-workspace.yaml) defines the workspace and the dependencies allowed to run install-time build scripts.
- [`pnpm-lock.yaml`](pnpm-lock.yaml) is the repository's only dependency lockfile.

The site is a place for small, useful pieces of work rather than a polished archive waiting for everything to be finished. Topics include web development, Astro, developer tooling, cloud platforms, community technology, and cybersecurity education. New notes are also available through the [RSS feed](https://gil.dev/rss.xml).

## Requirements and installation

Use Node.js 22.23.4 (pinned in [`.nvmrc`](.nvmrc)) and pnpm 11.5.2 (pinned in the root [`package.json`](package.json)). The supported Node ranges are 22.23.4+, 24.15.0+, or 26+ within the listed majors.

Install every workspace dependency from the repository root:

```bash
pnpm install --frozen-lockfile
```

Keep dependency changes in the root `pnpm-lock.yaml`. Do not create npm lockfiles or install dependencies separately inside either app. Use `pnpm --filter <package> add <dependency>` when adding a dependency to one workspace package.

## Common commands

Run these commands from the repository root:

```bash
pnpm dev             # Start the gil.dev development server
pnpm build           # Build every workspace package
pnpm test            # Run tests in every package that defines them
pnpm typecheck       # Type-check every package that defines the script
pnpm check           # Run tests, type-checks, and production builds
pnpm plugin:dev      # Watch and rebuild the Obsidian plugin
pnpm plugin:build    # Create the production Obsidian plugin bundle
```

The site development server runs at `http://localhost:1716` by default. Package-specific commands can also use pnpm filters directly, for example:

```bash
pnpm --filter @gilcreque/gil.dev build
pnpm --filter @gilcreque/gil-publisher typecheck
```

The site test checks post HTML processing with Lambda's module-loading restrictions. jsdom stays on 26.x because newer releases require CommonJS-to-ESM loading that Lambda disables by default.

## Add a note

Create a note with the expected frontmatter from the repository root:

```bash
pnpm new:note "A note title"
```

The new file is placed in [`apps/gil.dev/src/content/notes`](apps/gil.dev/src/content/notes). Update its tags, topics, and status as the idea develops.

## Gil Publisher

Gil Publisher writes published notes and their attachments into the Astro app. Publishing follows Obsidian wikilinks recursively so linked notes such as clippings and the files they reference are published together. Recursion never enters folders listed in the plugin's ignore setting. Folder matching is case-insensitive and treats spaces, underscores, and hyphens equivalently; the defaults are `Clients`, `ai-work`, `daily-notes`, and `codecraft-works`.

Published frontmatter always includes the Obsidian `topics` and `status` properties. Existing values are preserved and normalized for Astro; notes without them receive `topics: []` and the `seed` stage.

Notes in a `Clippings` folder or tagged `clippings` are automatically assigned the `reference` stage unless they already have an explicit stage. References remain directly addressable, appear in a subdued collapsed section on the all-notes page, and remain discoverable through their tags. They are excluded from the homepage, topic discovery, and RSS.

The homepage's **Wander the Garden** section rotates through a balanced mix of stages and topics without using recency. The all-notes page uses the same discovery-first approach with topic, stage, and tag filters, shuffle and alphabetical controls, and a wider responsive card layout. Individual notes offer additional paths through related ideas.

Configure the plugin with the monorepo root as its repository path. Its defaults are:

- Notes: `apps/gil.dev/src/content/notes`
- Images: `apps/gil.dev/src/assets`

Existing plugin data that still uses the old `src/content/notes` and `src/assets` defaults is migrated automatically when the plugin loads.

To install a built plugin into an Obsidian vault:

```bash
pnpm plugin:build
pnpm plugin:install -- --vault /absolute/path/to/vault
```

The vault path can also be stored in the `GIL_PUBLISHER_VAULT` environment
variable or as the first non-comment line of a repository-root
`.gil-publisher-vault` file. The command-line value takes precedence, followed
by the environment variable and then the hidden file. The hidden file is
gitignored because vault locations are machine-specific.

```bash
printf '%s\n' "$HOME/Documents/second-brain" > .gil-publisher-vault
pnpm plugin:install
```

Run `pnpm plugin:install -- --vault` without a value to enter the path in an
interactive prompt. Press Tab while entering it to complete files and folders.

After installation, reload Obsidian (or disable and re-enable Gil Publisher), open the source note, and run **Gil Publisher: Publish current note to site** from the command palette. The upload ribbon button runs the same operation.

## Colophon

[Astro](https://astro.build/) powers the site and its content collections, [Netlify](https://www.netlify.com/) hosts it, and Markdown and MDX keep the writing close to the source. The design goal is a site that feels personal, quick to load, and easy to keep tending—and, occasionally, it is fueled by [burritos 🌯](https://gil.dev/chipotle).

Netlify reads the root [`netlify.toml`](netlify.toml), builds only the Astro workspace package, and publishes `apps/gil.dev/dist`. Keep the Netlify base directory at the repository root and set the package directory to `apps/gil.dev` so Netlify detects Astro and deploys the adapter-generated SSR function.

## Versioning and releases

[Release Please](https://github.com/googleapis/release-please-action) manages the repository version and root [`CHANGELOG.md`](CHANGELOG.md). Use Conventional Commits for commits merged into `main`, or for PR titles when squash merging:

- `fix: correct RSS links` bumps the patch version.
- `feat: add a topic index` bumps the minor version.
- `feat!: change public URLs` or a `BREAKING CHANGE:` footer bumps the major version.
- `docs:`, `chore:`, and other non-release changes alone do not trigger a release.

After a successful workspace check on `main`, the workflow opens or updates a release PR containing the version bump and changelog. Merging that PR creates the `vX.Y.Z` tag and GitHub release; neither private workspace package is published to npm.

In GitHub Settings → Actions → General, enable **Allow GitHub Actions to create and approve pull requests**. The workflow uses the built-in `GITHUB_TOKEN`; if branch protection requires checks on Release Please PRs, use a GitHub App token or suitable personal access token, or manually run the workflow on the release branch.
