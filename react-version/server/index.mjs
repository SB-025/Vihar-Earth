import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";
import { loadEnvFile } from "node:process";
import { createContactHandler } from "./contact.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
try {
  loadEnvFile(resolve(root, ".env"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const dev = process.argv.includes("--dev");
if (!dev) process.env.NODE_ENV = "production";
const port = Number(process.env.PORT || (dev ? 5173 : 3000));
const vite = dev
  ? await (
      await import("vite")
    ).createServer({ root, server: { middlewareMode: true }, appType: "spa" })
  : null;
const contact = createContactHandler();
const dist = resolve(root, "dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".md": "text/plain",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/api/contact") return await contact(req, res);
    if (pathname.startsWith("/api/")) {
      res.writeHead(404);
      return res.end();
    }
    if (vite) return vite.middlewares(req, res);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    const path = resolve(
      dist,
      `.${decodeURIComponent(pathname === "/" ? "/index.html" : pathname)}`,
    );
    if (!path.startsWith(dist + sep)) {
      res.writeHead(403);
      return res.end();
    }
    let content;
    try {
      content = await readFile(path);
    } catch {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end("Request failed");
  }
});
server.requestTimeout = 20000;
server.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Vihar Earth: http://127.0.0.1:${port}`),
);
async function shutdown() {
  await vite?.close();
  server.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
