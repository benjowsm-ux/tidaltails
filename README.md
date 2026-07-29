# Tidal Tails — tidaltails.uk

Static marketing site for Tidal Tails Pet Waste Removal, Weston-super-Mare.
No build step, no framework, no dependencies. Upload the folder and it works.

---

## The three files you'll actually edit

| File | What's in it |
|---|---|
| `js/config.js` | Phone, WhatsApp, email, opening hours, service-area postcodes, trust badges |
| `js/pricing.js` | **Every price the business charges.** Change a number here and the calculator, the published rate table and the quote email all follow |
| `photos/` | Drop real photos in (see below) |

Everything else can be left alone.

### Changing a price

Open `js/pricing.js`. The whole rate card is the `TT_RATES` object at the top —
garden sizes, extra-dog steps, frequency multipliers, catch-up fees, extras and
the 15% reduced rate. Nothing is hard-coded anywhere else, so the price list on
`pricing.html` can never drift out of sync with the calculator.

### Changing the service area

`js/config.js` → `coverage.core` and `coverage.extended`. The postcode checker,
both tables on the Areas page and the friendly place-name list all read from it.

---

## Before you go live

1. **Photos.** See the table below. The site looks fine without them — each slot
   shows a tidy "photo coming soon" panel — but real photos are the single
   biggest improvement available.
2. **Testimonials.** The three on the home page are clearly labelled as
   illustrative. Swap them for real ones as soon as you have them, and delete the
   disclaimer line underneath when you do.
3. **Insurance.** `config.js` → `trust.insured` is set to `false` and every
   "fully insured" claim has been stripped from the site. Flip it back to `true`
   only once cover is actually in place — and see the note below.

## The round

`config.js` → `rounds` is the schedule. One area per day, and a customer's area
decides their day — there is no time-picking anywhere on the site, which is what
stops double-bookings before they can happen.

Change an area's day by moving it between the lists. The home page table, the
areas page, the neighbourhood dropdown in the quote form and the "you're on our
Tuesday round" message all read from it.

## Verifying a quote

The price is calculated in the customer's browser, so it can be edited by anyone
who opens devtools. Every submission therefore carries a `quote_raw` field — the
raw inputs, the total, and a short fingerprint.

To check an enquiry is genuine, open the site's console and run:

```js
ttVerifyQuote({garden:'medium',dogs:2,dogSize:'medium',frequency:'weekly',backlog:'month',extras:['takeAway']}, 34, 'A1B2C3D')
```

It returns `ok: true/false` plus the correct total. Unknown or out-of-range
values (a negative dog count, an invented garden size) are clamped to safe
defaults before pricing, so a tampered form can never produce a number below the
minimum charge.

## Photos

Drop files into `photos/` with these exact names and they appear automatically —
no code change. Anything missing falls back to a placeholder panel.

| Filename | Where it shows | Ideal shape |
|---|---|---|
| `before-1.jpg` | Home page before/after slider, left | 4:3 landscape |
| `after-1.jpg` | Home page before/after slider, right | 4:3 landscape, **same camera position as before-1** |
| `regular-visit.jpg` | Services → Regular clears | 3:4 portrait |
| `about-team.jpg` | About page | 3:4 portrait |

For the before/after pair, stand in the same spot for both shots — the slider
only works if the two frames line up.

Keep files under ~400KB. To resize a big photo:

```
npx sharp-cli -i photos/big.jpg -o photos/ -f jpeg resize 1600
```

## Deploying (GitHub Pages, same as the WBA site)

1. Create a repo, e.g. `benjowsm-ux/tidaltails`.
2. **Add file ▸ Upload files**, drag in everything in this folder, commit.
3. Settings ▸ Pages ▸ Deploy from branch ▸ `main` / root.
4. Settings ▸ Pages ▸ Custom domain → `tidaltails.uk`. The `CNAME` file is
   already in place, so this should just take.
5. At your domain registrar, point the apex `A` records at GitHub:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`,
   and a `CNAME` for `www` → `benjowsm-ux.github.io`.
6. Tick **Enforce HTTPS** once the certificate has issued (can take an hour).

Then submit `https://tidaltails.uk/sitemap.xml` in Google Search Console and set
up a Google Business Profile — for a local service business that listing will
bring in more work than the site itself.

## Pages

`index` · `services` · `pricing` (quote builder + enquiry form) · `areas` ·
`about` · `faq` · `contact` · `thanks` · `privacy` · `terms` · `404`

## Assets

`assets/` is generated from `assets/logo-source.png` by `build-assets.js` —
logo sizes, favicons, the social share card and the watercolour washes that
match the business cards. You only need to re-run it if the logo or brand
colours change:

```
node build-assets.js
```

The watercolour washes are real SVG turbulence filters, but they're rendered to
WebP at build time rather than left live in the page — so phones never have to
run an expensive filter just to draw a background, and the hero image is ~100KB
instead of ~475KB as PNG.

## Local preview

```
npx http-server . -p 8087 -c-1
```

Then open `http://localhost:8087`. Avoid port 5060 — Chrome blocks it outright
(`ERR_UNSAFE_PORT`) because it's the SIP port, which will look like the server
is broken when it isn't.

## Notes on how it's built

- **Brand teal `#0D717D`** is sampled directly from the logo artwork; every other
  colour in the palette derives from it. All tokens live at the top of
  `css/styles.css`.
- **The quote builder** is one implementation (`buildQuoteWidget` in `main.js`)
  driving both the compact hero version and the full pricing-page one. Only the
  full one saves to `sessionStorage`, so a detailed quote survives a click
  through to the contact page and gets attached to the message.
- **Accessibility**: skip links, visible focus rings, real `<fieldset>/<legend>`
  grouping, `aria-expanded` accordions with `inert` panels, keyboard-operable
  before/after slider, and `prefers-reduced-motion` respected throughout.
- **No tracking.** No analytics, no pixels, no cookies — which is why there's no
  cookie banner and the privacy notice can be short and honest. If you add
  analytics later you will need to revisit that page.

## Two things to sort out

**Insurance.** Public liability cover isn't legally required to trade, but you're
working alone in other people's gardens, around their gates and their dogs. One
escaped dog hit by a car, or one patio door put through with a rake handle, is a
bill you'd be paying personally. It's roughly £60–£120 a year for a sole trader
doing this kind of work — cheap for what it removes. Every insurance claim has
been taken off the site until it's real; put `trust.insured` back to `true` and
re-add the badges once you have a certificate.

**DBS.** A check done by a previous employer belongs to that employer's decision,
at that date — it isn't a portable certificate you can keep showing people. If
you still hold the paper certificate you can show it, but it's a snapshot of the
day it was issued. For care-home and school work, get your own via a DBS umbrella
body and put it on the **Update Service** (~£13/year) — that makes it live,
checkable by anyone you give permission to, and worth advertising. Until then,
"DBS checked" is defensible if you hold the certificate, but don't lean on it
in a tender.
