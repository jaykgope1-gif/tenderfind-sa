// Local preview of site/ (GitHub Pages serves the same folder). Usage: node scripts/serve.js [port]
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..", "site");
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain" };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("Not found");
  }
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  const body = fs.readFileSync(file);
  // Gzip like GitHub Pages does, so transfer sizes in devtools are realistic.
  if (/gzip/.test(req.headers["accept-encoding"] || "") && /text|json|javascript|xml/.test(type)) {
    res.writeHead(200, { "content-type": `${type}; charset=utf-8`, "content-encoding": "gzip", "cache-control": "no-cache" });
    return res.end(zlib.gzipSync(body));
  }
  res.writeHead(200, { "content-type": `${type}; charset=utf-8`, "cache-control": "no-cache" });
  res.end(body);
}).listen(PORT, () => console.log(`TenderFind SA preview: http://localhost:${PORT}`));
