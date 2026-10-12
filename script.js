/* ═══════════════════════════════════════════════════
   3rd Cell — interaction layer
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── Sticky header ───────── */
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ───────── Search bar ───────── */
  const searchToggle = $('#searchToggle');
  const searchClose  = $('#searchClose');
  const searchInput  = $('#searchBar input');
  searchToggle.addEventListener('click', () => {
    const open = header.classList.toggle('search-open');
    if (open) setTimeout(() => searchInput.focus(), 240);
  });
  searchClose.addEventListener('click', () => header.classList.remove('search-open'));
  $('#searchBar').addEventListener('submit', e => e.preventDefault());

  /* ───────── Mobile navigation ───────── */
  const nav = $('#primaryNav');
  const burger = $('#navToggle');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-link').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* ───────── Hero carousel ───────── */
  const hero     = $('#hero');
  const slides   = $$('.hero-slide', hero);
  const dotsWrap = $('#heroDots');
  const titleEl  = $('.hero-title', hero);
  const eyebrowEl= $('.hero-eyebrow', hero);
  const subEl    = $('.hero-sub', hero);
  const ctaEl    = $('.hero-copy .btn', hero);
  const scriptEl = $('.hero-script', hero);

  const COPY = [
    {
      theme: 'light',
      eyebrow: 'Regenerate<br>Activate<br>Live Brighter',
      lines: ['3rd Cell', 'Super Power', 'for a Healthier', 'Tomorrow'],
      sub: 'Engineering the Future of Cell Manufacturing',
      cta: 'Explore Our Solutions',
      script: 'Healthy Cells<br><span>Brighter Lives</span>'
    },
    {
      theme: 'light',
      eyebrow: 'Precision<br>Automation<br>Consistency',
      lines: ['Intelligent Cell', 'Manufacturing', 'Programmable', '&amp; Scalable'],
      sub: 'AI-Native CDMO for Cell &amp; Gene Therapy',
      cta: 'Our Technology',
      script: 'Automated<br><span>Cell Production</span>'
    },
    {
      theme: 'dark',
      eyebrow: 'Robotics<br>Intelligence<br>Scale',
      lines: ['One Platform', 'Every Cell Type', 'From iPSC', 'to CAR-T'],
      sub: 'iPSC &middot; MSC &middot; CAR-T &middot; CAR-NK &middot; HSC',
      cta: 'Explore the Platform',
      script: 'Living Products<br><span>Industrial Precision</span>'
    }
  ];

  let current = 0;
  let timer = null;

  // build dots
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Slide ' + (i + 1));
    b.addEventListener('click', () => go(i, true));
    dotsWrap.appendChild(b);
  });
  const dots = $$('button', dotsWrap);

  function render(i) {
    const c = COPY[i] || COPY[0];
    hero.dataset.theme = c.theme;
    eyebrowEl.innerHTML = c.eyebrow
      .split('<br>')
      .map(t => `<span>${t}</span>`)
      .join('');
    titleEl.innerHTML = c.lines
      .map((t, n) => `<span class="${n < 2 ? 't-dark' : 't-blue'}">${t}</span>`)
      .join('');
    subEl.innerHTML = c.sub;
    ctaEl.childNodes[0].nodeValue = c.cta + ' ';
    scriptEl.innerHTML = c.script;
  }

  function go(i, userInitiated) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('is-active', n === current));
    dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === current)));
    render(current);
    if (userInitiated) restart();
  }

  function restart() {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = setInterval(() => go(current + 1), 7000);
  }

  $('#heroPrev').addEventListener('click', () => go(current - 1, true));
  $('#heroNext').addEventListener('click', () => go(current + 1, true));
  hero.addEventListener('mouseenter', () => clearInterval(timer));
  hero.addEventListener('mouseleave', restart);
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  go(current - 1, true);
    if (e.key === 'ArrowRight') go(current + 1, true);
  });

  // swipe
  let touchX = null;
  hero.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) go(current + (dx < 0 ? 1 : -1), true);
    touchX = null;
  });

  render(0);
  go(0);
  restart();

  /* ───────── 24-well plate cycle (live SVG) ───────── */
  const canObserve = 'IntersectionObserver' in window;

  function animatePlate(plate) {
    if (!plate || plate.dataset.plateReady === '1') return;
    const fills = Array.from(plate.querySelectorAll('.plate__fill'));
    if (!fills.length) return;
    plate.dataset.plateReady = '1';

    const cols = parseInt(plate.getAttribute('data-cols'), 10) || 6;
    const tip = plate.querySelector('.plate__tip');

    if (reduceMotion) return;              // leave the completed plate in place

    const FILL_MS = 108, HOLD_MS = 1500, DRAIN_MS = 38, REST_MS = 820;

    // serpentine order, the way a pipette actually works across a plate
    const order = fills.slice().sort((a, b) => {
      const ai = fills.indexOf(a), bi = fills.indexOf(b);
      const ar = Math.floor(ai / cols), br = Math.floor(bi / cols);
      if (ar !== br) return ar - br;
      return ar % 2 === 0 ? (ai % cols) - (bi % cols) : (bi % cols) - (ai % cols);
    });

    order.forEach(el => el.classList.add('is-empty'));

    let phase = 'fill', idx = 0, timer = null, running = false;
    let onScreen = !canObserve;

    function moveTip(el) {
      if (!tip) return;
      tip.classList.add('is-visible');
      tip.setAttribute('transform',
        'translate(' + el.getAttribute('cx') + ' ' + el.getAttribute('cy') + ')');
    }
    const at = ms => { timer = window.setTimeout(tick, ms); };

    function tick() {
      timer = null;
      if (phase === 'fill') {
        order[idx].classList.remove('is-empty');
        moveTip(order[idx]);
        idx += 1;
        if (idx < order.length) at(FILL_MS);
        else {
          if (tip) tip.classList.remove('is-visible');
          phase = 'drain'; idx = 0; at(HOLD_MS);
        }
      } else {
        order[idx].classList.add('is-empty');
        idx += 1;
        if (idx < order.length) at(DRAIN_MS);
        else { phase = 'fill'; idx = 0; at(REST_MS); }
      }
    }
    function start() { if (running) return; running = true; at(260); }
    function stop()  { running = false; if (timer) { clearTimeout(timer); timer = null; } }
    function sync()  { (onScreen && !document.hidden) ? start() : stop(); }

    if (canObserve) {
      new IntersectionObserver(entries => {
        entries.forEach(e => { onScreen = e.isIntersecting; });
        sync();
      }, { threshold: 0.2 }).observe(plate);
    }
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  $$('[data-plate]').forEach(animatePlate);

  /* ───────── Scroll reveal ─────────
     Deliberately NOT IntersectionObserver-only: an observer fires for elements
     that are entering the viewport, so a visitor who jumps straight to the
     bottom (End key, scrollbar drag, deep link) skips past every section and
     leaves them stuck at opacity 0. This pass reveals anything whose top edge
     has reached the viewport — including anything already scrolled past. */
  const revealables = $$('.reveal');

  if (reduceMotion || !revealables.length) {
    revealables.forEach(el => el.classList.add('is-in'));
  } else {
    let ticking = false;

    const revealPass = () => {
      ticking = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      revealables.forEach(el => {
        if (el.classList.contains('is-in')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.88) {                 // entering, or already above
          const sibs = el.parentElement ? el.parentElement.children : [];
          const delay = (Array.from(sibs).indexOf(el) % 5) * 90;
          window.setTimeout(() => el.classList.add('is-in'), delay);
        }
      });
    };

    const requestPass = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(revealPass);
    };

    window.addEventListener('scroll', requestPass, { passive: true });
    window.addEventListener('resize', requestPass);
    window.addEventListener('load', requestPass);
    requestPass();
  }

  /* ───────── Scroll spy for the nav ───────── */
  const links = $$('.nav-link');
  const targets = links
    .map(l => ({ link: l, el: $(l.getAttribute('href')) }))
    .filter(t => t.el);

  if ('IntersectionObserver' in window && targets.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(l => l.classList.remove('is-active'));
        const hit = targets.find(t => t.el === en.target);
        if (hit) hit.link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(t => spy.observe(t.el));
  }

  /* ───────── Subscribe form ───────── */
  const form = $('#subForm');
  const note = $('#subNote');
  const email = $('#subEmail');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = email.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (!ok) {
      note.textContent = 'Please enter a valid email address.';
      note.style.color = '#FFC9C9';
      email.focus();
      return;
    }
    note.textContent = 'Thank you — you are on the list.';
    note.style.color = '#8EE0DC';
    form.reset();
  });

  /* ───────── Video modal ───────── */
  const modal = $('#videoModal');
  const cycleVideo = $('#cycleVideo');

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (cycleVideo) {
      try { cycleVideo.currentTime = 0; } catch (e) { /* metadata not ready yet */ }
      cycleVideo.muted = false;
      const p = cycleVideo.play();
      // If the browser blocks sound-on autoplay, fall back to a silent start
      // rather than leaving the visitor staring at a paused poster frame.
      if (p && typeof p.catch === 'function') {
        p.catch(() => { cycleVideo.muted = true; cycleVideo.play().catch(() => {}); });
      }
    }
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (cycleVideo) { cycleVideo.pause(); cycleVideo.muted = false; }
  };
  $('#watchVideo').addEventListener('click', openModal);
  $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();
