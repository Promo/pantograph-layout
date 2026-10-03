#!/usr/bin/env node
/*
Serves the site locally for checking the pages.

    node src/serve.mjs          # http://localhost:8000
    PORT=3000 node src/serve.mjs

No dependencies beyond Node.js itself.
*/

import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  const file = normalize(join(ROOT, decodeURIComponent(urlPath)));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) return null;
  try {
    const stat = statSync(file);
    if (stat.isDirectory()) return urlPath.endsWith("/") ? resolveFile(urlPath + "index.html") : { redirect: urlPath + "/" };
    return stat.isFile() ? { file } : null;
  } catch {
    return null;
  }
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const found = resolveFile(pathname);
  if (!found) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  } else if (found.redirect) {
    res.writeHead(301, { Location: found.redirect }).end();
  } else {
    res.writeHead(200, { "Content-Type": TYPES[extname(found.file)] || "application/octet-stream" });
    createReadStream(found.file).pipe(res);
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
