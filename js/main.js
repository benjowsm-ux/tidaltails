/* ═══════════════════════════════════════════════════════════════════════════
   TIDAL TAILS — site behaviour
   Vanilla JS, no dependencies, no build step. Every block is defensive: if the
   markup it needs isn't on the page it simply returns.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CFG = window.TT || {};
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tell the stylesheet JS is alive — reveal animations only apply then, so a
     JS failure can never leave the page blank. */
  document.documentElement.classList.add('js');

  /* ── contact details ────────────────────────────────────────────────────
     The phone number is injected from config. Until it's set, everything
     phone-shaped is removed and email/WhatsApp take over. */
  function initContact() {
    const phone = (CFG.phone || '').trim();
    const tel = phone.replace(/[^0-9+]/g, '');
    const wa = (CFG.whatsapp || '').replace(/[^0-9]/g, '');

    $$('[data-tt="phone"]').forEach(el => { el.textContent = phone; });
    $$('[data-tt="email"]').forEach(el => { el.textContent = CFG.email || ''; });
    $$('a[data-tt="tel-link"]').forEach(el => { el.href = 'tel:' + tel; });
    $$('a[data-tt="email-link"]').forEach(el => { el.href = 'mailto:' + (CFG.email || ''); });
    $$('a[data-tt="wa-link"]').forEach(el => {
      el.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi Tidal Tails, I’d like a quote for my garden.');
    });

    if (!phone) $$('[data-needs-phone]').forEach(el => el.remove());
    if (!wa)    $$('[data-needs-whatsapp]').forEach(el => el.remove());
    if (!phone && !wa) $$('[data-needs-phone-or-wa]').forEach(el => el.remove());

    $$('[data-tt="year"]').forEach(el => { el.textContent = new Date().getFullYear(); });

    if (!phone) {
      console.info('[Tidal Tails] No phone number set yet — add it to js/config.js and every call button reappears automatically.');
    }
  }

  /* ── header ─────────────────────────────────────────────────────────────── */
  function initHeader() {
    const header = $('.site-header');
    const toggle = $('.nav-toggle');
    const links = $('.nav-links');
    if (!header) return;

    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle && links) {
      const setOpen = (open) => {
        toggle.setAttribute('aria-expanded', String(open));
        links.classList.toggle('is-open', open);
      };
      toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
      links.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
      window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
    }

    /* Mark the current page without hand-editing every nav. URLs are
       extensionless in links but the files are still .html, and either form
       can turn up in the address bar — so both sides get normalised. */
    const norm = (u) => {
      const path = (u || '').split('#')[0].split('?')[0]
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/\.html$/, '')
        .replace(/\/index$/, '/')
        .replace(/\/+$/, '');
      return path === '' ? '/' : (path.startsWith('/') ? path : '/' + path);
    };
    const here = norm(location.pathname);
    $$('.nav-links a').forEach(a => {
      if (norm(a.getAttribute('href')) === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ── scroll progress bar ────────────────────────────────────────────────── */
  function initProgress() {
    if (reduceMotion) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = max > 0 ? (window.scrollY / max) * 100 + '%' : '0%';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ── reveal on scroll ───────────────────────────────────────────────────── */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ── count-up stats ─────────────────────────────────────────────────────── */
  function initCountUp() {
    const nums = $$('[data-count-to]');
    if (!nums.length) return;
    const run = (el) => {
      const to = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.countSuffix || '';
      if (reduceMotion) { el.textContent = to + suffix; return; }
      const dur = 1100, start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    nums.forEach(el => io.observe(el));
  }

  /* ── accordions ─────────────────────────────────────────────────────────── */
  function initAccordions() {
    let seq = 0;

    const setOpen = (btn, open) => {
      const panel = btn.nextElementSibling;
      btn.setAttribute('aria-expanded', String(open));
      if (!panel) return;

      if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');

      if (reduceMotion) {
        panel.style.height = open ? 'auto' : '0px';
        return;
      }
      if (open) {
        panel.style.height = panel.scrollHeight + 'px';
        const done = (e) => {
          if (e.propertyName !== 'height') return;
          panel.style.height = 'auto';           // so it reflows if the text wraps differently later
          panel.removeEventListener('transitionend', done);
        };
        panel.addEventListener('transitionend', done);
      } else {
        panel.style.height = panel.scrollHeight + 'px';
        void panel.offsetHeight;                  // force the browser to take the start value
        panel.style.height = '0px';
      }
    };

    $$('.acc-btn').forEach(btn => {
      const panel = btn.nextElementSibling;
      if (panel && !panel.id) {
        panel.id = 'acc-panel-' + (++seq);
        btn.setAttribute('aria-controls', panel.id);
      }
      if (panel && btn.getAttribute('aria-expanded') !== 'true') panel.setAttribute('inert', '');

      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        const group = btn.closest('.accordion');
        if (group && group.dataset.single === 'true' && !open) {
          $$('.acc-btn', group).forEach(b => { if (b !== btn) setOpen(b, false); });
        }
        setOpen(btn, !open);
      });
    });

    /* a panel left open while the window resizes would keep a stale pixel height */
    window.addEventListener('resize', () => {
      $$('.acc-btn[aria-expanded="true"]').forEach(b => {
        if (b.nextElementSibling) b.nextElementSibling.style.height = 'auto';
      });
    });
  }

  /* ── before / after slider ──────────────────────────────────────────────── */
  function initBeforeAfter() {
    $$('.ba').forEach(ba => {
      const range = $('.ba-range', ba);
      if (!range) return;
      const apply = () => ba.style.setProperty('--pos', range.value + '%');
      apply();
      range.addEventListener('input', apply);

      /* dragging anywhere on the image feels more natural than only the handle */
      let dragging = false;
      const setFromPointer = (clientX) => {
        const r = ba.getBoundingClientRect();
        const pct = Math.min(Math.max(((clientX - r.left) / r.width) * 100, 0), 100);
        range.value = String(Math.round(pct));
        apply();
      };
      ba.addEventListener('pointerdown', e => {
        if (e.target === range) return;
        dragging = true; ba.setPointerCapture(e.pointerId); setFromPointer(e.clientX);
      });
      ba.addEventListener('pointermove', e => { if (dragging) setFromPointer(e.clientX); });
      ba.addEventListener('pointerup', e => { dragging = false; ba.releasePointerCapture(e.pointerId); });
      ba.addEventListener('pointercancel', () => { dragging = false; });

      /* a slow nudge on first view so people notice it's draggable */
      if (!reduceMotion && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            let v = 50;
            const seq = [50, 62, 38, 50];
            let step = 0;
            const glide = () => {
              step++;
              if (step >= seq.length) return;
              const from = v, to = seq[step], t0 = performance.now();
              const frame = (now) => {
                const p = Math.min((now - t0) / 520, 1);
                v = from + (to - from) * (1 - Math.pow(1 - p, 3));
                range.value = String(Math.round(v)); apply();
                if (p < 1) requestAnimationFrame(frame); else setTimeout(glide, 90);
              };
              requestAnimationFrame(frame);
            };
            setTimeout(glide, 450);
          });
        }, { threshold: 0.5 });
        io.observe(ba);
      }
    });
  }

  /* ── range slider fill (WebKit needs the % passed in as a variable) ─────── */
  function paintRange(input) {
    const min = parseFloat(input.min || 0), max = parseFloat(input.max || 100);
    const pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
    input.style.setProperty('--fill', pct + '%');
  }
  function initRanges() {
    $$('input[type="range"]').forEach(r => {
      paintRange(r);
      r.addEventListener('input', () => paintRange(r));
    });
  }

  /* ── the quote builder ──────────────────────────────────────────────────── */
  const QUOTE_KEY = 'tt-quote-v1';

  function readQuoteForm(form) {
    const val = (name, fallback) => {
      const el = form.querySelector(`[name="${name}"]:checked`) || form.querySelector(`[name="${name}"]`);
      return el ? el.value : fallback;
    };
    return {
      service: val('service', 'full'),
      caddy: !!form.querySelector('[name="caddy"]:checked'),
      garden: val('garden', 'medium'),
      dogs: parseInt(val('dogs', 1), 10) || 1,
      dogSize: val('dogSize', 'medium'),
      frequency: val('frequency', 'weekly'),
      backlog: val('backlog', 'current'),
      extras: $$('[name="extras"]:checked', form).map(el => el.value)
    };
  }

  /* A quote widget is any [data-quote] element containing a form plus some
     subset of the [data-price-*] outputs — so the full builder on the pricing
     page and the compact one in the hero share exactly one implementation. */
  function initQuote() {
    if (typeof ttQuote !== 'function') return;
    $$('[data-quote]').forEach(buildQuoteWidget);
  }

  function buildQuoteWidget(scope) {
    const form = scope.querySelector('form') || scope;
    const isPrimary = scope.dataset.quote === 'primary';
    /* The primary widget also drives outputs outside its own box — chiefly the
       sticky mobile bar, which is the only place the price is visible on a phone
       while you're working through the options. */
    const root = isPrimary ? document : scope;
    const all = (sel) => $$(sel, root);

    const card = $('[data-price-card]', scope);
    const amountEls = all('[data-price-amount]');
    const unitEls = all('[data-price-unit]');
    const sublineEl = $('[data-price-subline]', root);
    const linesEl = $('[data-price-lines]', root);
    const savingEl = $('[data-price-saving]', root);
    const firstEl = $('[data-price-first]', root);
    const recapEl = $('[data-quote-recap]', root);
    const dogsOut = $('[data-dogs-out]', scope);
    let last = null;

    const render = () => {
      const input = readQuoteForm(form);
      const q = ttQuote(input);

      /* Only ask what the chosen service actually needs — a caddy collection
         has no garden to measure and no backlog to price. */
      $$('[data-mode]', scope).forEach(el => {
        el.hidden = el.dataset.mode !== input.service;
      });

      if (dogsOut) {
        const label = input.dogs === TT_RATES.maxDogs ? input.dogs + '+' : String(input.dogs);
        const firstNode = dogsOut.firstChild;
        if (firstNode && firstNode.nodeType === 3) firstNode.nodeValue = label;
        else dogsOut.insertBefore(document.createTextNode(label), dogsOut.firstChild);
        const unit = dogsOut.querySelector('small');
        if (unit) unit.textContent = input.dogs === 1 ? 'dog' : 'dogs';
      }

      amountEls.forEach(el => { el.textContent = ttMoney(q.headline); });
      unitEls.forEach(el => { el.textContent = q.headlineUnit; });
      if (sublineEl) sublineEl.textContent = q.subline;

      if (linesEl) {
        linesEl.innerHTML = q.lines.map(l =>
          `<li${l.discount ? ' class="is-discount"' : ''}><span>${l.label}</span><span>${l.amount < 0 ? '−' : ''}${ttMoney(Math.abs(l.amount))}</span></li>`
        ).join('') +
        `<li class="is-total"><span>${q.recurring ? (q.service === 'collect' ? 'Each collection' : 'Each visit') : 'Total'}</span><span>${ttMoney(q.perVisit)}</span></li>`;
      }

      if (firstEl) {
        if (q.firstVisitExtra <= 0) {
          firstEl.innerHTML = '';
        } else if (q.service === 'collect') {
          firstEl.innerHTML = `<div class="note note--sand small" style="margin-top:1rem">
               <strong>First payment is ${ttMoney(q.firstPayment)}</strong> — that includes the
               ${ttMoney(q.firstVisitExtra)} caddy, which is yours to keep. Every collection after
               that is ${ttMoney(q.perVisit)}.
             </div>`;
        } else {
          firstEl.innerHTML = `<div class="note note--sand small" style="margin-top:1rem">
               <strong>First visit is ${ttMoney(q.firstPayment)}</strong> — that includes a one-off
               ${ttMoney(q.firstVisitExtra)} catch-up for the backlog. Every visit after that is ${ttMoney(q.perVisit)}.
             </div>`;
        }
      }

      if (recapEl) {
        recapEl.innerHTML = ttQuoteSummary(input, q)
          .map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('');
      }

      /* Only the full builder persists — the compact hero widget must not
         overwrite a detailed quote the visitor already put together. */
      if (scope.dataset.quote === 'primary') {
        try {
          sessionStorage.setItem(QUOTE_KEY, JSON.stringify({ input, quote: q, at: Date.now() }));
        } catch (e) { /* private browsing — the hidden field below still carries it */ }

        const payload = $('#quotePayload');
        if (payload) {
          payload.value = ttQuoteSummary(input, q).map(([k, v]) => `${k}: ${v}`).join('\n');
        }
        /* The raw inputs travel alongside the readable summary so the price can
           be recomputed with ttVerifyQuote() instead of being taken on trust. */
        const raw = $('#quoteRaw');
        if (raw) raw.value = JSON.stringify({ ...q.input, total: q.total, fp: q.fingerprint, v: TT_RATES_VERSION });
      }

      /* a small pulse so changing an option visibly moves the price */
      if (card && last !== null && last !== q.total && !reduceMotion) {
        card.classList.remove('price-flash');
        void card.offsetWidth;
        card.classList.add('price-flash');
      }
      last = q.total;
    };

    form.addEventListener('input', render);
    form.addEventListener('change', render);
    render();

    /* jump to the enquiry form with the quote attached */
    const goto = $('[data-quote-continue]', scope);
    if (goto) {
      goto.addEventListener('click', () => {
        const target = $('#enquiry');
        if (target) {
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          const first = target.querySelector('input:not([type="hidden"])');
          if (first) setTimeout(() => first.focus({ preventScroll: true }), reduceMotion ? 0 : 600);
        }
      });
    }
  }

  /* Pull a stored quote into any form that wants it (e.g. the contact page). */
  function initStoredQuote() {
    const holder = $('#storedQuote');
    const payload = $('#quotePayload');
    if (!holder && !payload) return;
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(QUOTE_KEY) || 'null'); } catch (e) {}
    if (!saved || !saved.quote) return;

    if (payload && !payload.value) {
      payload.value = ttQuoteSummary(saved.input, saved.quote).map(([k, v]) => `${k}: ${v}`).join('\n');
    }
    if (holder) {
      holder.innerHTML =
        `<div class="note small"><strong>Your saved quote:</strong> ${ttMoney(saved.quote.headline)} ${saved.quote.headlineUnit}
         — ${saved.quote.subline}. It'll be attached to your message.
         <a href="pricing.html">Change it</a></div>`;
    }
  }

  /* ── published rate table ───────────────────────────────────────────────
     Built from TT_RATES rather than typed into the HTML, so the price list on
     the page can never disagree with the calculator. */
  function initRateTable() {
    const body = $('[data-rate-table]');
    if (!body || typeof ttQuote !== 'function') return;
    /* data-label lets the CSS restack these as rows on a phone instead of
       forcing a sideways scroll through a four-column table. */
    const cols = [['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['monthly', 'Monthly']];
    body.innerHTML = Object.keys(TT_RATES.garden).map(key => {
      const g = TT_RATES.garden[key];
      const cells = cols.map(([f, label]) => {
        const q = ttQuote({ garden: key, dogs: 1, dogSize: 'medium', frequency: f, backlog: 'current', extras: [] });
        return `<td class="num" data-label="${label}">${ttMoney(q.perVisit)}<span class="muted small"> /visit</span></td>`;
      }).join('');
      return `<tr><th scope="row">${g.label}<span class="muted small" style="display:block;font-weight:400">${g.desc}</span></th>${cells}</tr>`;
    }).join('');

    const extras = $('[data-extras-table]');
    if (extras) {
      extras.innerHTML = Object.keys(TT_RATES.extras).map(k => {
        const x = TT_RATES.extras[k];
        return `<tr><th scope="row">${x.label}<span class="muted small" style="display:block;font-weight:400">${x.desc}</span></th><td class="num" data-label="Per visit">+${ttMoney(x.price)}</td></tr>`;
      }).join('');
    }
  }

  /* ── coverage + the weekly round, both built from config ────────────────── */
  const ROUNDS = CFG.rounds || [];
  const areaDay = {};                       // 'bournville' → 'Monday'
  ROUNDS.forEach(r => r.areas.forEach(a => { areaDay[a.toLowerCase()] = r.day; }));

  function initCoverage() {
    const cov = CFG.coverage || {};
    const host = $('[data-coverage="core"]');
    if (host && cov.core) {
      host.innerHTML = Object.keys(cov.core).map(code =>
        `<tr><th scope="row">${code}</th><td data-label="Covers">${cov.core[code]}</td></tr>`
      ).join('');
    }

    /* the round schedule */
    const sched = $('[data-rounds]');
    if (sched) {
      sched.innerHTML = ROUNDS.map(r =>
        `<tr><th scope="row">${r.day}</th><td data-label="Where we are">${r.areas.join(', ')}</td></tr>`
      ).join('');
    }

    /* every area we serve, flattened */
    const names = $('[data-area-names]');
    if (names) {
      names.innerHTML = ROUNDS.flatMap(r => r.areas).sort()
        .map(n => `<li>${n}</li>`).join('');
    }

    /* neighbourhood pickers get their options from the same list */
    $$('select[data-area-select]').forEach(sel => {
      sel.innerHTML = '<option value="">Choose your area…</option>' +
        ROUNDS.map(r => `<optgroup label="${r.day}">` +
          r.areas.map(a => `<option value="${a}">${a}</option>`).join('') +
          '</optgroup>').join('');
      const note = $('[data-round-note]');
      const update = () => {
        if (!note) return;
        const day = areaDay[(sel.value || '').toLowerCase()];
        note.innerHTML = day
          ? `<div class="note small"><strong>${sel.value} is on our ${day} round.</strong>
             That's the day we'd be with you each visit — one part of town per day keeps
             the driving down, which is how the price stays where it is.</div>`
          : '';
      };
      sel.addEventListener('change', update);
      update();
    });
  }

  /* ── postcode checker ───────────────────────────────────────────────────── */
  function initPostcode() {
    const form = $('#postcodeForm');
    if (!form) return;
    const input = $('#postcodeInput', form);
    const out = $('#postcodeResult');
    const cov = CFG.coverage || { core: {}, extended: {} };

    const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    const tick = icon('<path d="M20 6 9 17l-5-5"/>');
    const info = icon('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>');

    const cross = icon('<path d="M18 6 6 18M6 6l12 12"/>');

    form.addEventListener('submit', e => {
      e.preventDefault();
      /* The outward code can't be read with a greedy digit match — "TA8 1AA"
         would come back as "TA81". Split on the space if there is one, else
         assume the last three characters are the inward code. */
      const raw = (input.value || '').toUpperCase().trim();
      let area;
      if (/\s/.test(raw)) area = raw.split(/\s+/)[0];
      else if (raw.length >= 5) area = raw.slice(0, -3);
      else area = raw;
      if (!/^[A-Z]{1,2}\d[A-Z\d]?$/.test(area)) area = '';

      out.className = 'pc-result is-visible';

      if (!area) {
        out.classList.add('pc-result--maybe');
        out.innerHTML = info + '<div><strong>That doesn’t look like a postcode</strong>Try the first part, like BS23.</div>';
        return;
      }
      if (cov.core[area]) {
        out.classList.add('pc-result--yes');
        out.innerHTML = tick +
          `<div><strong>Yes — we're in ${area} every week</strong>${cov.core[area]}.
           Pick your area in the quote builder and it'll tell you which day we'd be with you.
           <em>Hutton and Bleadon are the two bits of BS24 we don't reach.</em></div>`;
      } else {
        out.classList.add('pc-result--no');
        out.innerHTML = cross +
          `<div><strong>Sorry — ${area} is outside our patch</strong>
           We only work Weston-super-Mare, BS22 to BS24. Going further afield means more time
           driving than scooping, and the price would have to go up to cover it — so we'd
           rather be straight with you than take the booking.</div>`;
      }
    });
  }

  /* ── forms ──────────────────────────────────────────────────────────────── */
  function initForms() {
    $$('form[data-tt-form]').forEach(form => {
      const status = form.querySelector('.form-status');
      const submit = form.querySelector('[type="submit"]');

      const say = (kind, msg) => {
        if (!status) return;
        status.className = 'form-status is-visible form-status--' + kind;
        status.textContent = msg;
      };

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) return; // bot
        if (!form.reportValidity()) return;

        const data = new FormData(form);
        data.delete('_gotcha');

        /* no Formspree ID configured — fall back to a pre-filled email, which
           needs no third-party service and still reaches the inbox */
        if (!CFG.formspree) {
          const lines = [];
          data.forEach((v, k) => { if (String(v).trim()) lines.push(`${k}: ${v}`); });
          const body = encodeURIComponent(lines.join('\n') + '\n\n— sent from ' + CFG.domain);
          const subject = encodeURIComponent(form.dataset.ttForm === 'quote'
            ? 'Quote request from ' + (data.get('name') || 'the website')
            : 'Website enquiry from ' + (data.get('name') || 'the website'));
          say('busy', 'Opening your email app with everything filled in…');
          window.location.href = `mailto:${CFG.email}?subject=${subject}&body=${body}`;
          setTimeout(() => say('ok', 'If your email app didn’t open, email ' + CFG.email + ' and we’ll pick it up.'), 1800);
          return;
        }

        if (submit) { submit.disabled = true; submit.dataset.label = submit.textContent; submit.textContent = 'Sending…'; }
        say('busy', 'Sending…');
        try {
          const res = await fetch('https://formspree.io/f/' + CFG.formspree, {
            method: 'POST', body: data, headers: { Accept: 'application/json' }
          });
          if (!res.ok) throw new Error('bad response');

          /* Payment is only ever offered AFTER the enquiry is safely recorded,
             and only for a quote that passed the required area/phone checks —
             so we never take money for a slot we can't actually service. */
          const payLink = (CFG.paymentLink || '').trim();
          if (payLink && form.dataset.ttForm === 'quote') {
            const ref = (data.get('quote_raw') || '').toString();
            let fp = '';
            try { fp = JSON.parse(ref).fp || ''; } catch (e) {}
            say('ok', 'Booked — taking you to payment…');
            window.location.href = payLink + (payLink.includes('?') ? '&' : '?') +
              'client_reference_id=' + encodeURIComponent(fp);
            return;
          }

          form.reset();
          if (window.location.pathname.indexOf('thanks') === -1) {
            window.location.href = 'thanks.html';
          } else {
            say('ok', 'Thanks — that’s with us. We’ll reply within one working day.');
          }
        } catch (err) {
          say('err', 'Something went wrong sending that. Please email ' + CFG.email + ' instead — sorry about that.');
        } finally {
          if (submit) { submit.disabled = false; submit.textContent = submit.dataset.label || 'Send'; }
        }
      });
    });
  }

  /* ── sticky mobile action bar ───────────────────────────────────────────── */
  function initMobileBar() {
    const bar = $('.mobile-bar');
    if (!bar) return;
    const onScroll = () => bar.classList.toggle('is-visible', window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── boot ───────────────────────────────────────────────────────────────── */
  const boot = () => {
    initContact();
    initHeader();
    initProgress();
    initReveal();
    initCountUp();
    initAccordions();
    initBeforeAfter();
    initRanges();
    initQuote();
    initStoredQuote();
    initRateTable();
    initCoverage();
    initPostcode();
    initForms();
    initMobileBar();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
