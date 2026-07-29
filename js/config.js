/* ═══════════════════════════════════════════════════════════════════════════
   TIDAL TAILS — site configuration
   Everything that changes when the business details change lives here.
   Edit this file, not the pages.
   ═══════════════════════════════════════════════════════════════════════════ */

window.TT = {

  /* ── contact ─────────────────────────────────────────────────────────── */
  phone: '07944 706 274',
  whatsapp: '447944706274',        // international digits, no +, for wa.me links
  email: 'info@tidaltails.uk',
  domain: 'tidaltails.uk',
  siteUrl: 'https://tidaltails.uk',
  businessName: 'Tidal Tails',
  legalName: 'Tidal Tails Pet Waste Removal',

  hours: [
    { days: 'Monday – Friday', time: '8:00am – 6:00pm' },
    { days: 'Saturday',        time: '9:00am – 4:00pm' },
    { days: 'Sunday',          time: 'Closed (messages answered)' }
  ],

  /* ── form delivery ───────────────────────────────────────────────────── */
  formspree: 'mykroopl',

  /* ── payment ──────────────────────────────────────────────────────────
     Paste a Stripe Payment Link (or similar) here to turn on pay-on-booking.
     While it's empty the booking button just sends the enquiry, so nothing
     breaks and no one can pay for a slot that hasn't been confirmed.       */
  paymentLink: '',

  /* ── service area ─────────────────────────────────────────────────────
     Weston-super-Mare only. BS22, BS23 and BS24 — and not all of BS24:
     Hutton and Bleadon are too far out to be worth the journey.           */
  coverage: {
    core: {
      BS22: 'Worle, St Georges, Milton, Kewstoke, Mead Vale, Locking Castle',
      BS23: 'Weston town, Bournville, Uphill, Ashcombe, Hillside',
      BS24: 'Oldmixon, Locking, Weston Village, Haywood Village, West Wick'
    },
    /* Named so the checker can say "no" clearly rather than "maybe". */
    excluded: {
      'BS24 Hutton': 'Hutton',
      'BS24 Bleadon': 'Bleadon'
    }
  },

  /* ── the round ─────────────────────────────────────────────────────────
     One day, one part of town. This is what keeps fuel and driving time
     down, and it removes scheduling haggling entirely — your neighbourhood
     decides your day, so there is no diary to conflict with.

     `key` must stay stable (it goes into form submissions).                */
  rounds: [
    { day: 'Monday',    key: 'mon', areas: ['Bournville', 'Oldmixon', 'Coronation'] },
    { day: 'Tuesday',   key: 'tue', areas: ['Milton', 'Ashcombe', 'Hillside'] },
    { day: 'Wednesday', key: 'wed', areas: ['Worle', 'St Georges'] },
    { day: 'Thursday',  key: 'thu', areas: ['Weston town centre', 'Uphill', 'Clarence Park'] },
    { day: 'Friday',    key: 'fri', areas: ['Locking Castle', 'Mead Vale', 'Haywood Village', 'West Wick'] },
    { day: 'Saturday',  key: 'sat', areas: ['Kewstoke', 'Weston Village', 'Locking'] }
  ],

  /* ── products ─────────────────────────────────────────────────────────── */
  sanitiser: {
    brand: 'Bugalugs',
    note: 'Pet-safe, professional grade'
  },

  /* ── trust ─────────────────────────────────────────────────────────────
     Only claims that are true today. The site renders nothing for a false
     flag, so this is the one switch to flip when something changes.        */
  trust: {
    insured: false,          // ← no public liability cover yet
    dbsChecked: true,        // clear DBS held; see README before advertising it
    vatRegistered: false,    // not mentioned on the site either way
    noContract: true
  }
};
