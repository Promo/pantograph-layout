#!/usr/bin/env python3
"""Builds the static pages of the Pantograph Layout site.

    python3 src/build.py

Reads src/template.html, src/content.json and every src/i18n/<code>.json,
and writes index.html (the first language, Russian) plus <code>/index.html
for every other language. No dependencies beyond the Python standard library.

To add a language: copy src/i18n/en.json to src/i18n/<code>.json, translate
the values, set "lang" (code, short, label, path = "<code>/") and run the build.
"""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
SITE_URL = "https://promo.github.io/pantograph-layout/"
LANG_ORDER = ["ru", "en", "es", "de", "fr", "pt", "tr", "zh"]

# ---------------------------------------------------------------- the math

BPS = [
    {"key": "m", "min": 320, "max": 500, "bp": 375},
    {"key": "t", "min": 500, "max": 1152, "bp": 768},
    {"key": "d", "min": 1152, "max": 1600, "bp": 1440},
]


def bp_for(vw):
    return BPS[2] if vw >= 1152 else (BPS[1] if vw >= 500 else BPS[0])


def calc(vw):
    b = bp_for(vw)
    min_f = b["min"] / b["bp"]
    max_f = b["max"] / b["bp"]
    slope = (max_f - min_f) / (b["max"] - b["min"])
    fluid = slope * (vw - b["min"]) + min_f
    fs = min(max_f, max(min_f, fluid))
    return {"b": b, "minF": min_f, "maxF": max_f, "slope": slope, "fluid": fluid, "fs": fs}


def num(n, d, dec):
    s = f"{n:.{d}f}"
    return s.replace(".", ",") if dec == "," else s


def view(vw, t):
    c = calc(vw)
    b, dec = c["b"], t["dec"]
    mn, mx = num(c["minF"], 3, dec), num(c["maxF"], 3, dec)
    sl, fl, fs = num(c["slope"], 6, dec), num(c["fluid"], 3, dec), num(c["fs"], 3, dec)
    return {
        "vw": str(vw),
        "bpName": t["bp"][b["key"]],
        "bpVw": str(b["bp"]),
        "rem": fs,
        "px24": num(24 * c["fs"], 1, dec),
        "vars": f"min-vw {b['min']} · max-vw {b['max']} · balance-point {b['bp']}",
        "minLine": f"{b['min']} / {b['bp']} = {mn} px",
        "maxLine": f"{b['max']} / {b['bp']} = {mx} px",
        "slopeLine": f"({mx} − {mn}) / ({b['max']} − {b['min']}) = {sl}",
        "fluidLine": f"{sl} × ({vw} − {b['min']}) + {mn} = {fl} px",
        "clampLine": f"clamp({mn}, {fl}, {mx}) = {fs} px",
    }


def edges(t):
    rows = []
    for v in [320, 499, 500, 1151, 1152, 1600]:
        c = calc(v)
        fs = c["fs"]
        scale = num(fs, 1, t["dec"]) if abs(fs - round(fs * 10) / 10) < 1e-9 else num(fs, 3, t["dec"])
        rows.append({
            "win": "1600+" if v == 1600 else str(v),
            "mock": str(c["b"]["bp"]),
            "scale": "× " + scale,
            "text": num(14 * fs, 1, t["dec"]) + " px",
            "strong": v == 500,
        })
    return rows


# ---------------------------------------------------------------- code blocks

def highlight(text):
    out = []
    for raw in text.split("\n"):
        m = re.match(r"^(\s*)(.*)$", raw)
        pad, body = m.group(1), m.group(2)
        if body.startswith("/*") or body == "---":
            out.append(pad + '<span class="c-com">' + html.escape(body) + "</span>")
            continue
        if body.startswith("#"):
            out.append(pad + '<span class="c-h">' + html.escape(body) + "</span>")
            continue
        d = re.match(r"^([a-z-]+)(\s*:\s.*)$", body) if not body.startswith("@") else None
        if d:
            out.append(pad + '<span class="c-prop">' + html.escape(d.group(1)) + "</span>" + html.escape(d.group(2)))
        else:
            out.append(pad + html.escape(body))
    return "\n".join(out)


# ---------------------------------------------------------------- icons

ICONS = {
    "icon_logo": '<svg class="i-logo" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2" y="2" width="24" height="24" rx="2" stroke="currentColor" stroke-width="2"/><rect x="2" y="17" width="9" height="9" rx="1.5" fill="#8377F1"/><path d="M6.5 21.5L23 5" stroke="#8377F1" stroke-width="2" stroke-dasharray="3 3"/></svg>',
    "icon_globe": '<svg class="i-globe" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="9" cy="9" r="7.25"/><path d="M1.75 9h14.5M9 1.75c2 2 3 4.4 3 7.25s-1 5.25-3 7.25M9 1.75c-2 2-3 4.4-3 7.25s1 5.25 3 7.25"/></svg>',
    "icon_chevron": '<svg class="i-chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>',
    "icon_pause": '<svg class="i-pause" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><rect x="3" y="2" width="4" height="14" rx="1"/><rect x="11" y="2" width="4" height="14" rx="1"/></svg>',
    "icon_play": '<svg class="i-play" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="M4 2.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 4 2.5z"/></svg>',
    "icon_copy": '<svg class="i-btn" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="6" y="6" width="9.5" height="9.5" rx="2"/><path d="M12 6V4a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 3 4v6.5A1.5 1.5 0 0 0 4.5 12H6"/></svg>',
    "icon_download": '<svg class="i-btn" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 2.5v9M5 8l4 4 4-4M3 15h12"/></svg>',
    "icon_file": '<svg class="i-file" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13"/></svg>',
}

PRESETS = [320, 375, 499, 500, 768, 1151, 1152, 1440, 1600, 1920]


# ---------------------------------------------------------------- rendering

def lookup(ctx, path):
    cur = ctx
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            raise KeyError(path)
    if isinstance(cur, (dict, list)):
        raise KeyError(path + " is not a string")
    return str(cur)


def render(template, ctx, raw):
    def raw_sub(m):
        key = m.group(1)
        if key not in raw:
            raise KeyError("raw block " + key)
        return raw[key]

    out = re.sub(r"\{\{\{\s*(\w+)\s*\}\}\}", lambda m: "\x00" + m.group(1) + "\x00", template)
    out = re.sub(r"\{\{\s*([\w.]+)\s*\}\}", lambda m: html.escape(lookup(ctx, m.group(1)), quote=True), out)
    out = re.sub(r"\x00(\w+)\x00", raw_sub, out)
    return out


def rel(from_path, to_path):
    """Relative link between two language folders ('' = root)."""
    up = "../" * len([p for p in from_path.split("/") if p])
    target = up + to_path
    return target or "./"


def main():
    template = (SRC / "template.html").read_text(encoding="utf-8")
    content = json.loads((SRC / "content.json").read_text(encoding="utf-8"))
    langs = []
    for f in (SRC / "i18n").glob("*.json"):
        langs.append(json.loads(f.read_text(encoding="utf-8")))
    langs.sort(key=lambda d: LANG_ORDER.index(d["lang"]["code"]) if d["lang"]["code"] in LANG_ORDER else 99)

    css_lines = content["CSS"].split("\n")
    blocks = {
        "code_bp": highlight("\n".join(css_lines[0:22])),
        "code_c1": highlight("\n".join(css_lines[24:27])),
        "code_c2": highlight("\n".join(css_lines[27:30])),
        "code_c3": highlight("\n".join(css_lines[30:36])),
        "code_c4": highlight("\n".join(css_lines[36:46])),
        "code_all": highlight(content["CSS"].rstrip("\n")),
        "code_ex": highlight(content["EXAMPLE"]),
        "code_ovr": highlight(content["OVERRIDE"]),
        "code_nt": highlight(content["NO_TABLET"]),
        "code_skill": highlight(content["SKILL_PREVIEW"]),
    }

    for d in langs:
        lang, t = d["lang"], d["t"]
        path = lang["path"]
        base = "../" * len([p for p in path.split("/") if p])

        hreflang = "\n".join(
            f'<link rel="alternate" hreflang="{o["lang"]["code"]}" href="{SITE_URL}{o["lang"]["path"]}">'
            for o in langs
        )
        lang_items = "\n".join(
            '        <li><a href="{href}" hreflang="{code}" lang="{code}"{cur}>{label}<small>{short}</small></a></li>'.format(
                href=rel(path, o["lang"]["path"]),
                code=o["lang"]["code"],
                cur=' aria-current="true"' if o is d else "",
                label=html.escape(o["lang"]["label"]),
                short=html.escape(o["lang"]["short"]),
            )
            for o in langs
        )
        edge_rows = "\n".join(
            '          <div class="etbl__row{cls}" role="row"><span role="cell">{win}</span><span role="cell">{mock}</span><span role="cell">{scale}</span><span role="cell">{text}</span></div>'.format(
                cls=" is-strong" if r["strong"] else "", **{k: html.escape(v) for k, v in r.items() if k != "strong"}
            )
            for r in edges(t)
        )
        ex_chips = "\n".join("        <li>" + html.escape(e) + "</li>" for e in t["algo"]["ex"])
        skill_items = "\n".join("          <li>" + html.escape(e) + "</li>" for e in t["skill"]["items"])
        preset_buttons = "\n".join(
            f'          <button type="button" data-vw="{p}" aria-pressed="false">{p}</button>' for p in PRESETS
        )
        page_data = json.dumps({
            "lang": lang["code"],
            "dec": t["dec"],
            "bp": t["bp"],
            "play": t["hero"]["play"],
            "pause": t["hero"]["pause"],
            "mini": d["mini"],
        }, ensure_ascii=False).replace("</", "<\\/")

        raw = dict(blocks)
        raw.update(ICONS)
        raw.update({
            "hreflang": hreflang,
            "lang_items": lang_items,
            "edge_rows": edge_rows,
            "ex_chips": ex_chips,
            "skill_items": skill_items,
            "preset_buttons": preset_buttons,
            "page_data": page_data,
        })
        ctx = {"t": t, "lang": lang, "base": base, "home": "./", "hero0": view(412, t)}
        out = render(template, ctx, raw)
        target = ROOT / path / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(out, encoding="utf-8")
        print("wrote", target.relative_to(ROOT))


if __name__ == "__main__":
    main()
