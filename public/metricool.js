/* Medición de visitas: únicamente en el dominio público, nunca en previews. */
(() => {
  'use strict';
  if (!['kachobot.com', 'www.kachobot.com'].includes(window.location.hostname)) return;
  if (document.getElementById('metricool-tracker')) return;

  const script = document.createElement('script');
  script.id = 'metricool-tracker';
  script.async = true;
  script.src = 'https://tracker.metricool.com/resources/be.js';
  script.addEventListener('load', () => {
    // La analítica no debe interrumpir la página si el proveedor no responde.
    try {
      if (typeof window.beTracker?.t === 'function') {
        window.beTracker.t({ hash: '8c025a09044f5aeff8ed495462aa8703' });
      }
    } catch { /* El sitio continúa funcionando sin analítica. */ }
  }, { once: true });
  document.head.appendChild(script);
})();
