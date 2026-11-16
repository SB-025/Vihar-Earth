# Vihar Earth

A responsive five-page website using the supplied company logo and the contact details from the original demo. Built with plain HTML, CSS and JavaScript; no installation or build dependencies are needed.

## Open the website

Open `index.html` directly in a browser. For a local HTTP preview, run `python -m http.server 5500 --bind 127.0.0.1` from this folder, then open http://127.0.0.1:5500.

## Pages and features

- Home, Our Story, Services, Explore Lands, Contact
- All eight requested services; “barallel lands” interpreted as “Barren lands”
- Perspective hover animations, landscape entrance animation and scroll reveals
- Responsive navigation, accessible form labels and reduced-motion support
- Land category filters and service-prefilled contact links
- Contact form validation, prepared email and copy-to-clipboard fallback

## Editing

Page content is maintained in `build.py`. Run `python build.py` to regenerate all five HTML pages. Styling is in `styles.css`, interactions in `app.js`, images in `assets/`.

The form prepares an email in the visitor's mail application. It does not submit to a backend or store visitor data. A backend/email provider is needed for direct submission. Land cards are illustrative categories, not verified listings. No invented inventory, pricing or testimonials have been added.

The original company logo is included unchanged. Landscape photos are downloaded from Unsplash (photo IDs: 1500382017468-9049fed747ef, 1472396961693-142e6e269027, 1510414842594-a61c69b5ae57) and are illustrative. Google Fonts supplies Marcellus and DM Sans when online, with Georgia/Arial fallbacks offline.

This is a local website; no public hosting has been configured.
