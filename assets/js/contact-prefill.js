/* ==========================================================================
   EuroHellenic — assets/js/contact-prefill.js   (contact.html only)
   Fills the enquiry form from query params, e.g. the "Send this to an
   advisor" link at the end of an Athena conversation:
     contact.html?from=athena&name=…&level=Undergraduate&english=IELTS%205.5…
   Text fields are only filled when empty; selects only change when the value
   matches one of their existing options exactly. Nothing is submitted.
   ========================================================================== */
(function () {
  'use strict';

  function run() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (!params || !Array.from(params.keys()).length) return;

    var form = document.querySelector('.section form[data-enquiry]') || document.querySelector('form[data-enquiry]');
    if (!form) return;

    var filled = 0;
    ['name', 'email', 'country', 'phone', 'field', 'message'].forEach(function (n) {
      var el = form.elements[n];
      var v = params.get(n);
      if (el && v && !el.value) { el.value = v.slice(0, n === 'message' ? 2000 : 120); filled++; }
    });

    ['level', 'intake', 'english', 'budget'].forEach(function (n) {
      var el = form.elements[n];
      var v = params.get(n);
      if (!el || !v || el.tagName !== 'SELECT') return;
      var norm = function (s) { return String(s).replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase(); };
      for (var i = 0; i < el.options.length; i++) {
        if (norm(el.options[i].text) === norm(v)) { el.selectedIndex = i; filled++; break; }
      }
    });

    if (!filled) return;

    // A short, dismissible-by-editing note so the student knows why fields are filled
    var note = document.createElement('p');
    note.className = 'form__prefill';
    note.setAttribute('role', 'status');
    note.textContent = params.get('from') === 'athena'
      ? 'Athena has filled in what you told her. Check the details, add your email and your grades, then send.'
      : 'Some details have been filled in for you. Check them before you send.';
    var status = form.querySelector('.form__status');
    form.insertBefore(note, status ? status.nextSibling : form.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
