# OmniKnowledge project page

The public page of OmniKnowledge, a systematic literature review tool from the
[COLA Laboratory](https://colalab.ai/). It is served by GitHub Pages from the root of the `main`
branch at <https://colalab.ai/OmniKnowledge/>. Pushing to `main` publishes.

The page is plain HTML, CSS and classic scripts: no build step, no dependencies, and it opens
from `file://`. The example question, papers and counts on it are illustrative.

## Layout

| Path | Owns |
|---|---|
| `index.html` | The page's text and the order of its sections |
| `page.css` | Everything around the pictures: navigation, first screen, the frame a picture stands in, section headings, questions, closing, footer |
| `page.js` | Mounts each section into the element that names it (`data-section`) |
| `kit.css`, `kit.js` | The drawing language: tokens, classes and the shared objects (`window.OK`) every picture is drawn with; the example data (`OK.DATA`) |
| `hero.js` | The first picture |
| `sections/<name>.js`, `.css` | One section each: `features`, `build`, `search`, `screen`, `knowledge`. A file registers itself with `OK.section(name, id, { label, mount })` and prefixes its own classes (`ft-`, `ba-`, `sr-`, `sc-`, `ka-`) |
| `assets/` | The pictures' typeface (Hanken Grotesk, SIL Open Font License), the icon and the link preview image |
| `tools/shot.mjs` | Captures the page or one part of it as a PNG |

`sections/search.js` and `sections/screen.js` each register more than one version of their
section; the page shows the first (`a`).

## The drawing language

Every picture is drawn with the kit, so that a paper, a sheet and the network are the same
objects from the first screen to the last.

- **Colour.** Ink `#0b0b0c`, white, one yellow `#ffe62e` (the marker behind a number or word, a
  kept paper, the dots of the network), the pale ground `--tint` and the greys in `kit.css`. No
  second hue, gradient, shadow or glow.
- **Type.** Inside a picture Hanken, with mono for counts, at the kit's sizes; nothing under
  12.5 px, no uppercase labels, no decorative numbering. A number appears only when it counts
  something. Around the pictures the page is set in Inter Tight (headings) and Inter (text).
- **Objects.** A paper is `OK.paper` (black seed, white found, yellow kept, pale removed). A
  paper large enough to have parts is the sheet (`OK.sheetGeo`, `OK.sheetBase`, `OK.sheetInk`,
  `OK.ticks`). Many papers are the network's dots and thin straight citations (`OK.map`). A step
  is a white card with a hairline edge and a black tile icon (`OK.tile`). Text that must not be
  quoted is word bars (`OK.words`).
- **Lines, four kinds.** The pipeline line (`.lead`, 3 px, horizontal and vertical runs, one
  corner radius of 16; it never forks or merges). A citation (`.edge`, thin, straight). An
  evidence line (`.wire`, 1.5 px, one smooth curve ending in a dot). A hairline rule.
- **Controls.** The one control is `.k-switch`: words in a row, the chosen one on the yellow
  marker.
- **Motion.** A picture reveals itself once when it arrives (`OK.onArrive`, `OK.reveal`), in the
  order a reader takes it in. The finished state is the DOM: with reduced motion, or with
  `?still=1`, every picture is shown complete.

## Checking a change

Open `index.html` in a browser, or capture it:

```bash
node tools/shot.mjs out.png "" --full --wait=2500
```

```bash
node tools/shot.mjs phone.png "" --size=390x844 --scale=2 --full --wait=2500
```

`--sel="[data-section=build]"` captures one section; `--motion` samples the reveal instead of
the finished state. The tool prints horizontal overflow and any page error.
