---
name: pantograph-layout
description: Pantograph layout: scale a page with the viewport so it matches the Figma mockup at any width inside a breakpoint (1rem = 1px of mockup, 375/768/1440, clamp CSS on html). Use when building or reviewing such pages.
---

# Pantograph layout

A pantograph is a drawing instrument that copies a picture at a different scale. This
layout does the same with a Figma mockup: inside a breakpoint the page is not re-laid out,
it is scaled as a whole. Proportions, line breaks and composition stay as drawn; only the
scale changes.

## The idea in one line

`html { font-size }` = viewport width / mockup width, in px. At the mockup width
1rem is exactly 1px of the mockup, and it grows and shrinks linearly with the window.
Every size written in `rem` follows it.

## When to use this skill

- The project already has the CSS below (a scaled `font-size` on `html`): write sizes in
  `rem`, taking the px values from Figma as they are.
- A new project: add the CSS below once, then write in `rem`.
- The mockups are not drawn at the breakpoint widths, or a breakpoint has no mockup:
  see "Mockup not at the breakpoint width".
- The page has JS animations that set px values: see "Pitfalls".

## Breakpoints

Mobile first. Three mockups, each one covers a range of viewport widths:

| Viewport | Mockup | 1rem at the range edges |
|---|---|---|
| up to 499px | 375 | 0.853px → 1.333px |
| 500–1151px | 768 | 0.651px → 1.5px |
| 1152px and wider | 1440 | 0.8px → 1.111px, frozen above 1600px |

The scale is discontinuous at the borders by design: at 1151px the tablet mockup is
×1.5, at 1152px the desktop mockup starts at ×0.8. The layout changes, and the new
mockup starts from a smaller scale.

## The CSS

Add it once, globally, before the page styles. It sets `font-size` on `html`, so it
affects every `rem` on the page; if only some pages are laid out this way, include it
only on those pages.

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

Per breakpoint the CSS takes three unitless numbers:

- `--balance-point`: the balance point, the mockup width at which 1rem is exactly 1px;
- `--min-vw` and `--max-vw`: the edges of the viewport range the mockup covers.

They are unitless so they can be divided by each other; `* 1px` turns them into
lengths at the end.

1. Size of 1rem at the range edges: `min-vw / balance-point` and
   `max-vw / balance-point`. Tablet: 500 / 768 = 0.651px, 1152 / 768 = 1.5px.
2. Slope: how many px 1rem gains per 1px of viewport.
   (1.5 − 0.651) / (1152 − 500) = 0.001302 = 1 / 768.
3. A straight line through (min-vw; min-font-size) with that slope:
   `slope × (100vw − min-vw) + min-font-size`.
4. `clamp` keeps the value inside the range edges. Inside the range it changes nothing;
   it only acts below 320px (1rem stays 0.853px) and above 1600px (1rem stays 1.111px).

Simplified, the line is just

```
1rem = 100vw / balance-point   →   1rem = viewport width / mockup width
```

Examples: 375px → 1px, 412px → 1.099px, 480px → 1.28px, 900px → 1.172px.

## Writing styles

- Take every px value from the Figma mockup and write it in `rem` as is: 24px in the
  mockup → `font-size: 24rem`. Do not recalculate per width; the scale does it.
- Mobile first: the 375 mockup without media queries, then tablet and desktop.
- Add media queries only where the layout changes or the mockups differ. Use exactly the
  breakpoints of the CSS above: `min-width: 500px` and `min-width: 1152px`. If the grid
  switches at another width, the tablet grid will meet the mobile scale in between.

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

At 412px the title is 21 × 1.099 = 23.1px; at 900px it is 28 × 1.172 = 32.8px. No code
is needed for the widths in between.

## Mockup not at the breakpoint width

Mockups are sometimes drawn at other widths (desktop at 1200, mobile at 360), or a
breakpoint has no mockup. Do not recalculate every number: change `--balance-point`
once.

### Different width: put the mockup width into `--balance-point`

Set `--balance-point` to the width your mockup is actually drawn at. Then 1rem is 1px of
your mockup and Figma values still go into `rem` as they are. The range edges
(`--min-vw`, `--max-vw`) and the media queries stay the same. Put the override after the
CSS above:

```css
@media (min-width: 0px) {
  :root { --balance-point: 360; }
}
@media (min-width: 1152px) {
  :root { --balance-point: 1200; }
}
```

Side effect: at the breakpoint width 1rem is no longer 1px (at 1440 it is 1.2px). That is
expected; the mockup becomes the reference.

### Missing breakpoint

If there is no tablet mockup, use the desktop layout on tablets at a scale of about 0.75:
`--balance-point` = 768 / 0.75 = 1024. The honest 1200 gives a scale of 0.64 at 768px and
text around 15px, too small.

```css
@media (min-width: 500px) {
  :root { --balance-point: 1024; } /* 768 / 0.75 */
}
```

To keep content inside 768px, set container and column widths in `%`; keep font sizes,
spacing, heights and radii in `rem`. Shrink or move large illustrations with a separate
rule. The desktop values then live in `@media (min-width: 500px)`, and `1152px` is used
only where the tablet really differs from the desktop.

### Write it down

Record in the project README: a table "breakpoint → mockup width → `--balance-point`",
where the override lives, and the rule "Figma px go into rem as is". Pages are usually
built over several sessions, and the rule gets lost otherwise.

## Pitfalls

- **JS animations in px.** Libraries such as GSAP set coordinates and sizes in px
  directly; those values do not scale with the window. After the animation, recalculate
  the final position and size and set them in `rem`.
- **1rem is about 1px, not 16px.** Third-party widgets and styles that assume
  1rem = 16px become tiny. Set their sizes in px, or scope the CSS to the pages that use
  this layout.
- **Components sized in em.** If a component library sizes itself in `em` from its own
  root, give that root `font-size: 1rem` so it scales together with the layout.
- **Custom breakpoints.** Layout media queries must use the same 500px and 1152px as the
  CSS above.

## Review checklist

Check the page at the range edges, where the scale is most extreme:

| Viewport | Mockup | Scale | 14px text becomes |
|---|---|---|---|
| 320 | 375 | ×0.853 | 11.9px |
| 499 | 375 | ×1.331 | 18.6px |
| 500 | 768 | ×0.651 | 9.1px |
| 1151 | 768 | ×1.499 | 21.0px |
| 1152 | 1440 | ×0.8 | 11.2px |
| 1600+ | 1440 | ×1.111 | 15.6px |

500px is the smallest case: the tablet mockup is at ×0.65. Check small tablet text there.
