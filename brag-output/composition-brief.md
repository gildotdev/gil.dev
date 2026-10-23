# Hyperframes Composition Brief: gil.dev Digital Garden

## Objective

Create a short launch-style brag video for the newly expanded gil.dev Digital Garden experience.

## Output

- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material

- Project root: `/Users/gilcreque/projects/gil.dev`
- Primary files read: `README.md`, `apps/gil.dev/src/layouts/MainLayout.astro`, `apps/gil.dev/src/components/KnowledgeGarden.astro`, `apps/gil.dev/src/pages/topics/index.astro`, `apps/gil.dev/src/pages/topics/[slug].astro`, `apps/gil.dev/src/styles/global.css`, `apps/gil.dev/src/content/topics/digital-garden.md`
- Product name: gil.dev Digital Garden
- Tagline / strongest claim: “Follow an idea, not a timeline.”
- Key UI or visual moment to recreate: The Digital Garden topic hero with 4 Notes / 76 Resources / 48 Sites, followed by its grouped Resource shelf.
- Copy that must appear verbatim:
  - “Follow an idea, not a timeline.”
  - “Notes connected by ideas, tended over time, and shared as a personal knowledge garden.”
  - “Resource shelf”
  - “A Brief History and Ethos of the Digital Garden”
  - “Consume less. Create more.”

## Creative Direction

- Tone preset: default
- Creative direction: calm anti-feed product film with a playful garden mascot
- Interpretation: Warm, tactile, and confidently paced. Motion follows the worm's curved path through actual UI states; interface reveals are rhythmic but all copy receives comfortable settled holds.
- Angle: The antidote to an endless feed is a path with somewhere to go. Follow the worm from the Topics grid into one topic where four connected notes automatically produce a browsable shelf of 76 resources across 48 sites.
- Hook: The worm draws a path while “Follow an idea.” resolves into “Not a timeline.”
- Outro / punchline: “Consume less. Create more.” above `gil.dev`, with the worm curling into the final lockup.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals or generic particles
  - Unrelated visual redesign
  - Fake browser screenshots
  - Frantic feed-like pacing

## Visual Identity

- Background: `#faf4ed`
- Text: `#464261`
- Accent: pine `#286983`; supporting foam `#56949f`, iris `#907aa9`, gold `#ea9d34`, love `#b4637a`
- Display font: Departure Mono from the project's local WOFF2 asset
- Body font: Dank Mono from the project's local OTF asset
- Visual references from the project: pink worm SVG; radial pine/love page glow; bordered surface cards; top-edge color accents; rounded stat tiles; mono eyebrow labels; flower marker for Digital Garden.

## Storyboard

Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:

1. Leave the feed — 3s — worm path plus “Follow an idea. Not a timeline.”
2. Choose a garden path — 4s — real topic-card grid and Digital Garden selection.
3. Notes become a map — 5s — real topic hero and 4 / 76 / 48 stat reveal.
4. The resource shelf grows itself — 5s — featured resource, grouped sites, one disclosure interaction.
5. Grow something worth returning to — 3s — “Consume less. Create more.” and `gil.dev` worm lockup.

## Audio

- Audio role: warm rhythmic bed with sparse professional accents
- Audio arc: Curious opening, gentle lift into the proof counters, tactile shelf interaction, then a clean final resolve.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: Begin at 0:00 around 0.32 volume and fade through the final second. Do not duck for voice; narration is disabled.
- Music cue guidance: bundled preset at `/Users/gilcreque/.codex/plugins/cache/brag/brag/0.4.0/skills/brag/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; optional strong locks near 8.74s, 13.11s, and 17.47s. Use spaced beats from 9.29–12.55s for readable stats and 13.64–15.84s for site cards.
- Audio-reactive treatment: subtle; the radial background glow and worm-path highlight may breathe a few percent with RMS/bass energy. No waveform, equalizer, musical notes, pulsing text, or strobing.
- Audio-coupled moments:
  - Scene 1 path draw — soft sweep
  - Scene 2 card selection — restrained click
  - Scene 3 stats — three soft counter/card ticks
  - Scene 4 resource disclosure — click plus gentle reveal
  - Scene 5 final lockup — soft tonal resolve
- SFX selection guidance: Prefer organic low-risk sounds: soft drops, light card placement, selection click, and one soft impact. Keep the coherent set to roughly five cues.
- SFX analysis guidance: `/Users/gilcreque/.codex/plugins/cache/brag/brag/0.4.0/skills/brag/assets/sfx/sfx-analysis.md`; prefer low high-frequency-risk files for all repeated moments.
- Exact SFX choice: Choose filenames, timestamps, density, and volume after animation timing is implemented.
- Audio files: Keep copied audio beneath `brag-output/composition/assets/` and reference it with relative paths only.

## Hyperframes Instructions

- Use the current Hyperframes composition contract, data timing attributes, seek-safe keyframes, and CLI workflow.
- Show actual project UI and copy, not a generic promo abstraction.
- Keep every factual claim grounded in the source project.
- Keep every text element readable and the full composition exactly 20 seconds.
- Use the bundled music and sparse SFX layer. Narration is off.
- Treat cue metadata as optional guidance; readability wins over strict synchronization.
- Mark major timing locks and sequential beat-grid moments in comments.
- Use only local assets in the composition.
- Run `npx hyperframes check` as the single browser gate before rendering and fix every error.
- Render locally to `brag-output/brag.mp4`; do not publish remotely.
