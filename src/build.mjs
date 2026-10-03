#!/usr/bin/env node
/*
Builds the static pages of the Pantograph Layout site.

    node src/build.mjs

Reads src/template.html, src/content.json and every src/i18n/<code>.json,
and writes index.html (the first language, Russian) plus <code>/index.html
for every other language. No dependencies beyond Node.js itself.

To add a language: copy src/i18n/en.json to src/i18n/<code>.json, translate
the values, set "lang" (code, short, label, path = "<code>/") and run the build.
*/

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(SRC);
const SITE_URL = "https://promo.github.io/pantograph-layout/";
const LANG_ORDER = ["ru", "en", "es", "de", "fr", "pt", "tr", "zh"];

// ---------------------------------------------------------------- the math

const BPS = [
  { key: "m", min: 320, max: 500, bp: 375 },
  { key: "t", min: 500, max: 1152, bp: 768 },
  { key: "d", min: 1152, max: 1600, bp: 1440 },
];

function bpFor(vw) {
  return vw >= 1152 ? BPS[2] : vw >= 500 ? BPS[1] : BPS[0];
}

function calc(vw) {
  const b = bpFor(vw);
  const minF = b.min / b.bp;
  const maxF = b.max / b.bp;
  const slope = (maxF - minF) / (b.max - b.min);
  const fluid = slope * (vw - b.min) + minF;
  const fs = Math.min(maxF, Math.max(minF, fluid));
  return { b, minF, maxF, slope, fluid, fs };
}

function num(n, d, dec) {
  const s = n.toFixed(d);
  return dec === "," ? s.replace(".", ",") : s;
}

function view(vw, t) {
  const c = calc(vw);
  const { b } = c;
  const dec = t.dec;
  const mn = num(c.minF, 3, dec);
  const mx = num(c.maxF, 3, dec);
  const sl = num(c.slope, 6, dec);
  const fl = num(c.fluid, 3, dec);
  const fs = num(c.fs, 3, dec);
  return {
    vw: String(vw),
    bpName: t.bp[b.key],
    bpVw: String(b.bp),
    rem: fs,
    px24: num(24 * c.fs, 1, dec),
    vars: `min-vw ${b.min} · max-vw ${b.max} · balance-point ${b.bp}`,
    minLine: `${b.min} / ${b.bp} = ${mn} px`,
    maxLine: `${b.max} / ${b.bp} = ${mx} px`,
    slopeLine: `(${mx} − ${mn}) / (${b.max} − ${b.min}) = ${sl}`,
    fluidLine: `${sl} × (${vw} − ${b.min}) + ${mn} = ${fl} px`,
    clampLine: `clamp(${mn}, ${fl}, ${mx}) = ${fs} px`,
  };
}

function edges(t) {
  return [320, 499, 500, 1151, 1152, 1600].map((v) => {
    const c = calc(v);
    const fs = c.fs;
    const scale = Math.abs(fs - Math.round(fs * 10) / 10) < 1e-9 ? num(fs, 1, t.dec) : num(fs, 3, t.dec);
    return {
      win: v === 1600 ? "1600+" : String(v),
      mock: String(c.b.bp),
      scale: "× " + scale,
      text: num(14 * fs, 1, t.dec) + " px",
      strong: v === 500,
    };
  });
}

// ---------------------------------------------------------------- code blocks

function escape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function highlight(text) {
  return text
    .split("\n")
    .map((raw) => {
      const [, pad, body] = raw.match(/^(\s*)(.*)$/);
      if (body.startsWith("/*") || body === "---") return pad + '<span class="c-com">' + escape(body) + "</span>";
      if (body.startsWith("#")) return pad + '<span class="c-h">' + escape(body) + "</span>";
      const d = body.startsWith("@") ? null : body.match(/^([a-z-]+)(\s*:\s.*)$/);
      if (d) return pad + '<span class="c-prop">' + escape(d[1]) + "</span>" + escape(d[2]);
      return pad + escape(body);
    })
    .join("\n");
}

// ---------------------------------------------------------------- icons

const ICONS = {
  icon_logo: '<svg class="i-logo" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2" y="2" width="24" height="24" rx="2" stroke="currentColor" stroke-width="2"/><rect x="2" y="17" width="9" height="9" rx="1.5" fill="#8377F1"/><path d="M6.5 21.5L23 5" stroke="#8377F1" stroke-width="2" stroke-dasharray="3 3"/></svg>',
  icon_globe: '<svg class="i-globe" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="9" cy="9" r="7.25"/><path d="M1.75 9h14.5M9 1.75c2 2 3 4.4 3 7.25s-1 5.25-3 7.25M9 1.75c-2 2-3 4.4-3 7.25s1 5.25 3 7.25"/></svg>',
  icon_chevron: '<svg class="i-chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>',
  icon_pause: '<svg class="i-pause" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><rect x="3" y="2" width="4" height="14" rx="1"/><rect x="11" y="2" width="4" height="14" rx="1"/></svg>',
  icon_play: '<svg class="i-play" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="M4 2.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 4 2.5z"/></svg>',
  icon_copy: '<svg class="i-btn" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="6" y="6" width="9.5" height="9.5" rx="2"/><path d="M12 6V4a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 3 4v6.5A1.5 1.5 0 0 0 4.5 12H6"/></svg>',
  icon_download: '<svg class="i-btn" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 2.5v9M5 8l4 4 4-4M3 15h12"/></svg>',
  icon_file: '<svg class="i-file" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13"/></svg>',
};

const PRESETS = [320, 375, 499, 500, 768, 1151, 1152, 1440, 1600, 1920];

// ---------------------------------------------------------------- rendering

function lookup(ctx, path) {
  let cur = ctx;
  for (const part of path.split(".")) {
    if (cur !== null && typeof cur === "object" && !Array.isArray(cur) && part in cur) cur = cur[part];
    else throw new Error("unknown key " + path);
  }
  if (cur !== null && typeof cur === "object") throw new Error(path + " is not a string");
  return String(cur);
}

function render(template, ctx, raw) {
  return template
    .replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_, key) => "\x00" + key + "\x00")
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => escape(lookup(ctx, path)))
    .replace(/\x00(\w+)\x00/g, (_, key) => {
      if (!(key in raw)) throw new Error("unknown raw block " + key);
      return raw[key];
    });
}

// Relative link between two language folders ('' = root).
function rel(fromPath, toPath) {
  return "../".repeat(fromPath.split("/").filter(Boolean).length) + toPath || "./";
}

// JSON in the same layout as before: ", " and ": " between items.
function toJson(value) {
  if (Array.isArray(value)) return "[" + value.map(toJson).join(", ") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.entries(value).map(([k, v]) => JSON.stringify(k) + ": " + toJson(v)).join(", ") + "}";
  }
  return JSON.stringify(value);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function main() {
  const template = readFileSync(join(SRC, "template.html"), "utf8");
  const content = readJson(join(SRC, "content.json"));
  const order = (d) => (LANG_ORDER.includes(d.lang.code) ? LANG_ORDER.indexOf(d.lang.code) : 99);
  const langs = readdirSync(join(SRC, "i18n"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(SRC, "i18n", f)))
    .sort((a, b) => order(a) - order(b));

  const cssLines = content.CSS.split("\n");
  const blocks = {
    code_bp: highlight(cssLines.slice(0, 22).join("\n")),
    code_c1: highlight(cssLines.slice(24, 27).join("\n")),
    code_c2: highlight(cssLines.slice(27, 30).join("\n")),
    code_c3: highlight(cssLines.slice(30, 36).join("\n")),
    code_c4: highlight(cssLines.slice(36, 46).join("\n")),
    code_all: highlight(content.CSS.replace(/\n+$/, "")),
    code_ex: highlight(content.EXAMPLE),
    code_ovr: highlight(content.OVERRIDE),
    code_nt: highlight(content.NO_TABLET),
    code_skill: highlight(content.SKILL_PREVIEW),
  };

  for (const d of langs) {
    const { lang, t } = d;
    const path = lang.path;
    const base = "../".repeat(path.split("/").filter(Boolean).length);

    const hreflang = langs
      .map((o) => `<link rel="alternate" hreflang="${o.lang.code}" href="${SITE_URL}${o.lang.path}">`)
      .join("\n");
    const langItems = langs
      .map((o) => {
        const cur = o === d ? ' aria-current="true"' : "";
        return `        <li><a href="${rel(path, o.lang.path)}" hreflang="${o.lang.code}" lang="${o.lang.code}"${cur}>${escape(o.lang.label)}<small>${escape(o.lang.short)}</small></a></li>`;
      })
      .join("\n");
    const edgeRows = edges(t)
      .map((r) => {
        const cls = r.strong ? " is-strong" : "";
        return `          <div class="etbl__row${cls}" role="row"><span role="cell">${escape(r.win)}</span><span role="cell">${escape(r.mock)}</span><span role="cell">${escape(r.scale)}</span><span role="cell">${escape(r.text)}</span></div>`;
      })
      .join("\n");
    const exChips = t.algo.ex.map((e) => "        <li>" + escape(e) + "</li>").join("\n");
    const skillItems = t.skill.items.map((e) => "          <li>" + escape(e) + "</li>").join("\n");
    const presetButtons = PRESETS.map(
      (p) => `          <button type="button" data-vw="${p}" aria-pressed="false">${p}</button>`,
    ).join("\n");
    const pageData = toJson({
      lang: lang.code,
      dec: t.dec,
      bp: t.bp,
      play: t.hero.play,
      pause: t.hero.pause,
      mini: d.mini,
    }).replace(/<\//g, "<\\/");

    const raw = {
      ...blocks,
      ...ICONS,
      hreflang,
      lang_items: langItems,
      edge_rows: edgeRows,
      ex_chips: exChips,
      skill_items: skillItems,
      preset_buttons: presetButtons,
      page_data: pageData,
    };
    const ctx = { t, lang, base, home: "./", hero0: view(412, t) };
    const target = join(ROOT, path, "index.html");
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, render(template, ctx, raw), "utf8");
    console.log("wrote", relative(ROOT, target));
  }
}

main();
