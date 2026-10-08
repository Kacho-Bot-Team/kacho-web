(() => {
  'use strict';
  const flow = document.querySelector('#cotizacion-y-seguimiento');
  if (!flow) return;
  const $ = selector => flow.querySelector(selector);
  const buttons = [...flow.querySelectorAll('[data-quote-step]')];
  const control = $('#quote-play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [
    { speaker: 'Tu cliente', dialogue: 'Necesito piso para mi cafetería. Son 80 m².', caption: 'Reúne la necesidad y prepara los datos para cotizar.' },
    { speaker: 'Kacho', dialogue: 'Tu cotización, en un documento para compartir.', caption: 'Genera el documento con el catálogo y las reglas de tu negocio.' },
    { speaker: 'Kacho', dialogue: 'La cotización y el contexto van juntos al CRM.', caption: 'Registra la oportunidad y adjunta su cotización.' },
    { speaker: 'Kacho', dialogue: '¿Pudiste revisar la cotización?', caption: 'La oportunidad tiene responsable y un siguiente contacto.' }
  ];
  let current = 0;
  let visible = false;
  let paused = false;
  let finished = false;
  let timer = null;
  const manualMode = () => reduced.matches || document.body.dataset.motion === 'off';

  function updatePlayback() {
    clearTimeout(timer);
    timer = null;
    const manual = manualMode();
    const playing = visible && !document.hidden && !manual && !paused && !finished;
    flow.dataset.playing = String(playing);
    const label = manual ? (current === 3 ? 'Repetir' : 'Siguiente') : finished ? 'Repetir' : paused ? 'Continuar' : 'Pausar';
    control.querySelector('span').textContent = label;
    control.querySelector('use').setAttribute('href', manual ? '#arrow' : !paused && !finished ? '#pause' : '#play');
    control.setAttribute('aria-label', manual ? (current === 3 ? 'Repetir recorrido' : 'Ver siguiente paso') : `${label} animación`);
    if (playing) {
      timer = setTimeout(() => {
        if (current < 3) renderStep(current + 1);
        else { finished = true; updatePlayback(); }
      }, 5000);
    }
  }

  function renderStep(index, announce = false) {
    current = index;
    flow.dataset.step = String(index);
    $('#quote-speaker').textContent = steps[index].speaker;
    $('#quote-dialogue').textContent = steps[index].dialogue;
    const caption = $('#quote-caption');
    caption.setAttribute('aria-live', announce ? 'polite' : 'off');
    caption.textContent = steps[index].caption;
    $('#quote-document-state').textContent = index === 0 ? 'Datos para cotizar' : 'Documento generado';
    $('#quote-crm-state').textContent = index === 3 ? 'En seguimiento' : 'Oportunidad registrada';
    $('#quote-document').setAttribute('aria-hidden', String(index > 1));
    $('#quote-crm').setAttribute('aria-hidden', String(index < 2));
    $('#quote-followup').setAttribute('aria-hidden', String(index < 3));
    buttons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === index));
      button.toggleAttribute('data-done', i < index);
    });
    updatePlayback();
  }

  buttons.forEach((button, index) => button.addEventListener('click', () => {
    paused = true;
    finished = index === steps.length - 1;
    renderStep(index, true);
  }));
  control.addEventListener('click', () => {
    if (manualMode()) { renderStep((current + 1) % 4, true); return; }
    if (finished) {
      finished = false;
      paused = false;
      renderStep(0, true);
      return;
    }
    paused = !paused;
    updatePlayback();
  });

  $('#quote-steps').hidden = false;
  control.hidden = false;
  renderStep(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const isVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .2;
      if (isVisible !== visible) { visible = isVisible; updatePlayback(); }
    }, { threshold: [0, .2] }).observe($('#quote-stage'));
  } else { visible = true; updatePlayback(); }
  document.addEventListener('visibilitychange', updatePlayback);
  reduced.addEventListener('change', updatePlayback);
  new MutationObserver(updatePlayback).observe(document.body, { attributes: true, attributeFilter: ['data-motion'] });
})();
