# OmniKnowledge project page

The public page of OmniKnowledge, a systematic literature review tool from the
[COLA Laboratory](https://colalab.ai/). It is served by GitHub Pages from the root of the `main`
branch at <https://colalab.ai/OmniKnowledge/>. Pushing to `main` publishes.

The page is plain HTML, CSS and JavaScript modules: no framework, no bundler, no build step, and
no runtime dependency. The example question, papers and counts on it are illustrative.

## Running and checking

ES modules do not load from `file://`; serve the folder instead:

```bash
pnpm install          # the checking tools only (devDependencies); the page needs none
pnpm serve            # http://127.0.0.1:4173/ ; add --prefix=/OmniKnowledge/ to serve it as Pages does
pnpm check            # lint, format:check, typecheck, test, test:e2e: what CI runs on every push
pnpm compare          # every scene at every width, pixel by pixel against 89d3153 (or: pnpm compare <ref>)
pnpm shot out.png --size=390x844 --scale=2 --full    # one capture; see tools/shot.mjs for the options
```

`pnpm exec playwright install chromium webkit` fetches the browsers the end-to-end tests use.
A change that must not move a pixel passes `pnpm compare`; one that should move pixels shows
exactly where (`output/compare/`, with a diff image per pair). `--ref-css=<file>` adds a
stylesheet to the reference, to show that a deliberate change explains every differing pixel.

## Publishing

Files are published as they are, without version stamps (`?v=`): GitHub Pages caches each file
for ten minutes, and stamps cannot be kept consistent across a module graph by hand. A release
can therefore mix old and new files for up to ten minutes. `tools/check-static.mjs` fails on any
stamp. The checks in `.github/workflows/check.yml` deploy nothing.

## Layout

| Path                                        | Owns                                                                                                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                                | The page's text: headings, copy, links, the questions, the switches' words, the pictures' empty figures                                                                                                                |
| `main.js`                                   | Loads each section named by `data-section`, waits for the typeface, mounts each in isolation, keeps their destructors                                                                                                  |
| `styles/tokens.css`                         | Every value of the design language: page and picture colours, type families and sizes, radii, easing                                                                                                                   |
| `styles/base.css`                           | Box model, body type, links, buttons, the focus ring, the visually hidden helper                                                                                                                                       |
| `styles/components.css`                     | What a second page reuses: column, skip link, site header, brand, buttons, text button, highlight, frame, footer                                                                                                       |
| `styles/landing.css`                        | This page's layout: first screen, section heads, questions                                                                                                                                                             |
| `styles/kit.css`                            | The drawing classes every picture is drawn with, the switch, the pictures' typeface                                                                                                                                    |
| `assets/icons.svg`                          | The page's icons, each drawn once: brand, arrow, chevron (`<use href="assets/icons.svg#brand">`)                                                                                                                       |
| `assets/`                                   | The favicon (its mark must equal the sprite's brand; checked), the link preview image, `fonts/` (Hanken Grotesk and its licence)                                                                                       |
| `kit/`                                      | The drawing kit; `kit/index.js` is its public surface                                                                                                                                                                  |
| `kit/dom.js`                                | Creating elements: text always as text; markup only through `markup()`                                                                                                                                                 |
| `kit/format.js`, `random.js`, `geometry.js` | Coordinates and counts, the seeded random, the enclosing circle                                                                                                                                                        |
| `kit/tokens.js`                             | The tokens drawing code writes into markup, read from `styles/tokens.css`                                                                                                                                              |
| `kit/paper.js`, `sheet.js`, `icons.js`      | The paper icon and word bars; the large sheet with parts; the glyphs and their black tile                                                                                                                              |
| `kit/network.js`, `network.data.js`         | The map of the 212 kept papers (generated data) and the citations between its topics                                                                                                                                   |
| `kit/motion.js`, `fonts.js`, `fit.js`       | Still mode, reveals and arrival; waiting for the typeface; choosing a composition by frame width                                                                                                                       |
| `kit/example.js`                            | The example every picture tells (question, searches, filters by stable id, counts)                                                                                                                                     |
| `sections/<name>/`                          | One section each, in page order: `hero`, `features`, `search`, `screen`, `build`, `knowledge`. `<name>.js` exports `mount(element)`; `<name>.css` beside it; classes prefixed `hr-`, `ft-`, `sr-`, `sc-`, `ba-`, `ka-` |
| `sections/hero/`                            | `wide.js` and `tall.js`: the two compositions; `parts.js`: the task drawings and marks both use                                                                                                                        |
| `sections/search/`                          | `citation.js`, `semantic.js`, `database.js`: the three searches at work; `shared.js`: their measures                                                                                                                   |
| `sections/screen/`                          | `plan.js`: where everything stands; `icons.js`: the filter icons and coins; `measure.js`: text widths                                                                                                                  |
| `sections/build/`                           | `record.js`: the presets and their runs (each preset is its own illustration); `layout.js`: measures and stateless parts; `picture.js`: the drawing                                                                    |
| `sections/knowledge/`                       | `picture.js`: map and cards; `tasks.js`: the four outputs; `reading.js`: the reading; `names.js`: name placement; `arrangements.js`, `semantic.data.js`                                                                |
| `tools/serve.mjs`                           | The static server every tool and test uses (`--prefix=/OmniKnowledge/` as on Pages)                                                                                                                                    |
| `tools/scenes.mjs`                          | The states and widths checked: one list for `compare` and the end-to-end tests                                                                                                                                         |
| `tools/compare.mjs`, `shot.mjs`             | Pixel comparison against a git ref; a single capture                                                                                                                                                                   |
| `tools/layouts.mjs`                         | Generates `kit/network.data.js` and `sections/knowledge/semantic.data.js` (`pnpm layouts`); a unit test fails when they are stale                                                                                      |
| `tools/check-static.mjs`                    | No `?v=`; local references exist; one spelling per external link; favicon mark equals the sprite's; brand and footer equal across pages                                                                                |
| `tests/unit/`, `tests/e2e/`                 | Vitest for the kit's pure functions and the layouts; Playwright (Chromium and WebKit) for the page                                                                                                                     |

A section exports `mount(element)` and returns `{ destroy() }`, which releases every observer,
listener, timer and animation it made. It may export `prepare(element)` to size its figure before
the typeface is in. Drawings read the motion preference through `kit/motion.js` while they run,
so a section takes no `still` flag.

## The drawing language

Every picture is drawn with the kit, so that a paper, a sheet and the network are the same
objects from the first screen to the last.

- **Colour.** Ink `--ink`, white `--paper`, one yellow `--y` (the marker behind a number or word,
  a kept paper, the dots of the network), its pale `--y-pale` for a quantity that tapers into the
  kept papers, the pale ground `--tint` and the greys in `styles/tokens.css`. No second hue,
  gradient, shadow or glow. Informative text is `--t2` or `--t3` (4.5:1 or more on white and on
  `--tint`); the pale greys are for marks only.
- **Type.** Inside a picture Hanken, with mono for counts, at the kit's sizes; nothing under
  12.5 units, no uppercase labels, no decorative numbering. A number appears only when it counts
  something. Around the pictures the page is set in Inter Tight (headings) and Inter (text).
- **Objects.** A paper is `paper()` (black seed, white found, yellow kept, pale removed). A paper
  large enough to have parts is the sheet (`sheetGeo`, `sheetBase`, `sheetInk`, `ticks`). Many
  papers are the network's dots and thin straight citations (`kit/network.js`). A step is a white
  card with a hairline edge and a black tile icon (`tile()`). Text that must not be quoted is
  word bars (`words()`).
- **Lines, four kinds.** The pipeline line (`.lead`, 3 px, horizontal and vertical runs, one
  corner radius of 16; it never forks or merges). A citation (`.edge`, thin, straight). An
  evidence line (`.wire`, 1.5 px, one smooth curve ending in a dot). A hairline rule.
- **Controls.** The one control is `.k-switch`: words in a row, the chosen one on the yellow
  marker.
- **Motion.** A picture reveals itself once when it arrives (`onArrive`, `reveal()`), in the
  order a reader takes it in, and within 4.5 s (`REVEAL_LIMIT`; a longer reveal is compressed in
  proportion). The finished state is the DOM: with reduced motion, or with `?still=1`, every
  picture is shown complete, and turning reduced motion on stops any reveal. One picture keeps
  moving afterwards: the last section's four tasks take turns by themselves until the reader
  chooses one (`sections/knowledge/knowledge.js` owns the pause rules).

## Narrow frames

A picture chooses its composition by the width of its frame, not the window (`kit/fit.js`): the
wide composition stands while its smallest text is drawn at 11 px or more, otherwise the narrow
one does. Narrow compositions keep a maximum width equal to their viewBox width (324–350 px), so
a larger frame does not enlarge their labels. Section titles use 28 px on phones, a task's name
17 px in a narrow composition, and supporting text keeps the kit's 12.5–14 px hierarchy. Compact
diagrams move their marks closer together instead of scaling all their text down. The Build
section sets its text beside the frame only where the picture keeps its 11 px there (from
1255 px).

When changing a picture, run `pnpm compare` and look at the pairs it writes; check all three
pipeline presets, both map views and all four tasks (the scenes do), with motion enabled and
reduced (`pnpm test:e2e`), in Chromium and WebKit.

## The typeface

`assets/fonts/hanken.woff2` is Hanken Grotesk, © 2021 The Hanken Grotesk Project Authors,
under the SIL Open Font License 1.1; its licence is `assets/fonts/OFL.txt`, copied from
`github.com/google/fonts`, `ofl/hankengrotesk/OFL.txt` (retrieved 2026-10-15).
