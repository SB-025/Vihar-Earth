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
  RESEND_API_KEY: "test-only-key",
  RESEND_FROM_EMAIL: "hello@example.com",
  SITE_URL: "https://example.com",
};
async function invoke(handler, data = enquiry, options = {}) {
  const req = Readable.from([Buffer.from(JSON.stringify(data))]);
  req.method = options.method || "POST";
  req.headers = {
    "content-type": "application/json",
    origin: options.origin || "https://example.com",
  };
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
  assert.equal(emails[0].reply_to, "visitor@example.com");
  assert.equal(emails[1].reply_to, "owner@example.com");
  assert.match(emails[1].html, /Test &lt;Visitor&gt;/);
  assert.doesNotMatch(emails[1].html, /<Visitor>/);
  assert.match(emails[1].text, /Thank you for reaching out/);
});
test("sends both emails in a single batch and keeps retry idempotency stable", async () => {
  const calls = [];
  const handler = createContactHandler({
    env,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({ data: [{ id: "owner" }, { id: "thanks" }] }),
      };
    },
  });
  assert.equal((await invoke(handler)).status, 200);
  assert.equal((await invoke(handler)).status, 200);
  assert.equal(calls[0].url, "https://api.resend.com/emails/batch");
  assert.equal(JSON.parse(calls[0].options.body).length, 2);
  assert.equal(
    calls[0].options.headers["Idempotency-Key"],
    calls[1].options.headers["Idempotency-Key"],
  );
});
test("missing settings, invalid inputs and cross-origin requests never send mail", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
  };
  assert.equal(
    (
      await invoke(
        createContactHandler({ env: { SITE_URL: env.SITE_URL }, fetchImpl }),
      )
    ).status,
    503,
  );
  const handler = createContactHandler({ env, fetchImpl });
  assert.equal(
    (await invoke(handler, enquiry, { origin: "https://other.example" }))
      .status,
    403,
  );
  assert.equal(
    (await invoke(handler, { ...enquiry, consent: false })).status,
    400,
  );
  assert.equal((await invoke(handler, enquiry, { method: "GET" })).status, 405);
  assert.equal(calls, 0);
});
test("provider failure and partial responses never claim success", async () => {
  for (const result of [
    { ok: false, json: async () => ({ message: "denied" }) },
    { ok: true, json: async () => ({ data: [{ id: "one" }] }) },
  ]) {
    assert.equal(
      (
        await invoke(
          createContactHandler({ env, fetchImpl: async () => result }),
        )
      ).status,
      502,
    );
  }
});
test("limits repeated enquiries to a recipient", async () => {
  const handler = createContactHandler({
    env,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ data: [{ id: "a" }, { id: "b" }] }),
    }),
  });
  for (let i = 0; i < 5; i++) assert.equal((await invoke(handler)).status, 200);
  assert.equal((await invoke(handler)).status, 429);
});
