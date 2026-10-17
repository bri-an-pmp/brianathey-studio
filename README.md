# Brian Athey Studio

**Live site: [https://brianathey.studio](https://brianathey.studio)**

Personal website in a neo-noir sci-fi style (blue fog, red neon, brutalist skyline, rain, flying cars): music, code, photography and translation (Notary Confi). English and Spanish.

All art and music are original. Nothing is taken from any film, game or soundtrack.

## Files

- `index.html`: all page text and layout
- `styles.css`: colors, scenery and layout
- `js/main.js`: music players, GitHub projects, clock, file-opening animation
- `js/music.js`: the ambient soundtrack, generated live (no audio files)
- `js/rain.js`: the rain in the background
- `js/spinners.js`: the flying cars over the city
- `js/albums.js` and `js/gallery.js`: photo collections and the carousel gallery
- `js/i18n.js`: every English and Spanish phrase (edit both when changing text)
- `js/sound.js`: optional interface sounds (off by default)
- `assets/`: skyline drawings and the icon

## Preview on your computer

```
cd ~/projects/brianathey-studio
python3 -m http.server 8765
```

Then open http://localhost:8765

## Publishing

Plain HTML/CSS/JS with no build step. GitHub Pages serves it straight from the `main` branch.

## Adding things

- **Music links:** the `EMBEDS` list at the top of `js/main.js`, plus the links in the Music Zone of `index.html`
- **GitHub projects:** load automatically from github.com/bri-an-pmp
- **Photos:** each collection lives in `assets/photos/<collection-id>/` as `01.jpg`, `01-thumb.jpg`, `02.jpg`… and is listed in `js/albums.js` (title, subtitle, cover, preview photos, and an English and Spanish caption for each photo). Web copies are about 1800px on the long side (thumbnails 560px) with all camera and location data removed.
- **Allowed outside services:** the `Content-Security-Policy` line at the top of `index.html`. A new embed or service must be added there or the browser blocks it.
