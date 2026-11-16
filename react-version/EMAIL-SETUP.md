> Archived integration: automatic email and the contact form are disabled in the current frontend-only version. The following describes the optional backend and requires restoring the form and backend startup before activation.

# Activate contact emails with Resend

The form now submits to the server. A successful request asks Resend to send two separate emails in one batch:

1. The visitor's enquiry to `bhansaris@gmail.com`, with the visitor as Reply-To.
2. A branded thank-you email to the visitor, with your inbox as Reply-To.

No real emails have been sent during development. Automated tests use a simulated provider. The form displays an honest unavailable message until credentials are configured. Provider acceptance is not a guarantee of inbox delivery; check Resend delivery logs for bounces or spam issues.

## Configuration

1. Create a Resend account and [verify your sending domain](https://resend.com/docs/dashboard/domains/introduction). You need access to the domain's DNS. The `gmail.com` domain cannot be used as your verified sending domain; the existing Gmail address can still receive enquiries and replies.
2. Create a sending API key in Resend. Keep it in your local `.env` or hosting secret settings; do not put it in React code or any `VITE_` variable.
3. Copy `.env.example` to `.env`, and fill in `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (a bare address on your verified domain). Leave `CONTACT_TO_EMAIL=bhansaris@gmail.com` or set your preferred receiving inbox.
4. Run `npm run dev` and open `http://127.0.0.1:5173`. Restart the server after changing `.env`.
5. When ready to test delivery, submit with an email address you control. Confirm both the enquiry in your company inbox and the thank-you message in the visitor inbox. This sends real mail through your Resend account.

## Production

Run `npm run build`, then `npm start` on a Node.js hosting service. Configure `SITE_URL` to the exact public HTTPS origin (for example, `https://www.your-domain.com`), `HOST=0.0.0.0`, and the platform's assigned `PORT`. Use the same server to serve the website and `/api/contact`. Static-only hosting and `npm run preview` cannot send emails.

The server keeps short-lived rate-limit counters in memory, validates incoming fields, checks the request origin, uses a honeypot, and uses Resend idempotency keys for safe retries. For multiple server instances, move the rate-limit counters to shared storage. Configure additional abuse protection at the hosting edge before running large public campaigns.

## Thank-you message

Subject: **Thank you for reaching out to Vihar Earth**

Dear [visitor name],

Thank you for reaching out to Vihar Earth!

We have received your enquiry and appreciate your interest in our land and estate services. Our team will review your requirements and get in touch with you.

If you would like to add anything, simply reply to this email or call +91 99705 67798.

Warm regards,  
Sunil Bhansari  
Vihar Earth — Land & Estates  
Ratnagiri, Maharashtra

Templates and server validation are in `server/contact.mjs`. The HTML email uses the website's ivory and bronze palette and includes a plain-text version. The visitor's free-form message is sent only to the company inbox, not echoed into the automatic reply.
