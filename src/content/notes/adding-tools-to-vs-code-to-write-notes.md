---
title: "Adding tools to VS Code to Write Notes"
created: 2026-06-25T00:26:31-0400
type: note
tags:
  - vscode
  - devlog
  - notes
updated: 2026-06-25T00:30:51-0400
slug: adding-tools-to-vs-code-to-write-notes
topics:
  - dev-tools
status: growing
---

I added a small workflow in [Add new note templates](https://github.com/gildotdev/gil.dev/commit/dbe8e043b45b203bee8b701ada0c3f4d25b13306) to make the boring parts automatic.

The main piece is [`scripts/new-note.mjs`](https://github.com/gildotdev/gil.dev/blob/main/scripts/new-note.mjs). It takes a title from the command line:

```shell
npm run new:note -- "Adding tools to VS Code to Write Notes"
```

Then it generates a slug, creates a new markdown file in `src/content/notes`, and fills in the frontmatter this site expects:

```yaml
---
title: "Adding tools to VS Code to Write Notes"
created: 2026-06-25T00:26:31-0400
type: note
tags:
  - inbox
updated: 2026-06-25T00:26:31-0400
slug: adding-tools-to-vs-code-to-write-notes
topics: []
status: seed
---
```

There were a couple of details worth getting right. The script checks for existing files and picks the next available filename instead of overwriting anything. It also formats timestamps for `America/New_York` with the correct offset, so notes created during daylight saving time get `-0400` instead of a hard-coded `-0500`.

For VS Code, I added [a task named `New note`](https://github.com/gildotdev/gil.dev/blob/main/.vscode/tasks.json). Running it prompts for the note title, calls the npm script, and sets `VSCODE_CLI=1` so the script can open the newly-created file in the current editor window. That gives me a command-palette path for starting a note without leaving the editor.

I also added a workspace snippet in [`.vscode/note.code-snippets`](https://github.com/gildotdev/gil.dev/blob/main/.vscode/note.code-snippets). Typing `note` and then pressing <kbd>Ctrl</kbd>+<kbd>Space</kbd> in a Markdown or MDX file inserts the same frontmatter shape. The snippet uses VS Code's date variables and `CURRENT_TIMEZONE_OFFSET`, with the colon removed, so the timestamp still matches the Astro content schema.

The end result is intentionally small:

- `npm run new:note -- "Title"` for terminal use.
- `Tasks: Run Task` -> `New note` for VS Code use.
- `note` snippet for filling frontmatter in an already-open file.

This is one of those little tooling changes that makes the site feel more writable. The structure is still there, but it gets out of the way.
