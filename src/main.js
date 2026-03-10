/* ═══════════════════════════════════════════════════════════════════════════
   Nakib Cloud — Phase 1 loader + reveal (vanilla JS)
   Hides the loader, then reveals the landing page with staggered fade-ins.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var loader  = document.getElementById('loader');
  var landing = document.getElementById('landing');

  if (!loader || !landing) return;

  function reveal() {
    /* 1. Fade out loader */
    loader.classList.add('is-hidden');

    /* 2. Show the landing wrapper */
    landing.setAttribute('aria-hidden', 'false');
    landing.classList.add('is-visible');

    /* 3. Stagger each .fade-target into view */
    var targets = landing.querySelectorAll('.fade-target');
    targets.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add('is-visible');
      }, 120 * i);
    });
  }

  /* Wait for full load (fonts, images) then reveal */
  if (document.readyState === 'complete') {
    reveal();
  } else {
    window.addEventListener('load', function onLoad() {
      setTimeout(reveal, 250);            /* slight pause for smoothness */
      window.removeEventListener('load', onLoad);
    });
  }
})();
