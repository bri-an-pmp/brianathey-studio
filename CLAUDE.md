# Guide for AI coding agents

Brian Athey Studio: personal website for brianathey.studio (music, code, photography, translation via Notary Confi). The owner is not a developer: explain things in plain language, step by step.

## Status (2026-10-16)

- Built locally; not yet on GitHub. Plan: new repo `bri-an-pmp/brianathey-studio`, GitHub Pages from `main`, then GoDaddy DNS (A records 185.199.108-111.153, CNAME `www` → `bri-an-pmp.github.io`). Never ask for GoDaddy passwords or API keys.
- Ask before creating the repo, committing or pushing. Nothing goes live until the owner says "publish".
- Open items: Santiago de Chile photo collection (photos not received yet), Notary Confi services and quote contact.

## Rules

- **Style:** neo-noir sci-fi inspired by Blade Runner 2049 (night blue fog and red neon at the top; from the Code section down, a dusty red-gold brutalist "apartment view" and warm palette). All art and music must be original: no film, game or brand assets, names or logos.
- **Two languages:** every visible phrase in English and Spanish (`js/i18n.js`, formal "usted"). Place names: use Spanish names when in doubt (e.g. "Mercado de las Brujas", "Catedral de La Paz").
- **Security policy:** new outside services must be added to the Content-Security-Policy meta tag in `index.html`. Use `textContent`, not `innerHTML`, for any text.
- **Accessibility/phones:** tap targets ≥ 44px, readable contrast, no horizontal scroll at 390px, respect reduced motion.
- **Soundtrack (`js/music.js`):** original ambient film-score style, kept chill and soft; it only plays when the visitor presses the button.

## Photos

Each collection lives in `assets/photos/<id>/` (`01.jpg` + `01-thumb.jpg`, …) and is listed in `js/albums.js` with English and Spanish captions. Make web copies with the helper, which also strips camera/GPS data:

```
swiftc -O tools/resize.swift -o /tmp/resize
/tmp/resize original.jpg assets/photos/<id>/01.jpg 1800 0.7
/tmp/resize original.jpg assets/photos/<id>/01-thumb.jpg 560 0.66
```

Remove near-duplicate photos. The helper prints width and height for the album entry.

## Preview

`python3 -m http.server 8765` in this folder, then open http://localhost:8765. Check desktop and phone width before saying a change is done.
