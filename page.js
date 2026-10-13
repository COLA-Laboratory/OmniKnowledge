/* Mounts each section registered with OK.section into the element that names it
   (data-section). A section owns everything inside its element. */
(function () {
  'use strict';
  var OK = window.OK;
  OK.fontsReady().then(function () {
    document.querySelectorAll('[data-section]').forEach(function (sec) {
      var versions = OK.sections[sec.dataset.section] || [];
      if (versions.length) versions[0].mount(sec, { still: OK.still });
      else sec.hidden = true;
    });
  });
})();
