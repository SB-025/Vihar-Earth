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
assert.equal(doc.querySelector("main .contact-logo"), null);
const form = doc.querySelector("main form");
assert.ok(form);
assert.equal(form.querySelector("select").value, "Mango farms");
assert.ok(doc.querySelector('main a[href="tel:+919970567798"]'));
assert.ok(doc.querySelector('main a[href="mailto:bhansaris@gmail.com"]'));
let posted;
window.fetch = async (url, options) => {
  posted = { url, body: JSON.parse(options.body) };
  return {
    ok: true,
    json: async () => ({ message: "Your enquiry has been submitted." }),
  };
};
form.elements.name.value = "Test visitor";
form.elements.email.value = "visitor@example.com";
form.elements.phone.value = "+919876543210";
form.elements.message.value = "Please arrange a site visit.";
form.elements.consent.checked = true;
form.dispatchEvent(
  new window.Event("submit", { bubbles: true, cancelable: true }),
);
await wait();
assert.equal(posted.url, "/api/contact");
assert.equal(posted.body.consent, true);
assert.equal(posted.body.service, "Mango farms");
assert.match(form.querySelector('[role="status"]').textContent, /submitted/);
window.fetch = async () => ({
  ok: false,
  json: async () => ({ error: "Email temporarily unavailable" }),
});
form.dispatchEvent(
  new window.Event("submit", { bubbles: true, cancelable: true }),
);
await wait();
assert.match(
  form.querySelector('[role="status"]').textContent,
  /temporarily unavailable/,
);
assert.equal(form.querySelector("button").disabled, false);
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
  "PASS: five routes, eight services, category filters, contact form success/error handling, service context, logo removed, mobile menu and Escape key.",
);
