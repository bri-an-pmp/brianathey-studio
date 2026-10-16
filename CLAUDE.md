# Guide for AI coding agents

Brian Athey Studio: personal website for brianathey.studio (music, code, photography, translation via Notary Confi). The owner is not a developer: explain things in plain language, step by step.

## Status (2026-10-16)

- Live on GitHub Pages from `main` of `bri-an-pmp/brianathey-studio` (custom domain in `CNAME`). DNS at GoDaddy: A records 185.199.108-111.153, CNAME `www` → `bri-an-pmp.github.io`. Never ask for GoDaddy passwords or API keys.
- Pushing to `main` publishes the site. Preview first, and push only when the owner says "publish".
- Open items: Notary Confi services and quote contact, Index tile 08.

## Rules

- **Style:** neo-noir sci-fi inspired by Blade Runner 2049 (night blue fog and red neon at the top; from the Code section down, a dusty red-gold brutalist "apartment view" and warm palette). All art and music must be original: no film, game or brand assets, names or logos.
- **Two languages:** every visible phrase in English and Spanish (`js/i18n.js`, formal "usted"). Place names: use Spanish names when in doubt (e.g. "Mercado de las Brujas", "Catedral de La Paz").
- **Security policy:** new outside services must be added to the Content-Security-Policy meta tag in `index.html`. Use `textContent`, not `innerHTML`, for any text.
- **Accessibility/phones:** tap targets ≥ 44px, readable contrast, no horizontal scroll at 390px, respect reduced motion.
- **Soundtrack (`js/music.js`):** original ambient film-score style, kept chill and soft; it only plays when the visitor presses the button.

## Photos

New galleries come through the drop folder, not chat uploads:

1. The owner copies photos into `photo-inbox/<Gallery Name>/` (gitignored; never published).
2. Run `tools/add-album.sh "<Gallery Name>"`. It resizes to 1800px (thumbnails 560px), strips camera/GPS data, numbers the files oldest-first into `assets/photos/<slug>/` and prints a starter entry for `js/albums.js`.
3. Look at the **thumbnails** (`*-thumb.jpg`, small) to write captions in English and Spanish, pick a cover and six preview photos, and remove near-duplicates (delete the files and renumber).
4. Preview, then publish when the owner says so.

Use Spanish place names when in doubt (e.g. "Mercado de las Brujas", "Catedral de La Paz"). For unidentified places use a Spanish description in both languages (e.g. "Iglesia con campanarios"); never say "twin tower(s)".

## Preview

`python3 -m http.server 8765` in this folder, then open http://localhost:8765. Check desktop and phone width before saying a change is done.
