/* ==========================================================================
   EuroHellenic — assets/js/main.js
   Vanilla JS. No dependencies. No build step.
   Everything degrades gracefully: if JS fails, the site is still readable.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- 1. NAV */
  function initNav() {
    var header = $('.header');
    var burger = $('.burger');
    var drawer = $('.drawer');

    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-stuck', window.scrollY > 24);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', String(!open));
        drawer.classList.toggle('is-open', !open);
        document.body.style.overflow = !open ? 'hidden' : '';
        // stagger the links in
        $$('a', drawer).forEach(function (a, i) {
          a.style.animationDelay = (60 + i * 45) + 'ms';
        });
      });
      $$('a', drawer).forEach(function (a) {
        a.addEventListener('click', function () {
          burger.setAttribute('aria-expanded', 'false');
          drawer.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) burger.click();
      });
    }

    // Mark the current page in the nav
    var here = location.pathname.split('/').pop() || 'index.html';
    $$('.nav__links a, .drawer a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ----------------------------------------------------- 2. READING PROGRESS */
  function initProgress() {
    var bar = $('.progress');
    if (!bar) return;
    var update = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ------------------------------------------------------- 3. SCROLL REVEAL */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) {
      // Auto-stagger siblings that share a parent, unless a delay is set by hand
      if (!el.style.getPropertyValue('--d')) {
        var sibs = el.parentElement ? $$('[data-reveal]', el.parentElement) : [];
        var i = sibs.indexOf(el);
        if (i > 0 && i < 8) el.style.setProperty('--d', (i * 90) + 'ms');
      }
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------ 4. COUNTERS */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec    = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var pre    = el.getAttribute('data-prefix') || '';
      var suf    = el.getAttribute('data-suffix') || '';
      var dur    = 1500;

      if (reduced) { el.textContent = pre + target.toFixed(dec) + suf; return; }

      var t0 = null;
      var tick = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
        var v = target * eased;
        el.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-GB')) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------- 5. ACCORDION */
  function initAccordion() {
    $$('.acc').forEach(function (acc) {
      var single = acc.hasAttribute('data-single');
      $$('.acc__btn', acc).forEach(function (btn) {
        var panel = btn.nextElementSibling;
        if (!panel) return;

        btn.addEventListener('click', function () {
          var open = btn.getAttribute('aria-expanded') === 'true';

          if (single && !open) {
            $$('.acc__btn[aria-expanded="true"]', acc).forEach(function (other) {
              other.setAttribute('aria-expanded', 'false');
              other.nextElementSibling.style.height = '0px';
            });
          }

          btn.setAttribute('aria-expanded', String(!open));
          panel.style.height = open ? '0px' : panel.scrollHeight + 'px';
        });

        // Keep an open panel correctly sized on resize
        window.addEventListener('resize', function () {
          if (btn.getAttribute('aria-expanded') === 'true') {
            panel.style.height = panel.scrollHeight + 'px';
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------- 6. FILTERS */
  function initFilters() {
    $$('[data-filter-group]').forEach(function (group) {
      var targetSel = group.getAttribute('data-filter-group');
      var items = $$(targetSel + ' [data-cat]');
      var countEl = $(group.getAttribute('data-count-target') || '__none__');

      $$('.filter', group).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var cat = btn.getAttribute('data-target');
          $$('.filter', group).forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');

          var shown = 0;
          items.forEach(function (item) {
            var match = cat === 'all' || (item.getAttribute('data-cat') || '').split(' ').indexOf(cat) > -1;
            item.classList.toggle('is-hidden', !match);
            if (match) {
              shown++;
              // re-trigger the entrance animation for a lively filter
              item.classList.remove('is-in');
              // eslint-disable-next-line no-unused-expressions
              item.offsetWidth;
              item.classList.add('is-in');
            }
          });
          if (countEl) countEl.textContent = shown;
        });
      });
    });
  }

  /* ------------------------------------------------------------ 7. TIMELINE */
  function initTimeline() {
    $$('.timeline').forEach(function (tl) {
      var fill = document.createElement('div');
      fill.className = 'timeline__fill';
      tl.appendChild(fill);

      if (reduced || !('IntersectionObserver' in window)) { fill.style.height = '100%'; return; }

      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            fill.style.height = 'calc(100% - 28px)';
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.2 });
      io.observe(tl);
    });
  }

  /* --------------------------------------------------- 8. HERO PARALLAX (subtle) */
  function initParallax() {
    if (reduced) return;
    var els = $$('[data-parallax]');
    if (!els.length) return;
    var ticking = false;

    var apply = function () {
      var y = window.scrollY;
      els.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.08;
        el.style.transform = 'translate3d(0,' + (y * speed) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(apply); ticking = true; }
    }, { passive: true });
  }

  /* ---------------------------------------------------------- 9. CALCULATOR */
  /* Figures are indicative and sourced from published 2026 data — see README. */
  function initCalculator() {
    var calc = $('#calc');
    if (!calc) return;

    var state = { tuition: 6750, city: 'athens', housing: 'shared', lifestyle: 1 };

    // Indicative monthly living costs, in EUR
    var COST = {
      athens:      { shared: 520, studio: 720 },
      thessaloniki:{ shared: 400, studio: 560 },
      crete:       { shared: 370, studio: 520 }
    };
    var BASE = { food: 230, transport: 25, utilities: 85, phone: 27, personal: 95 };

    var fmt = function (n) { return '€' + Math.round(n).toLocaleString('en-GB'); };

    function render() {
      var rent   = COST[state.city][state.housing];
      var living = (BASE.food + BASE.transport + BASE.utilities + BASE.phone + BASE.personal) * state.lifestyle;
      var monthly = rent + living;
      var yearLiving = monthly * 12;
      var total = yearLiving + state.tuition;

      $('#o-rent').textContent    = fmt(rent) + ' /mo';
      $('#o-living').textContent  = fmt(living) + ' /mo';
      $('#o-monthly').textContent = fmt(monthly);
      $('#o-tuition').textContent = fmt(state.tuition) + ' /yr';
      $('#o-total').textContent   = fmt(total);
      $('#o-visa').textContent    = fmt(monthly * 12 * 0.55); // indicative funds-proof guide
    }

    // Segmented controls
    $$('[data-calc-seg]', calc).forEach(function (seg) {
      var key = seg.getAttribute('data-calc-seg');
      $$('button', seg).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('button', seg).forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
          var v = b.getAttribute('data-val');
          state[key] = isNaN(parseFloat(v)) ? v : parseFloat(v);
          render();
        });
      });
    });

    // Lifestyle slider
    var slider = $('#calc-lifestyle', calc);
    if (slider) {
      slider.addEventListener('input', function () {
        state.lifestyle = parseFloat(slider.value) / 100;
        var label = slider.value < 90 ? 'Frugal' : slider.value > 115 ? 'Comfortable' : 'Typical';
        $('#calc-lifestyle-val').textContent = label;
        render();
      });
    }

    render();
  }

  /* -------------------------------------------------------------- 10. FORMS */
  /*  Uses Web3Forms — free, no backend, no server needed.
   *  SETUP: get a free key at https://web3forms.com and paste it into
   *  the hidden `access_key` input in contact.html / index.html.
   *  Until a key is set, the form shows a clear configuration message
   *  instead of silently swallowing a real enquiry.                        */
  function initForms() {
    $$('form[data-enquiry]').forEach(function (form) {
      var status = $('.form__status', form);
      var submit = $('button[type=submit]', form);

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot — silently drop bots
        var hp = $('input[name=botcheck]', form);
        if (hp && hp.value) return;

        var key = $('input[name=access_key]', form);
        if (!key || !key.value || key.value.indexOf('YOUR-') === 0) {
          show('err', 'This form is not connected yet. Add a free Web3Forms access key (see README) — or email us directly at hello@eurohellenic.com.');
          return;
        }

        var original = submit ? submit.innerHTML : '';
        if (submit) { submit.disabled = true; submit.innerHTML = 'Sending…'; }

        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.success) {
              show('ok', 'Thank you — your enquiry has reached us. An advisor will reply within two working days.');
              form.reset();
            } else {
              show('err', 'Something went wrong. Please email hello@eurohellenic.com directly.');
            }
          })
          .catch(function () {
            show('err', 'Network error. Please email hello@eurohellenic.com directly.');
          })
          .finally(function () {
            if (submit) { submit.disabled = false; submit.innerHTML = original; }
          });
      });

      function show(kind, msg) {
        if (!status) { window.alert(msg); return; }
        status.className = 'form__status is-' + kind;
        status.textContent = msg;
        status.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }

  /* -------------------------------------------------------------- 11. YEAR */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ----------------------------------------------------------------- BOOT */
  function boot() {
    initNav();
    initProgress();
    initReveal();
    initCounters();
    initAccordion();
    initFilters();
    initTimeline();
    initParallax();
    initCalculator();
    initForms();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
