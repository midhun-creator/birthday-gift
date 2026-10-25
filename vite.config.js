import { defineConfig } from 'vite';

/* ============================================================
   VITE CONFIGURATION
   base './' (relative) works on ANY path: locally, and on GitHub Pages at
   https://<user>.github.io/<repo>/. If you ever prefer an absolute base, set
   REPO_BASE to your repo slug, e.g. '/birthday-akshaya/'.
   ============================================================ */
const REPO_BASE = './'; // e.g. '/birthday-akshaya/'

/* Preload the two font files the very first screen (the envelope) needs, so
   the name and "tap to open" appear without waiting. Hashed filenames are
   looked up from the bundle, so this survives rebuilds. */
function preloadFirstScreenFonts() {
  let base = REPO_BASE;
  return {
    name: 'preload-first-screen-fonts',
    configResolved(cfg) { base = cfg.base; },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html; // dev server: nothing to preload
        const wanted = [/great-vibes-latin-400-normal.*\.woff2$/, /cormorant-garamond-latin-600-italic.*\.woff2$/];
        const tags = Object.keys(ctx.bundle)
          .filter((f) => wanted.some((re) => re.test(f)))
          .map((f) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: base + f },
            injectTo: 'head',
          }));
        return { html, tags };
      },
    },
  };
}

export default defineConfig({
  base: REPO_BASE,
  plugins: [preloadFirstScreenFonts()],
});
