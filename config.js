/* ============================================================
   CONFIG.JS — Centralized personalization, texts, colors & gift data
   Reads optional ?to=Name from the URL, defaulting to "Akshaya".
   ============================================================ */

const params = new URLSearchParams(window.location.search);
const rawTo = (params.get('to') || '').trim();

/* Capped at 24 characters so the name always fits the envelope, cake and cards */
export const RECIPIENT_NAME = rawTo ? rawTo.slice(0, 24) : 'Akshaya';

/* Long names shrink a little (CSS reads --name-scale) so nothing overflows */
if (typeof document !== 'undefined') {
  const scale = RECIPIENT_NAME.length > 10 ? Math.max(0.6, 10 / RECIPIENT_NAME.length) : 1;
  document.documentElement.style.setProperty('--name-scale', String(scale.toFixed(2)));
}

/* Edit SENDER_NAME below with your name or signature */
export const SENDER_NAME = 'Midhun';

/* Gift mode: currently "notes". Structured so "video", "voucher", or "link"
   can be plugged into renderGiftContent() later without changing Act 6 shell. */
export const GIFT_TYPE = 'notes';

export const COLORS = {
  rose:       '#d4235c',
  roseLift:   '#ff5f86',
  roseDeep:   '#a80f43',
  goldMid:    '#e8a23d',
  goldLight:  '#ffcf6a',
  goldBright: '#ffe066',
  cream:      '#fff6ee',
  nameGradientStops: [
    { offset: 0.0, color: '#a80f43' },
    { offset: 0.52, color: '#b86a10' },
    { offset: 1.0, color: '#d4871c' },
  ],
};

/* Typography & constraints for the Hero Golden Wish Star (Part A1) */
export const WISH_STYLE = {
  maxChars:   80,
  wishFont:   '"Great Vibes", "Apple Chancery", "Snell Roundhand", cursive',
  labelFont:  '"Cormorant Garamond", "Iowan Old Style", Georgia, serif',
  gradient:   'linear-gradient(110deg, #d4235c 0%, #e8a23d 50%, #ffcf6a 100%)',
  glow:       'drop-shadow(0 1px 10px rgba(255, 248, 235, 0.95)) drop-shadow(0 2px 14px rgba(212, 35, 92, 0.35))',
  labelText:  `${RECIPIENT_NAME}'s wish ✦`,
};

export const TEXTS = {
  pageTitle:       `Happy Birthday, ${RECIPIENT_NAME} ♥ — a little film`,
  metaDescription: `A cinematic birthday film in five acts plus a keepsake gift and golden wish star for ${RECIPIENT_NAME}.`,
  envelopeFor:     `For ${RECIPIENT_NAME}`,
  envelopeHint:    'tap to open ✦',
  heroEyebrowPrefix: 'a little something, for ',
  act3SubPrefix:   'to ',
  act3SubSuffix:   ', someone worth celebrating',
  act4Eyebrow:     'and… make it count',
  act4HeroPrefix:  'Happy Birthday, ',
  act4Sub:         'here’s to a year that blooms',
  cakeTier1:       `Happy Birthday ${RECIPIENT_NAME}`,
  cakeHint:        '✦ tap to blow out ✦',
  cakeFinalLine1:  'Wish you a lifetime',
  cakeFinalLine2:  `of happiness, ${RECIPIENT_NAME} ♥`,
  closingNotePrefix: 'with love, always — for ',
  openGiftBtn:     'open your gift ✦',
  giftHeaderEyebrow: `for ${RECIPIENT_NAME}, whenever you need a reminder`,
  giftHeaderTitle: `Little Letters for ${RECIPIENT_NAME}`,
  wishStarLabel:   `${RECIPIENT_NAME}'s wish ✦`,
  wishStarAnnounce: 'Your wish is now a star.',
};

/* The five "Open when…" letters. Each one shows a photo and a one-line caption.
   - photo:    file in /public/photos (800x1000 or smaller, 4:5)
   - alt:      description for screen readers
   - caption:  the single line shown under the photo
   - text:     fallback shown ONLY if the photo file fails to load */
const photo = (file) => `${import.meta.env.BASE_URL}photos/${file}`;

export const NOTES = [
  {
    title: 'Open when… you need a smile',
    photo: photo('smile.jpg'),
    alt: `${RECIPIENT_NAME} laughing with one hand near her chin, among green trees`,
    text: `Imagine I just told the funniest joke ever.\nNow laugh. That's an order, ${RECIPIENT_NAME}.\nSee? Fixed. You're welcome.`,
  },
  {
    title: 'Open when… you doubt yourself',
    photo: photo('doubt.jpg'),
    alt: `${RECIPIENT_NAME} standing calmly with a soft smile in a green park`,
    text: 'You are more capable than you believe.\nOther people see it clearly.\nBorrow their eyes for a minute.',
  },
  {
    title: 'Open when… you’re overthinking',
    photo: photo('overthinking.jpg'),
    alt: `${RECIPIENT_NAME} resting her chin on her hand, deep in thought`,
    text: 'Breathe. Drink something warm. Play your favourite song.\nTomorrow is a clean page.\nYou have survived every bad day so far.',
  },
  {
    title: 'Open when… someone crosses your mind',
    photo: photo('miss.jpg'),
    alt: `Close-up of ${RECIPIENT_NAME} smiling warmly at the camera`,
    text: "Look up. Same sky, same moon.\nDistance is just a longer hallway.\nI'm thinking of you right now.",
  },
  {
    title: 'Open when… you want a wish to come true',
    photo: photo('wish.jpg'),
    alt: `${RECIPIENT_NAME} in a magenta saree, glancing sideways with a bright smile`,
    text: 'Make it bigger than feels safe.\nThen take one small step today.\nWishes love people who move.',
  },
];

/* Placeholder structure for future gift types ("video", "voucher", "link") */
export const GIFT_EXTRAS = {
  video:   { src: '', caption: `A birthday message for ${RECIPIENT_NAME}` },
  voucher: { title: '', code: '', details: '' },
  link:    { url: '', label: '' },
};
