/* ═══════════════════════════════════════════════════════════════════════════
   TIDAL TAILS — pricing engine
   ---------------------------------------------------------------------------
   Every number the business charges lives in TT_RATES below. Change a number
   here and the quote builder, the rate table and the summary all follow.

   ON TRUST: this runs in the customer's browser, so the figure it produces can
   be edited by anyone who opens devtools. It is therefore treated as a QUOTE,
   never as an agreed price. Every submission carries the raw inputs and a
   fingerprint, so the real price can be recomputed from the inputs on receipt
   and any edited total shows up as a mismatch. See ttVerifyQuote().
   ═══════════════════════════════════════════════════════════════════════════ */

const TT_RATES_VERSION = '2026-07-28';

const TT_RATES = {

  /* Base price of a single visit, by garden size, including one medium dog,
     on a weekly schedule. Everything else is a multiplier on top. */
  garden: {
    courtyard: { label: 'Courtyard / patio', desc: 'Up to ~25m², no lawn',        base: 8  },
    small:     { label: 'Small garden',      desc: 'Roughly up to 100m²',         base: 10 },
    medium:    { label: 'Medium garden',     desc: 'Typical semi, ~100–250m²',    base: 12 },
    large:     { label: 'Large garden',      desc: 'Big plot, ~250–500m²',        base: 15 },
    xl:        { label: 'Extra large',       desc: 'Over 500m² / paddock',        base: 19 }
  },

  /* Extra dogs cost less each — one more dog in the same garden is not one
     more visit's worth of work. Index 0 is the 2nd dog. */
  extraDogSteps: [2.5, 2.0, 1.5, 1.5, 1.5],
  maxDogs: 6,

  dogSize: {
    small:  { label: 'Small',  desc: 'Terrier, pug, spaniel',   factor: 0.92 },
    medium: { label: 'Medium', desc: 'Collie, cocker, staffie', factor: 1.00 },
    large:  { label: 'Large',  desc: 'Labrador, GSD, mastiff',  factor: 1.14 }
  },

  frequency: {
    twiceWeekly: { label: 'Twice a week', desc: 'Barely see it happen',   factor: 0.80, visitsPerMonth: 8.67, recurring: true },
    weekly:      { label: 'Weekly',       desc: 'Most popular',           factor: 1.00, visitsPerMonth: 4.33, recurring: true },
    fortnightly: { label: 'Fortnightly',  desc: 'Every other week',       factor: 1.55, visitsPerMonth: 2.17, recurring: true },
    monthly:     { label: 'Monthly',      desc: 'A proper monthly reset', factor: 2.40, visitsPerMonth: 1,    recurring: true },
    oneOff:      { label: 'One-off',      desc: 'Just this once',         factor: 1,    visitsPerMonth: 0,    recurring: false }
  },

  backlog: {
    current:  { label: 'It’s up to date',     catchUp: 0,  oneOffFactor: 1.8 },
    fortnight:{ label: 'A week or two',       catchUp: 6,  oneOffFactor: 2.2 },
    month:    { label: 'About a month',       catchUp: 14, oneOffFactor: 2.9 },
    quarter:  { label: 'Two or three months', catchUp: 25, oneOffFactor: 3.8 },
    longer:   { label: 'Longer than that',    catchUp: 40, oneOffFactor: 4.8 }
  },

  catchUpGardenFactor: { courtyard: 0.8, small: 1.0, medium: 1.2, large: 1.45, xl: 1.7 },
  catchUpPerExtraDog: 0.15,

  extras: {
    takeAway:   { label: 'Take the waste away with us', desc: 'Otherwise it’s double-bagged into your own bin',   price: 2.00 },
    deepClean:  { label: 'Full sanitise & deodorise',   desc: 'Bugalugs treatment across the whole area',          price: 4.00 },
    frontToo:   { label: 'Do the front garden as well', desc: 'Verge, path and front lawn',                        price: 3.00 },
    astroturf:  { label: 'Artificial grass treatment',  desc: 'Rinsed and treated — synthetic lawns hold smell',   price: 5.00 },
    binClean:   { label: 'Clean out your waste bin',    desc: 'Rinsed and deodorised',                             price: 3.00 }
  },

  /* ── the two ways of buying ────────────────────────────────────────────
     "full" is us in the garden. "collect" is a lockable caddy on the customer's
     side — they scoop, we swap it at the kerb. Far quicker per stop, so it can
     be cheaper for them and still worth more per hour to us. */
  serviceType: {
    full:    { label: 'We do the scooping', desc: 'We come into the garden and clear it' },
    collect: { label: 'You scoop, we collect', desc: 'You fill the caddy, we take it away' }
  },

  collection: {
    /* per collection, one dog included */
    base: { twiceWeekly: 5.5, weekly: 7.5, fortnightly: 11, monthly: 16, oneOff: 12 },
    perExtraDog: 0.5,
    caddy: 20,                 // one-off, or bring your own
    minimum: 5
  },

  /* Applied by hand at invoicing, as a thank-you, for customers who plainly
     need it. Deliberately NOT on the website and NOT a box anyone can tick —
     a self-declared discount just becomes the default price. */
  goodwillDiscount: 0.15,

  minimumVisit: 8,
  minimumOneOff: 25,
  roundTo: 0.5
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

const ttRound = (n, step = TT_RATES.roundTo) => Math.round(n / step) * step;

/* Whole pounds lose the decimals; anything else keeps both — £12, £14.50 */
const ttMoney = (n) => '£' + (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2));

/**
 * Coerces whatever arrived into a known-good input set. Anything unrecognised
 * falls back to a default rather than being trusted, so a hand-edited form
 * value can't invent a cheaper garden size or a negative dog count.
 */
function ttNormalise(input) {
  const R = TT_RATES;
  const pick = (map, val, fallback) => (Object.prototype.hasOwnProperty.call(map, val) ? val : fallback);
  const extras = Array.isArray(input.extras) ? input.extras : [];
  return {
    service: pick(R.serviceType, input.service, 'full'),
    caddy: !!input.caddy,
    garden: pick(R.garden, input.garden, 'medium'),
    dogSize: pick(R.dogSize, input.dogSize, 'medium'),
    frequency: pick(R.frequency, input.frequency, 'weekly'),
    backlog: pick(R.backlog, input.backlog, 'current'),
    dogs: Math.min(Math.max(parseInt(input.dogs, 10) || 1, 1), R.maxDogs),
    /* de-duplicated, known keys only, stable order so the fingerprint is stable */
    extras: Object.keys(R.extras).filter(k => extras.includes(k))
  };
}

/**
 * The single source of truth for what a customer pays.
 * Returns a fully itemised breakdown, safe to render straight out.
 */
function ttQuote(rawInput) {
  const R = TT_RATES;
  const input = ttNormalise(rawInput || {});
  const garden = R.garden[input.garden];
  const size = R.dogSize[input.dogSize];
  const freq = R.frequency[input.frequency];
  const backlog = R.backlog[input.backlog];
  const dogs = input.dogs;

  let extraDogs = 0;
  for (let i = 0; i < dogs - 1; i++) {
    extraDogs += R.extraDogSteps[Math.min(i, R.extraDogSteps.length - 1)];
  }

  const lines = [];
  const result = {
    recurring: freq.recurring,
    frequencyLabel: freq.label,
    visitsPerMonth: freq.visitsPerMonth,
    service: input.service,
    lines,
    input
  };

  /* ── caddy collection ────────────────────────────────────────────────
     No garden to walk, no backlog to price — it's a swap at the kerb. */
  if (input.service === 'collect') {
    const C = R.collection;
    lines.push({
      label: `${freq.label} collection`,
      amount: ttRound(C.base[input.frequency] ?? C.base.weekly)
    });
    if (dogs > 1) {
      lines.push({ label: `${dogs - 1} extra dog${dogs - 1 > 1 ? 's' : ''}`, amount: ttRound(C.perExtraDog * (dogs - 1)) });
    }
    if (input.extras.includes('binClean')) {
      lines.push({ label: R.extras.binClean.label, amount: ttRound(R.extras.binClean.price) });
    }

    const per = Math.max(lines.reduce((s, l) => s + l.amount, 0), C.minimum);
    const caddy = input.caddy ? C.caddy : 0;

    result.perVisit = per;
    result.perMonth = freq.recurring ? ttRound(per * freq.visitsPerMonth) : 0;
    result.firstVisitExtra = caddy;
    result.firstPayment = ttRound(per + caddy);
    result.headline = per;
    result.headlineUnit = 'per collection';
    result.subline = freq.recurring
      ? `${ttMoney(result.perMonth)} a month · you scoop, we take it away`
      : 'One collection — nothing recurring';
    if (caddy) result.caddyNote = `Includes a ${ttMoney(caddy)} lockable caddy, yours to keep.`;

    result.total = result.firstPayment;
    result.fingerprint = ttFingerprint(input, result.total);
    return result;
  }

  if (freq.recurring) {
    /* Each line is rounded first and the total is the sum of those rounded
       lines, so the breakdown the customer reads always adds up exactly. */
    lines.push({ label: `${garden.label} — ${freq.label.toLowerCase()} visit`, amount: ttRound(garden.base * size.factor * freq.factor) });
    if (extraDogs > 0) {
      lines.push({ label: `${dogs - 1} extra dog${dogs - 1 > 1 ? 's' : ''}`, amount: ttRound(extraDogs * size.factor * freq.factor) });
    }
    input.extras.forEach(k => lines.push({ label: R.extras[k].label, amount: ttRound(R.extras[k].price) }));

    const visit = Math.max(lines.reduce((s, l) => s + l.amount, 0), R.minimumVisit);

    let catchUp = backlog.catchUp
      * (R.catchUpGardenFactor[input.garden] ?? 1)
      * (1 + R.catchUpPerExtraDog * (dogs - 1));
    catchUp = catchUp > 0 ? ttRound(catchUp) : 0;

    result.perVisit = visit;
    result.perMonth = ttRound(visit * freq.visitsPerMonth);
    result.firstVisitExtra = catchUp;
    result.firstPayment = ttRound(visit + catchUp);
    result.headline = visit;
    result.headlineUnit = 'per visit';
    result.subline = `${ttMoney(result.perMonth)} a month · ${freq.visitsPerMonth === 1 ? '1 visit' : freq.visitsPerMonth.toFixed(2).replace(/\.?0+$/, '') + ' visits'} a month`;

  } else {
    lines.push({ label: `${garden.label} — ${backlog.label.toLowerCase()}`, amount: ttRound(garden.base * backlog.oneOffFactor * size.factor) });
    if (extraDogs > 0) lines.push({ label: `${dogs - 1} extra dog${dogs - 1 > 1 ? 's' : ''}`, amount: ttRound(extraDogs * 2) });
    input.extras.forEach(k => lines.push({ label: R.extras[k].label, amount: ttRound(R.extras[k].price) }));

    const total = Math.max(lines.reduce((s, l) => s + l.amount, 0), R.minimumOneOff);
    result.perVisit = total;
    result.perMonth = 0;
    result.firstVisitExtra = 0;
    result.firstPayment = total;
    result.headline = total;
    result.headlineUnit = 'one-off';
    result.subline = 'Single visit — nothing recurring, no commitment';
  }

  result.total = result.firstPayment;
  result.fingerprint = ttFingerprint(input, result.total);
  return result;
}

/* ── tamper detection ─────────────────────────────────────────────────────
   A short FNV-1a hash of the normalised inputs plus the total. It is NOT a
   security control — the algorithm is right here in the page — but it means a
   quote that has been edited in devtools no longer matches, which is enough to
   catch it on arrival. The defence that actually matters is that the inputs
   travel with the quote, so the price can always be recomputed.            */
function ttFingerprint(input, total) {
  const canonical = [
    TT_RATES_VERSION, input.service, input.caddy ? 'c' : '-', input.garden, input.dogs,
    input.dogSize, input.frequency, input.backlog, input.extras.join('+'), total.toFixed(2)
  ].join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, '0');
}

/**
 * Re-derives the price from submitted inputs and reports whether the quote
 * that came with them is genuine. Run this over an enquiry before you honour
 * the number on it.
 *   ttVerifyQuote({ garden:'medium', dogs:2, ... }, 34, 'A1B2C3D')
 */
function ttVerifyQuote(rawInput, claimedTotal, claimedFingerprint) {
  const fresh = ttQuote(rawInput);
  return {
    ok: Math.abs(fresh.total - Number(claimedTotal)) < 0.005
        && fresh.fingerprint === String(claimedFingerprint || '').toUpperCase(),
    correctTotal: fresh.total,
    correctFingerprint: fresh.fingerprint,
    ratesVersion: TT_RATES_VERSION
  };
}

/**
 * Flattens a quote into label/value pairs — used for the enquiry email, the
 * form payload and the on-page recap, so all three can never drift apart.
 */
function ttQuoteSummary(input, quote) {
  const R = TT_RATES;
  const i = quote.input || ttNormalise(input);
  const extras = i.extras.map(k => R.extras[k].label);

  const rows = [['Service', R.serviceType[i.service].label]];

  if (i.service === 'collect') {
    rows.push(['Dogs', String(i.dogs)]);
    rows.push(['Frequency', quote.frequencyLabel]);
    rows.push(['Caddy', i.caddy ? 'Supplied by us' : 'Customer has their own']);
    rows.push(['Per collection', ttMoney(quote.perVisit)]);
    if (quote.recurring) rows.push(['Estimated monthly', ttMoney(quote.perMonth)]);
    if (quote.firstVisitExtra > 0) rows.push(['First payment', ttMoney(quote.firstPayment) + ' (includes caddy)']);
    rows.push(['Quote ref', quote.fingerprint + '/' + TT_RATES_VERSION]);
    return rows;
  }

  rows.push(
    ['Garden size',  R.garden[i.garden].label],
    ['Dogs',         `${i.dogs} × ${R.dogSize[i.dogSize].label.toLowerCase()}`],
    ['Frequency',    quote.frequencyLabel],
    ['Last cleared', R.backlog[i.backlog].label],
    ['Extras',       extras.length ? extras.join(', ') : 'None']
  );

  if (quote.recurring) {
    rows.push(['Price per visit', ttMoney(quote.perVisit)]);
    rows.push(['Estimated monthly', ttMoney(quote.perMonth)]);
    if (quote.firstVisitExtra > 0) {
      rows.push(['First-visit catch-up', ttMoney(quote.firstVisitExtra) + ' (one time)']);
      rows.push(['First payment', ttMoney(quote.firstPayment)]);
    }
  } else {
    rows.push(['One-off price', ttMoney(quote.perVisit)]);
  }

  rows.push(['Quote ref', quote.fingerprint + '/' + TT_RATES_VERSION]);
  return rows;
}
