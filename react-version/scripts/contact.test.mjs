import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import {
  createContactHandler,
  createEmails,
  validateEnquiry,
} from "../server/contact.mjs";

const enquiry = {
  name: "Test <Visitor>",
  email: "visitor@example.com",
  phone: "+919876543210",
  service: "Mango farms",
  location: "Ratnagiri",
  message: "Interested in a site visit.",
  consent: true,
  website: "",
  submissionId: "12345678-1234-1234-1234-123456789abc",
};
const env = {
  SMTP_PASS: "test-only-password",
  SMTP_USER: "hello@example.com",
  SITE_URL: "https://example.com",
};
async function invoke(handler, data = enquiry, options = {}) {
  const req = Readable.from([Buffer.from(JSON.stringify(data))]);
  req.method = options.method || "POST";
  req.headers = {
    "content-type": "application/json",
    origin: options.origin || "https://example.com",
  };
  if (options.parsed) req.body = data;
  req.socket = { remoteAddress: "127.0.0.1" };
  let status, body;
  await handler(req, {
    writeHead(value) {
      status = value;
    },
    end(value) {
      body = JSON.parse(value);
    },
  });
  return { status, body };
}
test("validates input and safely renders the acknowledgement", () => {
  assert.throws(() => validateEnquiry({ ...enquiry, consent: false }));
  assert.throws(() => validateEnquiry({ ...enquiry, email: "bad\naddress" }));
  assert.throws(() => validateEnquiry({ ...enquiry, service: "unknown" }));
  assert.throws(() => validateEnquiry({ ...enquiry, website: "bot" }));
  const emails = createEmails(validateEnquiry(enquiry), {
    from: "hello@example.com",
    inbox: "owner@example.com",
  });
  assert.equal(emails.length, 2);
  assert.deepEqual(emails[0].to, ["owner@example.com"]);
  assert.deepEqual(emails[1].to, ["visitor@example.com"]);
  assert.equal(emails[0].replyTo, "visitor@example.com");
  assert.equal(emails[1].replyTo, "owner@example.com");
  assert.match(emails[1].html, /Test &lt;Visitor&gt;/);
  assert.doesNotMatch(emails[1].html, /<Visitor>/);
  assert.match(emails[1].text, /Thank you for reaching out/);
});
test("sends enquiry then thank-you with SMTP and supports Vercel parsed bodies", async () => {
  const calls = [];
  let settings;
  const handler = createContactHandler({
    env,
    createTransport: (options) => {
      settings = options;
      return {
        sendMail: async (email) => {
          calls.push(email);
          return { accepted: email.to };
        },
        close() {},
      };
    },
  });
  assert.equal((await invoke(handler)).status, 200);
  assert.equal((await invoke(handler, enquiry, { parsed: true })).status, 200);
  assert.equal(calls.length, 4);
  assert.equal(settings.host, "smtp.gmail.com");
  assert.equal(settings.secure, true);
  assert.equal(settings.auth.pass, env.SMTP_PASS);
  assert.deepEqual(calls[0].to, ["bhansaris@gmail.com"]);
  assert.deepEqual(calls[1].to, [enquiry.email]);
});
test("missing credentials, invalid input and wrong origin never send mail", async () => {
  let calls = 0;
  const createTransport = () => {
    calls++;
    throw new Error("unexpected");
  };
  assert.equal(
    (
      await invoke(
        createContactHandler({
          env: { SITE_URL: env.SITE_URL },
          createTransport,
        }),
      )
    ).status,
    503,
  );
  const handler = createContactHandler({ env, createTransport });
  assert.equal(
    (await invoke(handler, enquiry, { origin: "https://other.example" }))
      .status,
    403,
  );
  assert.equal(
    (await invoke(handler, { ...enquiry, consent: false })).status,
    400,
  );
  assert.equal(
    (await invoke(handler, { ...enquiry, website: "bot" })).status,
    400,
  );
  assert.equal((await invoke(handler, enquiry, { method: "GET" })).status, 405);
  assert.equal(
    (
      await invoke(
        handler,
        { ...enquiry, message: "a".repeat(17000) },
        { parsed: true },
      )
    ).status,
    413,
  );
  assert.equal(calls, 0);
});
test("SMTP rejection does not claim enquiry success or send acknowledgement", async () => {
  let calls = 0;
  const handler = createContactHandler({
    env,
    createTransport: () => ({
      sendMail: async () => {
        calls++;
        return { accepted: [] };
      },
      close() {},
    }),
  });
  assert.equal((await invoke(handler)).status, 502);
  assert.equal(calls, 1);
});
test("thank-you failure preserves submitted enquiry and reports partial outcome", async () => {
  let calls = 0;
  const handler = createContactHandler({
    env,
    createTransport: () => ({
      sendMail: async () => {
        if (++calls === 2) throw new Error("SMTP unavailable");
        return { accepted: ["owner@example.com"] };
      },
      close() {},
    }),
  });
  const response = await invoke(handler);
  assert.equal(response.status, 200);
  assert.match(response.body.message, /could not send your confirmation/);
  assert.equal(calls, 2);
});
test("limits repeated enquiries to a recipient", async () => {
  const handler = createContactHandler({
    env,
    createTransport: () => ({
      sendMail: async (email) => ({ accepted: email.to }),
      close() {},
    }),
  });
  for (let i = 0; i < 5; i++) assert.equal((await invoke(handler)).status, 200);
  assert.equal((await invoke(handler)).status, 429);
});
