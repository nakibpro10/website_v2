/* ==========================================================================
   Phase 1 — Loader controller (vanilla JS)
   Fades out the full-screen loader once the page content is ready.
   ========================================================================== */

(function initLoader() {
  'use strict';

  var loader = document.getElementById('loader');
  if (!loader) return;

  function hideLoader() {
    loader.classList.add('hidden');
  }

  // Hide once the window has fully loaded (images, fonts, etc.)
  if (document.readyState === 'complete') {
    // Already loaded (e.g. cached)
    hideLoader();
  } else {
    window.addEventListener('load', function onLoad() {
      // Small delay to let paint finish and ensure smooth transition
      setTimeout(hideLoader, 300);
      window.removeEventListener('load', onLoad);
    });
  }
})();
