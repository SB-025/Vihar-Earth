import { build } from "esbuild";
import { JSDOM, VirtualConsole } from "jsdom";
import assert from "node:assert/strict";

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => {
  if (!error.message.includes("canvas")) errors.push(error.message);
});
const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
  url: "http://localhost/",
  pretendToBeVisual: true,
  runScripts: "outside-only",
  virtualConsole,
});
const { window } = dom;
window.matchMedia = () => ({
  matches: true,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
window.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.HTMLCanvasElement.prototype.getContext = () => null;
window.console.error = (...args) => {
  if (!String(args[0]).includes("Error creating WebGL context"))
    errors.push(args.map(String).join(" "));
};
const output = await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  write: false,
  format: "iife",
  loader: { ".css": "empty" },
  define: {
    "import.meta.env.BASE_URL": '"/"',
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "silent",
});
window.eval(output.outputFiles[0].text);
const wait = () => new Promise((resolve) => setTimeout(resolve, 160));
const doc = window.document;
async function route(path) {
  window.location.hash = path;
  await wait();
}
await wait();
assert.match(doc.querySelector("h1").textContent, /A piece of earth/);
await route("/about");
assert.match(doc.querySelector("h1").textContent, /Grounded in trust/);
await route("/services");
assert.equal(doc.querySelectorAll(".service-card").length, 8);
await route("/lands?type=coastal");
assert.equal(doc.querySelectorAll(".explore-grid article").length, 1);
assert.match(
  doc.querySelector(".explore-grid h2").textContent,
  /Sea side plots/,
);
const all = [...doc.querySelectorAll(".filters button")].find(
  (button) => button.textContent === "All possibilities",
);
all.click();
await wait();
assert.equal(doc.querySelectorAll(".explore-grid article").length, 6);
await route("/contact?service=Mango%20farms");
assert.equal(doc.querySelector('main .contact-logo'), null);
assert.equal(doc.querySelector('main form'), null);
assert.match(doc.querySelector('.contact-invitation').textContent, /mango farms/);
assert.ok(doc.querySelector('.contact-invitation a[href="tel:+919970567798"]'));
assert.ok(doc.querySelector('.contact-invitation a[href="mailto:bhansaris@gmail.com"]'));
const toggle = doc.querySelector(".menu-toggle");
toggle.click();
await wait();
assert.equal(toggle.getAttribute("aria-expanded"), "true");
doc.dispatchEvent(
  new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
);
await wait();
assert.equal(toggle.getAttribute("aria-expanded"), "false");
assert.deepEqual(errors, []);
dom.window.close();
console.log(
  "PASS: five routes, eight services, category filters, frontend-only contact links, service context, logo removed, mobile menu and Escape key.",
);
