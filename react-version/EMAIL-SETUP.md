# Nodemailer + Gmail setup

The contact form sends the enquiry to the company inbox, then a branded thank-you to the visitor. The sender is your Gmail address; a custom domain is not required.

## Activate on Vercel

1. Enable Google **2-Step Verification** for your sending Gmail account.
2. Create an [App Password](https://myaccount.google.com/apppasswords) named Vihar Earth. Some managed Google accounts do not allow this; use another SMTP provider or ask your administrator in that case.
3. Open your Vercel project > **Settings > Environment Variables**. Add these for **Production**:

| Variable | Value |
| --- | --- |
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 465 |
| SMTP_USER | Your complete Gmail address |
| SMTP_PASS | Google App Password, without spaces |
| CONTACT_TO_EMAIL | bhansaris@gmail.com |
| SITE_URL | https://vihar-earth.vercel.app |

4. Keep Root Directory `react-version`, framework Vite, build `npm run build`, output `dist`. Vercel deploys `api/contact.js` as a Node.js function.
5. **Redeploy** after setting the variables. Submit using an email address you control and check both inboxes (including spam).

Never share your App Password in chat, commit it, or put it in React code or a VITE_ variable. Preview deployments need a separately configured exact SITE_URL and credentials if you want them to send real emails.

## Local development

Copy `.env.example` to `.env`, fill in your credentials and run `npm run dev`. Open http://127.0.0.1:5173. This starts Vite and the API together. Restart after changing `.env`. `npm run preview` serves only the frontend. Standalone Node hosting can use `npm run build` then `npm start` with SITE_URL, HOST and PORT configured.

## Behaviour and limitations

The API checks input, consent, origin, payload size and a hidden honeypot. In-memory IP/email rate limits are best-effort only: Vercel instances restart and scale independently. Use shared rate limiting or an edge challenge for stronger public abuse protection.

Missing credentials show an unavailable message. If the enquiry fails, no thank-you is sent. If only the thank-you fails, the form confirms the enquiry but explains the confirmation email could not be sent. SMTP acceptance does not guarantee inbox delivery. SMTP has no transactional/idempotent batch; a connection loss or manual retry can cause duplicate mail. Gmail sending limits and security checks apply.

`npm test` uses mocked SMTP and browser requests; it never sends real emails. Live delivery needs the credentials and a manual check. Templates and validation are in `server/contact.mjs`.

Sources: [Nodemailer Gmail guide](https://nodemailer.com/guides/using-gmail), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).
