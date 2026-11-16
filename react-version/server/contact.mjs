import { createHash } from "node:crypto";
import { services } from "../src/data.js";

const allowedServices = new Set([
  "General enquiry",
  ...services.map((s) => s.name),
]);
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
export function validateEnquiry(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Please complete the enquiry form.");
  const limits = {
    name: 100,
    email: 254,
    phone: 20,
    service: 80,
    location: 120,
    message: 3000,
  };
  const data = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof input[key] !== "string" || input[key].length > limit)
      throw new Error("Please check the form fields and try again.");
    data[key] = input[key].trim();
  }
  data.email = data.email.toLowerCase();
  if (
    !data.name ||
    /[\r\n]/.test(data.name) ||
    !emailPattern.test(data.email) ||
    !/^[+0-9\s-]{7,20}$/.test(data.phone) ||
    !data.message ||
    !allowedServices.has(data.service) ||
    input.consent !== true
  )
    throw new Error(
      "Please enter valid contact details, a message and your consent.",
    );
  if (input.website)
    throw new Error("Unable to submit this enquiry. Please call us instead.");
  return data;
}
const escapeHtml = (value) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function createEmails(data, { from, inbox }) {
  const text = `New Vihar Earth enquiry\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nService: ${data.service}\nLocation: ${data.location || "Open to suggestions"}\n\n${data.message}\n\nConsent to contact: yes`;
  const thanks = `Dear ${data.name},\n\nThank you for reaching out to Vihar Earth!\n\nWe have received your enquiry and appreciate your interest in our land and estate services. Our team will review your requirements and get in touch with you.\n\nIf you would like to add anything, simply reply to this email or call +91 99705 67798.\n\nWarm regards,\nSunil Bhansari\nVihar Earth — Land & Estates\nRatnagiri, Maharashtra\nbhansaris@gmail.com\n+91 99705 67798\n\nYou received this email because this address was used in the Vihar Earth enquiry form. If this wasn't you, please ignore it.`;
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f4f0e6;font-family:Arial,sans-serif;color:#2b3028"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;margin:auto;background:#fffdf7;border-top:4px solid #896a40" cellpadding="0" cellspacing="0"><tr><td style="padding:36px"><p style="font-family:Georgia,serif;letter-spacing:2px;font-size:25px;margin:0">VIHAR EARTH</p><p style="font-size:10px;letter-spacing:3px;color:#896a40">LAND &amp; ESTATES</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:32px;line-height:1.2;margin-top:35px">Thank you for reaching out.</h1><p>Dear ${escapeHtml(data.name)},</p><p style="line-height:1.8">We have received your enquiry and appreciate your interest in Vihar Earth. Our team will review your requirements and get in touch with you.</p><p style="line-height:1.8">If you would like to add anything, simply reply to this email or call <a href="tel:+919970567798" style="color:#896a40">+91 99705 67798</a>.</p><p style="line-height:1.8;margin-top:30px">Warm regards,<br><strong>Sunil Bhansari</strong><br>Vihar Earth — Land &amp; Estates<br>Ratnagiri, Maharashtra</p><p style="border-top:1px solid #ddd5c5;padding-top:20px;font-size:11px;color:#73776c">You received this email because this address was used in the Vihar Earth enquiry form. If this wasn't you, please ignore it.</p></td></tr></table></td></tr></table></body></html>`;
  return [
    {
      from,
      to: [inbox],
      reply_to: data.email,
      subject: `Website enquiry — ${data.service}`,
      text,
    },
    {
      from,
      to: [data.email],
      reply_to: inbox,
      subject: "Thank you for reaching out to Vihar Earth",
      text: thanks,
      html,
    },
  ];
}

export function createContactHandler({
  env = process.env,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  const attempts = new Map();
  function allow(key, max) {
    const time = now();
    for (const [k, v] of attempts) if (v.until <= time) attempts.delete(k);
    const previous = attempts.get(key) || {
      count: 0,
      until: time + 15 * 60 * 1000,
    };
    if (previous.count >= max || attempts.size > 10000) return false;
    previous.count++;
    attempts.set(key, previous);
    return true;
  }
  return async function contact(req, res) {
    const send = (status, body) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(body));
    };
    if (req.method !== "POST")
      return send(405, { error: "Method not allowed." });
    const origins = env.SITE_URL
      ? [env.SITE_URL.replace(/\/$/, "")]
      : env.NODE_ENV === "production"
        ? []
        : ["http://127.0.0.1:5173", "http://localhost:5173"];
    if (!origins.includes(req.headers.origin))
      return send(403, {
        error: "Please submit this form from the Vihar Earth website.",
      });
    if (!req.headers["content-type"]?.startsWith("application/json"))
      return send(415, { error: "Please submit the enquiry form." });
    if (!allow(`ip:${req.socket.remoteAddress}`, 20))
      return send(429, {
        error: "Too many attempts. Please try again in 15 minutes or call us.",
      });
    let input, data;
    try {
      const chunks = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 16000)
          return send(413, { error: "Your message is too long." });
        chunks.push(Buffer.from(chunk));
      }
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      data = validateEnquiry(input);
    } catch {
      return send(400, {
        error:
          "Please check your contact details, message and consent, then try again.",
      });
    }
    const id = input.submissionId;
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id))
      return send(400, { error: "Please refresh the page and try again." });
    if (
      !env.RESEND_API_KEY ||
      !env.RESEND_FROM_EMAIL ||
      !emailPattern.test(env.RESEND_FROM_EMAIL)
    )
      return send(503, {
        error:
          "Online enquiries are not available yet. Please email bhansaris@gmail.com or call +91 99705 67798.",
      });
    if (!allow(`email:${data.email}`, 5))
      return send(429, {
        error: "Too many enquiries. Please try again in 15 minutes or call us.",
      });
    const inbox = env.CONTACT_TO_EMAIL || "bhansaris@gmail.com";
    const emails = createEmails(data, {
      from: `Vihar Earth <${env.RESEND_FROM_EMAIL}>`,
      inbox,
    });
    const key = createHash("sha256")
      .update(id + JSON.stringify(data))
      .digest("hex");
    try {
      const response = await fetchImpl("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `enquiry-${key}`,
        },
        body: JSON.stringify(emails),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (
        !response.ok ||
        !Array.isArray(result.data) ||
        result.data.length !== 2 ||
        result.data.some((email) => !email.id)
      )
        throw new Error("Email provider did not accept both emails");
      return send(200, {
        message:
          "Thank you for reaching out! Your enquiry has been submitted, and your confirmation email is on its way. Please check your inbox or spam folder.",
      });
    } catch {
      return send(502, {
        error:
          "We could not confirm your submission. Please try again, or email bhansaris@gmail.com directly.",
      });
    }
  };
}
