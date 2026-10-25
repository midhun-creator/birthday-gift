# Happy Birthday, Akshaya ♥ — Interactive Birthday Film

A mobile-first cinematic birthday experience in five acts, plus an interactive
keepsake gift (five "Open when…" letters) and a golden wish-star finale. Built
with **Vite**, **GSAP**, **Canvas 2D** and the **Web Audio API**. All sound is
synthesized live, so there are no audio files. Fonts are bundled from npm, so
there is no CDN and it works offline.

## 1. Edit the personal details (`config.js`)

- **`RECIPIENT_NAME`** — defaults to `'Akshaya'`; capped at 24 characters.
  Override per link with `?to=Name`.
- **`SENDER_NAME`** — currently `'Midhun'`. Every unfolded letter is signed
  with it. Change it to your own name or signature.
- **`NOTES`** — titles and text of the five "Open when…" letters.
- **`WISH_STYLE`** — the wish length limit (80 characters) and label.

## 2. Run locally

```bash
npm ci            # install exact dependency versions
npm run dev       # http://localhost:5173
npm run build     # production bundle in ./dist
npm run preview   # http://localhost:4173
```

## 3. Deploy to GitHub Pages

1. Push this repository to the `main` branch on GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. `.github/workflows/deploy.yml` runs `npm ci` and `npm run build`, then
   publishes `dist/`. It also sets `VITE_SITE_URL` to
   `https://<owner>.github.io/<repo>/` so the share image and `og:url` are
   absolute URLs, which WhatsApp, iMessage and others require.
4. `vite.config.js` uses `base: './'`, so everything works under any
   `/repo-name/` path. If you use a custom domain, set `VITE_SITE_URL` in
   `.env` and in the workflow to that domain (keep the trailing slash).

## 4. Share the link

- **Default:** `https://<owner>.github.io/<repo>/`
- **Other name:** `…/?to=Name`
- **Audio debug:** `…/?debug=audio` logs audio-clock cue times and mixer levels
  to the console; `window.bdayAPI.measureAudio()` renders the mix offline and
  reports peak and RMS levels.

## 5. Files you can replace

`public/preview.jpg` (1200×630 share image), `public/favicon.png`,
`public/apple-touch-icon.png` and `public/textures/grain.png`.

## Notes

- The sound needs a first tap (browser rule); the envelope tap provides it.
- Reduced-motion users get a calmer version with the same content.
- Tested in headless Chromium at 360×640, 390×844, 844×390 and 1440×900,
  including a full playthrough, replay, reduced motion and long names.
  Please also try it once on your own phone, with sound on, before sending.
