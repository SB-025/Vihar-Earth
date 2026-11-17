# Vihar Earth — React edition

This is a separate version. The original HTML website in the parent folder is preserved.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```powershell
cd "C:\Vihar Earth\react-version"
npm install
npm run dev
```

Open the printed local URL. The Node server runs Vite and the contact API together. See EMAIL-SETUP.md to configure Gmail SMTP.

## Deploy on Vercel

Import this GitHub repository and select:

- Root directory: `react-version`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Configure the server-only SMTP variables described in EMAIL-SETUP.md, then redeploy. Vercel runs api/contact.js alongside the static frontend. `npm run preview` previews only the frontend; use `npm run dev` for the email API locally.

## Included

- React components and five hash-routed pages; direct route refresh works on static hosting.
- Lazy-loaded Three.js terrain background with bronze contour lines, pointer-following light, ripples and camera parallax.
- Motion page transitions, scroll reveals, animated land filters and landscape crossfades.
- Perspective cards and floating depth layers.
- Mobile navigation, keyboard interaction, automatic reduced-motion support.
- All eight services, filtering and service-prefilled enquiry form.
- Nodemailer contact form, thank-you emails, and direct call/email links.

Edit `src/data.js` for services, `src/main.jsx` for page content, `src/styles.css` for appearance, and `src/TerrainScene.jsx` for the 3D scene. Assets are local in `public/assets/`. Google Fonts loads Marcellus and DM Sans with system fallbacks.

The original request's “barallel lands” remains interpreted as “Barren lands”. Land cards are illustrative categories, not verified listings. The supplied logo and demo contact details have been retained. Indian landscape photo credits are recorded in `public/assets/CREDITS.md`.

The Nodemailer backend is ready. No live email credentials are configured; follow `EMAIL-SETUP.md` to activate sending.

## Validation

`npm test` checks React navigation, services, land filtering, frontend contact links, absence of the contact logo and keyboard menu dismissal. `npm run build` creates the deployment bundle. Browser visual and WebGL testing remain separate checks.
