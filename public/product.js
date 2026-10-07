'use strict';

window.KachoProduct = (() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const safe = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const arrow = '<svg class="icon" aria-hidden="true"><use href="#arrow"/></svg>';
  const number = new Intl.NumberFormat('es-MX');
  const FEATURES = {
    conversacion: ['Conversación por WhatsApp', 'Cada consulta avanza con una pregunta útil y un siguiente paso.'],
    imagenes: ['Una imagen también cuenta la historia', 'Una foto aporta contexto y ayuda a hacer mejores preguntas antes de cotizar.'],
    voz: ['De una nota de voz a una necesidad clara', 'Tu cliente puede explicar lo que busca sin tener que escribirlo todo.'],
    carrusel: ['Opciones que se pueden ver y elegir', 'El catálogo entra en la conversación y la elección vuelve con su contexto.'],
    llamadas: ['La misma atención, también por voz', 'Una llamada puede terminar con una necesidad documentada para el siguiente paso.'],
    programados: ['El mensaje en el momento acordado', 'Recordatorios y mensajes preparados respetan la fecha que acuerdas con el cliente.'],
    seguimiento: ['La conversación tiene continuidad', 'Se retoma lo pendiente sin insistir cuando el cliente ya respondió o entró un asesor.'],
    tablero: ['De las conversaciones a las decisiones', 'Atención, cotizaciones y cierres se observan juntos para encontrar dónde mejorar.']
  };
  const OPTIONS = {
    materiales: ['Acabado piedra','Acabado madera','Acabado cemento'],
    construccion: ['Ampliación','Remodelación','Obra nueva'],
    ecommerce: ['Mochila compacta','Mochila de oficina','Mochila de viaje'],
    muebles: ['Sofá compacto','Sofá modular','Sofá con chaise'],
    inmobiliaria: ['Departamento','Casa','Local comercial'],
    automotriz: ['Sedán','SUV','Pickup'],
    solar: ['Casa','Local comercial','Nave industrial'],
    industrial: ['Equipo compacto','Equipo de taller','Equipo industrial'],
    educacion: ['Conversación','Inglés laboral','Preparación de examen'],
    eventos: ['Conferencia','Celebración','Encuentro de equipo']
  };
  let sector, detail, feature = 'conversacion', scene = 'orientar', messageCount = 1;
  let card = 0, callStep = 0, dashboard = 'atencion', followup = 'pendiente';
  let logoURL = null, logoName = '', uploadVersion = 0, appliedBrand = null;

  function messages() {
    if (scene === 'precio') return [
      ['buyer','¿Me puedes decir cuánto cuesta?'], ['agent',detail.price],
      ['buyer','Perfecto. ¿Qué necesitan para preparar mi propuesta?'],
      ['agent',`Podemos empezar por ${sector.asks.toLowerCase().split(' · ').join(', ')}. Con esa información confirmamos el alcance y las condiciones.`]
    ];
    if (scene === 'asesor') return [
      ['buyer','Prefiero revisar esto con una persona.'],
      ['agent','Claro. Confirmemos el contexto para que no tengas que empezar de nuevo.'],
      ['buyer',sector.answer],
      ['agent',`Tu solicitud queda enfocada en ${detail.brief}. El siguiente paso con el equipo sería: ${sector.next.toLowerCase()}.`]
    ];
    return [['buyer',sector.buyer],['agent',sector.bot],['buyer',sector.answer],['agent',sector.reply]];
  }

  function renderConversation() {
    if (!sector) return;
    $$('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === scene)));
    const container = $('#messages');
    // Append only on advance, so previous messages remain in the accessible log.
    if (messageCount === 1) container.replaceChildren();
    const existing = container.querySelectorAll('.message').length;
    messages().slice(existing, messageCount).forEach(([role, text]) => {
      const bubble = document.createElement('div');
      bubble.className = `message ${role} continued`;
      bubble.innerHTML = `<span>${role === 'buyer' ? 'Cliente' : safe('Kacho ' + detail.name)}</span><p>${safe(text)}</p>`;
      container.append(bubble);
    });
    if (messageCount === 4 && !container.querySelector('.conversation-next')) {
      const next = document.createElement('div');
      next.className = 'conversation-next';
      next.innerHTML = `<span>Siguiente paso del ejemplo</span><strong>${safe(sector.next)}</strong>${arrow}`;
      container.append(next);
    }
    $('#advance-scene').innerHTML = `${messageCount === 4 ? 'Reiniciar ejemplo' : messageCount % 2 ? 'Ver respuesta' : 'Ver mensaje del cliente'}${arrow}`;
    $('#scene-state').textContent = `${messageCount} de 4`;
    container.scrollTop = messageCount === 1 ? 0 : container.scrollHeight;
  }

  function selectScene(next) {
    if (!['orientar','precio','asesor'].includes(next)) return;
    scene = next; messageCount = 1;
    selectFeature('conversacion');
  }

  function updatePhone() {
    const phone = window.KACHO_CONFIG?.demoNumbers?.[sector.id];
    const valid = typeof phone === 'string' && /^[1-9]\d{7,14}$/.test(phone);
    const link = $('#demo-whatsapp');
    link.hidden = !valid;
    $('#demo-whatsapp-pending').hidden = valid;
    link.removeAttribute('href');
    if (valid) link.href = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quiero probar la demo de Kacho ${detail.name}.`)}`;
    $('#demo-whatsapp-status').textContent = valid
      ? `Abre el WhatsApp de Kacho ${detail.name}. Tú decides cuándo enviar el mensaje.`
      : `El número de Kacho ${detail.name} estará disponible próximamente. Mientras tanto, recorre la demo aquí.`;
  }

  function selectSector(next, nextDetail) {
    sector = next; detail = nextDetail; scene = 'orientar'; messageCount = 1;
    $('#brand-character').src = `assets/${sector.id}.webp`;
    $('#brand-character').alt = `Kacho ${detail.name} con una muestra de tu marca`;
    updatePhone(); updateBrand(); selectFeature('conversacion');
  }

  function selectFeature(next) {
    if (!FEATURES[next] || !sector) return;
    feature = next; card = 0; callStep = 0; dashboard = 'atencion'; followup = 'pendiente';
    $$('[data-feature]').filter(button => button.tagName === 'BUTTON').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.feature === feature)));
    $('#demo-caption').textContent = FEATURES[feature][0];
    $('#feature-benefit').textContent = FEATURES[feature][1];
    $('#conversation-view').hidden = feature !== 'conversacion';
    $('#feature-panel').hidden = feature === 'conversacion';
    $('#feature-panel').dataset.feature = feature;
    if (feature === 'conversacion') renderConversation();
    else renderFeature();
  }

  const note = text => `<p class="feature-note">${text}</p>`;
  const bubble = text => `<div class="message agent"><span>Kacho ${safe(detail.name)}</span><p>${safe(text)}</p></div>`;
  function renderFeature() {
    const panel = $('#feature-panel');
    if (feature === 'imagenes') panel.innerHTML = `
      <div class="feature-heading"><span>01 / EL CLIENTE ENVÍA UNA REFERENCIA</span><h3>Una foto abre la conversación.</h3></div>
      <div class="sample-photo"><svg viewBox="0 0 560 245" role="img" aria-label="Ilustración de un espacio como imagen de referencia"><rect width="560" height="245" fill="#ded5c7"/><path d="M0 180 190 105H560V245H0" fill="#b1b7a1"/><path d="M0 0h190v105L0 180Z" fill="#eadfce"/><path d="M190 105 400 245M290 105 525 245M390 105 560 205M70 152H560M0 201h560" stroke="#ece8de" stroke-width="2"/><rect x="225" y="27" width="103" height="63" rx="2" fill="#5d716c"/><path d="M276 27V90" stroke="#ded5c7" stroke-width="5"/><rect x="382" y="39" width="73" height="100" fill="#927b60"/><path d="M470 190v-52" stroke="#727a59" stroke-width="5"/><ellipse cx="455" cy="147" rx="24" ry="12" fill="#839671"/><ellipse cx="486" cy="133" rx="23" ry="12" fill="#6d805a"/><path d="M445 188h48l-7 35h-34Z" fill="#b87b53"/></svg><span>Imagen ilustrativa · sin datos de clientes</span></div>
      <p class="customer-caption">«Te comparto una referencia de lo que tengo en mente.»</p>
      <button class="demo-action" data-action="image-answer" aria-expanded="false" aria-controls="image-answer">Ver respuesta de ejemplo ${arrow}</button><div id="image-answer" hidden>${bubble(`Gracias, la imagen nos da contexto. Para orientarte necesitamos confirmar: ${sector.asks.toLowerCase()}. ¿Me cuentas un poco más?`)}${note('Las dimensiones, compatibilidad y condiciones se confirman con el cliente; no se deducen como hechos de una foto.')}</div>`;
    if (feature === 'voz') panel.innerHTML = `
      <div class="feature-heading"><span>02 / TU CLIENTE LO DICE A SU MANERA</span><h3>También entiende notas de voz.</h3></div>
      <div class="voice-note"><span class="voice-mark" aria-hidden="true">≋</span><div class="waveform" aria-hidden="true">${Array.from({length:30},(_,i)=>`<i style="--height:${[24,50,72,42,90,65,35][i%7]}%"></i>`).join('')}</div><span>0:12</span></div>
      ${note('Nota de voz representada visualmente. Este ejemplo no reproduce ni graba audio.')}
      <button class="demo-action" data-action="voice-transcript" aria-expanded="false" aria-controls="voice-transcript">Ver transcripción ${arrow}</button><div id="voice-transcript" hidden><div class="transcript"><span>LO QUE EL CLIENTE DIJO</span><p>${safe(sector.answer)}</p></div>${bubble(sector.reply)}</div>`;
    if (feature === 'carrusel') renderCarousel();
    if (feature === 'llamadas') renderCall();
    if (feature === 'programados') {
      const date = new Date(); date.setDate(date.getDate()+1);
      const tomorrow = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      panel.innerHTML = `<div class="feature-heading"><span>05 / UNA FECHA, UN MOTIVO</span><h3>«Escríbeme mañana.»</h3></div><p class="feature-description">El cliente acuerda cuándo retomar. El mensaje conserva el motivo de la conversación.</p><form id="schedule-demo" class="schedule-demo"><label for="schedule-date">Fecha<input id="schedule-date" type="date" value="${tomorrow}" min="${tomorrow}" required></label><label for="schedule-time">Hora local<input id="schedule-time" type="time" value="10:00" required></label><button class="demo-action" type="submit">Preparar recordatorio ${arrow}</button></form><div id="schedule-result" class="schedule-result" role="status"></div>${note('Simulación: no programa ni envía mensajes. En operación se revisan consentimiento, horario y requisitos del canal.')}`;
    }
    if (feature === 'seguimiento') renderFollowup();
    if (feature === 'tablero') renderDashboard();
  }

  function renderCarousel() {
    const labels = OPTIONS[sector.id];
    $('#feature-panel').innerHTML = `<div class="feature-heading"><span>03 / DEL CATÁLOGO A LA ELECCIÓN</span><h3>Una conversación. Varias opciones.</h3></div><div class="catalog-window"><article class="catalog-card"><div class="catalog-sample sample-${card}" aria-hidden="true"><span>${safe(sector.short)}</span><b>0${card+1}</b></div><div class="catalog-copy"><small>REFERENCIA DE EJEMPLO</small><h4>${safe(labels[card])}</h4><p>La ficha reúne la información que tu cliente necesita comparar.</p><button data-action="choose-card">Me interesa esta opción ${arrow}</button></div></article></div><div class="catalog-controls"><button data-action="prev-card" aria-label="Opción anterior">←</button><span>${card+1} de ${labels.length}</span><button data-action="next-card" aria-label="Opción siguiente">→</button></div><div id="catalog-selection" role="status"></div>${note('Opciones ilustrativas. Tu catálogo aporta fotos, especificaciones, precios y disponibilidad reales.')}`;
  }

  function renderCall() {
    const script = [
      ['Kacho',`Hola, soy el asistente de ventas. ${detail.question}`],
      ['Cliente',sector.answer], ['Kacho',sector.reply],
      ['Resumen para el equipo',`${sector.next}. Contexto: ${detail.brief}.`]
    ];
    $('#feature-panel').innerHTML = `<div class="feature-heading"><span>04 / ATENCIÓN POR VOZ</span><h3>La llamada deja un siguiente paso.</h3></div><div class="call-display"><img src="assets/${sector.id}.webp" width="90" height="90" alt=""><div><strong>Kacho ${safe(detail.name)}</strong><span>${callStep ? 'Recorrido de una llamada de ejemplo' : 'Llamada de ejemplo'}</span></div><span class="call-symbol" aria-hidden="true">◖</span></div><div class="call-script" aria-live="polite">${script.slice(0,callStep).map(([who,text])=>`<p><span>${safe(who)}</span>${safe(text)}</p>`).join('')}</div><button class="demo-action" data-action="advance-call">${callStep===4?'Reiniciar llamada':callStep?'Siguiente parte':'Atender llamada de ejemplo'} ${arrow}</button>${note('Guion escrito: no inicia una llamada ni usa tu micrófono. La conexión de voz se define según el canal y el servicio contratado.')}`;
  }

  function renderFollowup() {
    const states = {
      pendiente: ['Hay algo por resolver',`Hola, retomando ${detail.brief}: ¿quieres que avancemos con ${sector.next.toLowerCase()}?`,'El seguimiento recupera el contexto y propone una acción concreta.'],
      respondio: ['Seguimiento detenido','El cliente ya respondió. La conversación continúa desde su último mensaje.','Se vuelve a comprobar el estado antes de enviar.'],
      asesor: ['Tu equipo tiene la conversación','Un asesor está atendiendo al cliente. Kacho deja espacio y conserva el contexto.','El bot no se interpone cuando entra una persona.']
    };
    const data = states[followup];
    $('#feature-panel').innerHTML = `<div class="feature-heading"><span>06 / CONTINUIDAD CON CRITERIO</span><h3>Seguir la venta también es saber parar.</h3></div><div class="followup-states" role="group" aria-label="Estado del seguimiento">${[['pendiente','Sin respuesta'],['respondio','Cliente respondió'],['asesor','Asesor activo']].map(([id,label])=>`<button data-followup="${id}" aria-pressed="${id===followup}">${label}</button>`).join('')}</div><div class="followup-timeline"><span>Consulta recibida</span><span>Contexto preparado</span><strong>${data[0]}</strong></div>${bubble(data[1])}<p class="feature-description">${data[2]}</p>${note('Recorrido ilustrativo. Los tiempos, límites, consentimiento y excepciones se acuerdan con tu negocio.')}`;
  }

  function renderDashboard() {
    const views = {
      atencion: [['Consultas recibidas',120],['Atendidas',96],['Con siguiente paso',64]],
      cotizaciones: [['Consultas recibidas',120],['Cotizaciones',38],['Ventas confirmadas',8]],
      seguimiento: [['Cotizaciones',38],['En seguimiento',20],['Con asesor',10]]
    };
    $('#feature-panel').innerHTML = `<div class="feature-heading"><span>07 / LO QUE PASA, A LA VISTA</span><h3>Un tablero para decidir.</h3></div><div class="dashboard-tabs" role="group" aria-label="Vista del tablero">${[['atencion','Atención'],['cotizaciones','Cotizaciones'],['seguimiento','Seguimiento']].map(([id,label])=>`<button data-dashboard="${id}" aria-pressed="${id===dashboard}">${label}</button>`).join('')}</div><div class="mini-dashboard"><div class="mini-dashboard-top"><strong>Operación comercial</strong><span>Datos de ejemplo</span></div>${views[dashboard].map(([label,value])=>`<div class="dashboard-row"><div><span>${label}</span><strong>${value}</strong></div><div class="dashboard-track"><i style="--bar:${value/120*100}%"></i></div></div>`).join('')}<div class="dashboard-footnote">Misma cohorte: 120 consultas recibidas.<br>Las etapas del embudo no se suman entre sí.</div></div>${note('Números ficticios para mostrar el tablero. En una operación real se concilian conversación, cotización y cierre; los envíos no son ventas.')}`;
  }

  $('#advance-scene').addEventListener('click', () => { messageCount = messageCount===4 ? 1 : messageCount+1; renderConversation(); });
  $$('[data-scene]').forEach(button => button.addEventListener('click', () => selectScene(button.dataset.scene)));
  $$('.capability-picker [data-feature]').forEach(button => button.addEventListener('click', event => {
    selectFeature(button.dataset.feature);
    if (event.detail > 0 && matchMedia('(max-width:900px)').matches) $('.demo-dock').scrollIntoView({behavior:document.body.dataset.motion==='off'?'instant':'smooth',block:'start'});
  }));
  $('#feature-panel').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'image-answer' || action === 'voice-transcript') {
      const target = action === 'image-answer' ? $('#image-answer') : $('#voice-transcript');
      target.hidden = !target.hidden;
      button.setAttribute('aria-expanded', String(!target.hidden));
    }
    if (action === 'next-card' || action === 'prev-card') {
      card = (card + (action==='next-card'?1:-1) + 3) % 3;
      renderCarousel(); $(`[data-action="${action}"]`).focus({preventScroll:true});
    }
    if (action === 'choose-card') $('#catalog-selection').innerHTML = bubble(`Elegiste ${OPTIONS[sector.id][card].toLowerCase()}. Para avanzar, confirmemos ${sector.asks.toLowerCase()}.`);
    if (action === 'advance-call') { callStep = (callStep+1)%5; renderCall(); $('[data-action="advance-call"]').focus({preventScroll:true}); }
    if (button.dataset.followup) { followup = button.dataset.followup; renderFollowup(); $(`[data-followup="${followup}"]`).focus({preventScroll:true}); }
    if (button.dataset.dashboard) { dashboard = button.dataset.dashboard; renderDashboard(); $(`[data-dashboard="${dashboard}"]`).focus({preventScroll:true}); }
  });
  $('#feature-panel').addEventListener('submit', event => {
    if (event.target.id !== 'schedule-demo') return;
    event.preventDefault();
    const date = new Date($('#schedule-date').value + 'T' + $('#schedule-time').value);
    if (!Number.isFinite(date.getTime())) return;
    const formatted = date.toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});
    $('#schedule-result').innerHTML = `<span>PREPARADO EN ESTE EJEMPLO</span><strong>${safe(formatted)} · hora de tu dispositivo</strong>${bubble(`Hola, como acordamos, retomamos ${detail.brief}. ¿Avanzamos con ${sector.next.toLowerCase()}?`)}`;
  });

  function updateBrand() {
    const name = $('#brand-company').value.trim() || 'Tu empresa';
    const initials = name.split(/\s+/).slice(0,2).map(word => Array.from(word)[0]).join('').toUpperCase();
    $('#brand-preview-name').textContent = name;
    $('#brand-greeting-name').textContent = name;
    $('#brand-greeting').textContent = `Hola, soy el asistente de ${name}. ${detail ? detail.question : 'Cuéntame qué tienes en mente.'}`;
    $$('[data-logo-slot]').forEach(slot => {
      slot.replaceChildren();
      if (logoURL) { const image = document.createElement('img'); image.src=logoURL; image.alt='Tu logo'; slot.append(image); }
      else slot.textContent = initials;
    });
  }
  $('#brand-company').addEventListener('input', updateBrand);
  $('#brand-logo-input').addEventListener('change', async event => {
    const file = event.target.files[0], version = ++uploadVersion;
    if (!file) return;
    const status = $('#brand-upload-status');
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2*1024*1024) {
      status.textContent = 'Elige un PNG, JPG o WebP de hasta 2 MB.'; event.target.value=''; return;
    }
    const url = URL.createObjectURL(file), image = new Image(); image.src=url;
    try {
      await image.decode();
      if (version !== uploadVersion) { URL.revokeObjectURL(url); return; }
      if (logoURL) URL.revokeObjectURL(logoURL);
      logoURL=url; logoName=file.name;
      updateBrand(); $('#brand-logo-remove').hidden=false;
      status.textContent = 'Tu logo está en la vista previa. No se ha enviado ni guardado.';
    } catch { URL.revokeObjectURL(url); if (version === uploadVersion) status.textContent='No pudimos abrir esa imagen. Prueba otro PNG, JPG o WebP.'; }
  });
  $('#brand-logo-remove').addEventListener('click', () => {
    ++uploadVersion; if (logoURL) URL.revokeObjectURL(logoURL);
    logoURL=null; logoName=''; $('#brand-logo-input').value=''; $('#brand-logo-remove').hidden=true;
    $('#brand-upload-status').textContent='PNG, JPG o WebP, hasta 2 MB. Solo se muestra en tu navegador.';
    updateBrand(); $('#brand-logo-input').focus();
  });
  $$('[data-brand-color]').forEach(button => button.addEventListener('click', () => {
    $('#brand-preview').dataset.color=button.dataset.brandColor;
    $$('[data-brand-color]').forEach(item => item.setAttribute('aria-pressed',String(item===button)));
  }));
  $('#brand-use').addEventListener('click', () => {
    if (!$('#request-result').hidden) $('#edit-request').click();
    $('#company').value = $('#brand-company').value.trim();
    $('#company').dispatchEvent(new Event('input'));
    appliedBrand = { name: $('#brand-company').value.trim(), color: $('#brand-preview').dataset.color, logoName };
    $('#tu-kacho').scrollIntoView({behavior:document.body.dataset.motion==='off'?'instant':'smooth'});
    $('#company').focus({preventScroll:true});
  });

  function updateImpact() {
    const bounded = id => Math.max(0,Math.min(100, Number($(id).value)||0));
    const volume = Number($('#volume-input').value), current = bounded('#coverage-current'), target = bounded('#coverage-target');
    const quote = bounded('#quote-rate')/100, close = bounded('#close-rate')/100;
    $('#volume-value').textContent=number.format(volume);
    $('#current-value').textContent=current+'%'; $('#target-value').textContent=target+'%';
    const stages = rate => {
      const attended=Math.round(volume*rate/100), quotes=Math.round(attended*quote);
      return [volume,attended,quotes,Math.round(quotes*close)];
    };
    const before=stages(current), after=stages(target), labels=['Consultas recibidas','Atendidas','Cotizaciones','Ventas'];
    $('#impact-chart').innerHTML=labels.map((label,i)=>`<div class="funnel-row"><span>${label}</span><div class="funnel-pair"><div><i style="--bar:${before[i]/volume*100}%"></i><b>${number.format(before[i])}</b></div><div><i style="--bar:${after[i]/volume*100}%"></i><b>${number.format(after[i])}</b></div></div></div>`).join('');
    $('#impact-chart').setAttribute('aria-label',labels.map((label,i)=>`${label}: actual ${before[i]}, objetivo ${after[i]}`).join('. '));
    ['attended','quotes','sales'].forEach((id,i)=> {
      const delta=after[i+1]-before[i+1];
      $('#impact-'+id).textContent=(delta<0?'−':delta>0?'+':'')+number.format(Math.abs(delta));
    });
  }
  ['volume-input','coverage-current','coverage-target','quote-rate','close-rate'].forEach(id => $('#'+id).addEventListener('input', updateImpact));
  ['quote-rate','close-rate'].forEach(id => $('#'+id).addEventListener('change', () => {
    $('#'+id).value=String(Math.max(0,Math.min(100,Number($('#'+id).value)||0))); updateImpact();
  }));
  updateImpact(); updateBrand();
  const money = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
  for (const [id,key] of [['setup-price','setupMXN'],['monthly-price','monthlyMXN']]) {
    const value=window.KACHO_CONFIG?.pricing?.[key];
    if (typeof value==='number' && Number.isFinite(value) && value>0) $('#'+id).textContent=money.format(value)+' MXN';
  }
  function requestDetails() {
    const services = $$('.service-picker input:checked').map(input => input.value);
    return [services.length ? `Servicios de interés: ${services.join(', ')}` : 'Servicios: por definir en la propuesta',
      appliedBrand ? `Identidad: ${appliedBrand.name || 'Por definir'}; acento ${appliedBrand.color}` : null,
      appliedBrand?.logoName ? `Logo probado localmente: ${appliedBrand.logoName} (no se adjunta ni se envía)` : null].filter(Boolean);
  }
  $('.service-picker').addEventListener('change', () => document.dispatchEvent(new Event('kacho:request-changed')));
  return { selectSector, selectScene, requestDetails };
})();
