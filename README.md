# Pantograph Layout

**The mockup doesn’t reflow. It scales.**

Pantograph Layout is a CSS technique for designers and front-end developers. Within a
breakpoint, the page looks like its Figma mockup at any screen width: the same
proportions, the same line breaks, the same composition. Only the scale changes.

Site: https://promo.github.io/pantograph-layout/ (Russian) ·
https://promo.github.io/pantograph-layout/en/ (English)

A pantograph is a drawing instrument that copies a picture at a different scale. This
layout does the same with a Figma mockup: it carries it over to a screen of any width at
the right scale.

## The idea

Take a 375 px mobile mockup and open the page on a phone that is 480 px wide.

- **Layout in px.** Fonts and spacing stay as in the mockup, blocks stretch to the width.
  The proportions are no longer what the designer drew, and every width in between has
  to be checked separately.
- **Pantograph layout.** Sizes are in `rem`, and `1rem` depends on the viewport width.
  Everything is scaled by 480 / 375 = 1.28: it is the same mockup, only larger.

## Breakpoints

Mobile first. Three mockups, each one covers a range of viewport widths:

| Viewport | Mockup | 1rem at the range edges |
|---|---|---|
| up to 499 px | 375 | 0.853 → 1.333 px |
| 500–1151 px | 768 | 0.651 → 1.5 px |
| 1152 px and up | 1440 | 0.8 → 1.111 px, frozen above 1600 px |

## The CSS

Add it once, globally, before the page styles. The same file is in
[`assets/pantograph.css`](assets/pantograph.css).

```css
/* Breakpoints */
@media (min-width: 0px) {
  :root {
    --min-vw: 320;
    --max-vw: 500;
    --balance-point: 375;
  }
}
@media (min-width: 500px) {
  :root {
    --min-vw: 500;
    --max-vw: 1152;
    --balance-point: 768;
  }
}
@media (min-width: 1152px) {
  :root {
    --min-vw: 1152;
    --max-vw: 1600;
    --balance-point: 1440;
  }
}

/* Scaling */
:root {
  --min-font-size: calc(var(--min-vw) / var(--balance-point));
  --max-font-size: calc(var(--max-vw) / var(--balance-point));
  --diff-font-size: calc(var(--max-font-size) - var(--min-font-size));
  --diff-vw: calc(var(--max-vw) - var(--min-vw));
  --slope: calc(var(--diff-font-size) / var(--diff-vw));
  --max-font-size-px: calc(var(--max-font-size) * 1px);
  --min-font-size-px: calc(var(--min-font-size) * 1px);
  --min-vw-px: calc(var(--min-vw) * 1px);
  --fluid-font-size-px: calc(
    var(--slope) * (100vw - var(--min-vw-px)) + var(--min-font-size-px)
  );
  --clamp-scaling-fs: clamp(
    var(--min-font-size-px),
    var(--fluid-font-size-px),
    var(--max-font-size-px)
  );
}

html {
  font-size: var(--clamp-scaling-fs);
}
```

## How it works

Each range of widths gets three unitless numbers:

- `--balance-point`: the balance point, the width of the Figma mockup at which 1rem is
  exactly 1px;
- `--min-vw` and `--max-vw`: the edges of the range.

The numbers have no units so they can be divided by each other; `* 1px` turns them into
lengths at the end. Then the CSS draws a straight line:

1. **Size of 1rem at the range edges:** `min-vw / balance-point` and
   `max-vw / balance-point`. Tablet: 500 / 768 = 0.651 px, 1152 / 768 = 1.5 px.
2. **Slope:** how many px 1rem gains with each pixel of viewport width.
   (1.5 − 0.651) / (1152 − 500) = 0.001302 = 1 / 768.
3. **Line equation:** a line through (min-vw; min-font-size) with that slope. At a
   900 px viewport: 0.001302 × (900 − 500) + 0.651 = 1.172 px.
4. **Clamp and apply:** `clamp` keeps the size inside the range edges. Inside the range it
   changes nothing; it only acts above 1600 px and below 320 px. The result becomes the
   `font-size` of `html`, and every `rem` on the page is computed from it.

Simplified:

```
slope = (max-font-size − min-font-size) / (max-vw − min-vw) = 1 / balance-point
fluid = slope × (100vw − min-vw) + min-vw / balance-point   = 100vw / balance-point
```

**1rem = viewport width ÷ mockup width.** 375 px → 1 px, 412 px → 1.099 px,
480 px → 1.28 px, 1024 px → 1.333 px.

### What happens at the borders

- **Breakpoint switch.** At 1151 px the tablet mockup is scaled ×1.5. At 1152 px the
  desktop mockup takes over at ×0.8. The layout has changed, and the new mockup starts
  from a smaller scale. The jump is expected.
- **Wider than 1600 px.** `clamp` stops the growth: 1rem stays at 1.111 px. Fonts and
  spacing stop growing, and the extra width goes into the margins.
- **Narrower than 320 px.** 1rem never drops below 0.853 px. The mobile mockup stops
  shrinking.

## For designers

- **Draw three mockups: 375, 768 and 1440 px.** Each mockup covers its own range of
  widths. There is no need to draw the widths in between: they are the same mockup at
  scale.
- **Check the edge widths.** The mockup shrinks the most at 500 px, where the tablet
  mockup is at ×0.65. Check small tablet text at this width.

| Viewport | Mockup | Scale | 14px text becomes |
|---|---|---|---|
| 320 | 375 | × 0.853 | 11.9 px |
| 499 | 375 | × 1.331 | 18.6 px |
| **500** | **768** | **× 0.651** | **9.1 px** |
| 1151 | 768 | × 1.499 | 21.0 px |
| 1152 | 1440 | × 0.8 | 11.2 px |
| 1600+ | 1440 | × 1.111 | 15.6 px |

### If the mockup isn’t drawn at the breakpoint width

- **Different mockup width.** Desktop drawn at 1200 and mobile at 360? Put your mockup
  width into `--balance-point`, and 1rem is again 1px of your mockup. The range edges and
  media queries stay the same.

  ```css
  /* after the CSS above */
  @media (min-width: 0px) {
    :root { --balance-point: 360; }
  }
  @media (min-width: 1152px) {
    :root { --balance-point: 1200; }
  }
  ```

- **No tablet mockup.** Use the desktop layout at a scale of about 0.75: for the tablet
  range, `--balance-point` = 768 / 0.75 = 1024. Set container and column widths in
  percent; keep fonts, spacing, heights and radii in `rem`.

  ```css
  @media (min-width: 500px) {
    :root { --balance-point: 1024; } /* 768 / 0.75 */
  }
  ```

Write the chosen scales down in the project README so the rule doesn’t get lost.

## For developers

1. **Add the CSS.** Once, globally, before the page styles. It sets the `font-size` of
   `html`, so it affects every `rem`. If only some pages use this layout, include the CSS
   only on those.
2. **Figma numbers go into rem.** 24px in the mockup is `24rem` in code. No need to
   recalculate for each width.
3. **Media queries only for layout changes.** Use them when the grid changes or the
   mockups differ. The boundaries are the same 500 and 1152 px as in the CSS.

```css
/* mobile mockup, 375 */
.hotels { display: grid; gap: 12rem; padding: 0 20rem; }
.hotels__title { font-size: 21rem; }

/* tablet mockup, 768 */
@media (min-width: 500px) {
  .hotels { grid-template-columns: repeat(2, 1fr); gap: 20rem; padding: 0 32rem; }
  .hotels__title { font-size: 28rem; }
}

/* desktop mockup, 1440 */
@media (min-width: 1152px) {
  .hotels { grid-template-columns: repeat(4, 1fr); gap: 24rem; padding: 0 80rem; }
  .hotels__title { font-size: 36rem; }
}
```

At 412 px the title is 21 × 1.099 = 23.1 px, at 900 px it is 28 × 1.172 = 32.8 px. No
code is needed between breakpoints.

## Where Pantograph breaks

- **Animations in px.** JS animation libraries such as GSAP set coordinates and sizes in
  px directly. Those values don’t scale with the window. After the animation, recalculate
  the final positions and sizes in `rem`.
- **Custom breakpoints.** If the grid switches at widths other than 500 and 1152 px while
  the scale switches there, the tablet grid meets the mobile scale in between.
- **Third-party rem.** 1rem on the page is about 1 px, not 16. Third-party widgets and
  styles that assume 16 px per rem become tiny. Convert their sizes to px or to the
  mockup scale.

## AI skill

[`SKILL.md`](SKILL.md) is an English skill file for AI agents (Claude and other agents
that read skill files). Put it in your agent’s skills folder and it will build pages by
these rules: the 1rem = 1px rule, breakpoints, the full CSS, mockups drawn at other
widths, pitfalls and an edge-width checklist.

## About this repository

The site itself is built with Pantograph Layout: `assets/pantograph.css` sets the root
font-size, and every size in `assets/site.css` is a px value from the 375 / 768 / 1440
mockups written in `rem`.

```
index.html, en/index.html   generated pages (committed, served by GitHub Pages)
assets/pantograph.css       the technique
assets/site.css             the site styles, in rem
assets/app.js               hero demo, live calculation, copy buttons, language menu
assets/fonts/               Onest and JetBrains Mono (SIL Open Font License 1.1)
SKILL.md                    the AI skill
src/build.mjs               page generator (Node.js, no dependencies)
src/serve.mjs               local server for checking the pages
src/template.html           page template
src/i18n/*.json             texts, one file per language
src/content.json            code samples shown on the page
.github/workflows/pages.yml deploy to GitHub Pages
```

### Build

Node.js 20 or newer, no `npm install` needed.

```sh
npm run build   # node src/build.mjs
npm start       # node src/serve.mjs, then open http://localhost:8000
```

Rebuild after changing `src/template.html`, `src/content.json` or `src/i18n/*.json`.
Changes in `assets/` need no build.

### Add a language

1. Copy `src/i18n/en.json` to `src/i18n/<code>.json` and translate the values.
2. In `lang`, set `code`, `short`, `label` and `path` (`"<code>/"`).
3. Run `npm run build`. The page appears at `/<code>/` and in the language menu
   of every page.

### Fonts

[Onest](https://github.com/simpals/onest) and
[JetBrains Mono](https://github.com/JetBrains/JetBrainsMono), both under the SIL Open Font
License 1.1 (see `assets/fonts/OFL-*.txt`).

## License

[MIT](LICENSE): use the CSS, the code and the texts in any project, including
commercial ones, as long as you keep the copyright notice.

The fonts in `assets/fonts/` are not covered by MIT: they are under the SIL Open Font
License 1.1 (see `assets/fonts/OFL-*.txt`).
