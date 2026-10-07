'use strict';

window.KachoProduct = (() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const safe = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const arrow = '<svg class="icon" aria-hidden="true"><use href="#arrow"/></svg>';
  const number = new Intl.NumberFormat('es-MX');
  const messageMeta = (outgoing = false) => `<div class="message-meta"><time>9:41</time>${outgoing ? '<svg viewBox="0 0 20 12" aria-label="Leído"><path d="m1 6 4 4L14 1M10 8l2 2 7-9"/></svg>' : ''}</div>`;
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
      bubble.innerHTML = `<span class="sr-only">${role === 'buyer' ? 'Cliente' : safe('Kacho ' + detail.name)}</span><p>${safe(text)}</p>${messageMeta(role === 'buyer')}`;
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
    const viewport = $('#conversation-view');
    viewport.scrollTop = messageCount === 1 ? 0 : viewport.scrollHeight;
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
    $('#conversation-scenarios').hidden = feature !== 'conversacion';
    $('#conversation-actions').hidden = feature !== 'conversacion';
    $('#feature-panel').hidden = feature === 'conversacion';
    $('#feature-panel').dataset.feature = feature;
    $('.phone-screen').dataset.mode = feature;
    $('#feature-panel').scrollTop = 0;
    const notes = {
      conversacion: 'Conversación ilustrativa. Avanza un mensaje por clic; el bot aún no está conectado.',
      imagenes: 'Imagen y conversación ilustrativas. Las medidas y condiciones se confirman con el cliente.',
      voz: 'Nota de voz ilustrativa: puedes leer la transcripción. Esta demo no reproduce ni graba audio.',
      carrusel: 'Catálogo ilustrativo. Tu empresa aporta las fotos, precios y disponibilidad reales.',
      llamadas: 'Llamada ilustrativa con guion escrito. Esta demo no hace llamadas ni usa tu micrófono.',
      programados: 'Simulación: no agenda ni envía mensajes. Los horarios y permisos se definen con tu empresa.',
      seguimiento: 'Recorrido ilustrativo. El seguimiento se ajusta al estado de la conversación y a tus reglas.',
      tablero: 'Vista de un reporte compartido desde tu tablero, con datos ficticios. No es una función nativa de WhatsApp.'
    };
    $('#device-note').textContent = notes[feature];
    if (feature === 'conversacion') renderConversation();
    else renderFeature();
  }

  const bubble = (text, role = 'agent') => `<div class="message ${role}"><span class="sr-only">${role === 'buyer' ? 'Cliente' : 'Kacho ' + safe(detail.name)}</span><p>${safe(text)}</p>${messageMeta(role === 'buyer')}</div>`;
  function renderFeature() {
    const panel = $('#feature-panel');
    if (feature === 'imagenes') panel.innerHTML = `
      <div class="message buyer photo-message"><div class="sample-photo"><svg viewBox="0 0 560 400" role="img" aria-label="Ilustración de un espacio como imagen de referencia"><rect width="560" height="400" fill="#ded5c7"/><path d="M0 280 190 175H560V400H0" fill="#b1b7a1"/><path d="M0 0h190v175L0 280Z" fill="#eadfce"/><path d="M190 175 400 400M290 175 525 400M390 175 560 325M70 241H560M0 320h560" stroke="#ece8de" stroke-width="2"/><rect x="225" y="57" width="103" height="73" rx="2" fill="#5d716c"/><path d="M276 57v73" stroke="#ded5c7" stroke-width="5"/><rect x="382" y="69" width="73" height="106" fill="#927b60"/><path d="M470 270v-62" stroke="#727a59" stroke-width="5"/><ellipse cx="455" cy="217" rx="24" ry="12" fill="#839671"/><ellipse cx="486" cy="203" rx="23" ry="12" fill="#6d805a"/><path d="M445 258h48l-7 35h-34Z" fill="#b87b53"/></svg></div><p>Te comparto una referencia de lo que tengo en mente.</p>${messageMeta(true)}</div>
      <button class="demo-action" data-action="image-answer" aria-expanded="false" aria-controls="image-answer">Ver respuesta de ejemplo ${arrow}</button><div id="image-answer" hidden>${bubble(`Gracias, la imagen nos da contexto. Para orientarte necesitamos confirmar: ${sector.asks.toLowerCase()}. ¿Me cuentas un poco más?`)}</div>`;
    if (feature === 'voz') panel.innerHTML = `
      ${bubble('Te lo explico mejor por audio.', 'buyer')}
      <div class="message buyer voice-message"><div class="voice-note"><span class="voice-mark" aria-hidden="true">▶</span><div class="waveform" aria-hidden="true">${Array.from({length:30},(_,i)=>`<i style="--height:${[24,50,72,42,90,65,35][i%7]}%"></i>`).join('')}</div><span class="voice-avatar" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="12" r="6"/><path d="M5 30c0-14 22-14 22 0"/></svg></span></div><div class="voice-duration">0:12 ${messageMeta(true)}</div></div>
      <button class="demo-action" data-action="voice-transcript" aria-expanded="false" aria-controls="voice-transcript">Ver transcripción ${arrow}</button><div id="voice-transcript" hidden><div class="message buyer transcript"><span>Transcripción</span><p>${safe(sector.answer)}</p>${messageMeta(true)}</div>${bubble(sector.reply)}</div>`;
    if (feature === 'carrusel') renderCarousel();
    if (feature === 'llamadas') renderCall();
    if (feature === 'programados') {
      const date = new Date(); date.setDate(date.getDate()+1);
      const tomorrow = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      panel.innerHTML = `${bubble('Ahorita estoy ocupado. ¿Me escribes mañana?', 'buyer')}${bubble('Claro. Lo retomamos en el horario que te acomode.')}<form id="schedule-demo" class="schedule-demo"><p>Prueba un horario en la demo</p><label for="schedule-date">Fecha<input id="schedule-date" type="date" value="${tomorrow}" min="${tomorrow}" required></label><label for="schedule-time">Hora local<input id="schedule-time" type="time" value="10:00" required></label><button class="demo-action" type="submit">Preparar recordatorio ${arrow}</button></form><div id="schedule-result" class="schedule-result" role="status"></div>`;
    }
    if (feature === 'seguimiento') renderFollowup();
    if (feature === 'tablero') renderDashboard();
  }

  function renderCarousel() {
    const labels = OPTIONS[sector.id];
    $('#feature-panel').innerHTML = `${bubble('Te comparto algunas opciones. ¿Cuál se parece más a lo que buscas?')}<div class="catalog-window"><article class="catalog-card"><div class="catalog-sample sample-${card}" aria-hidden="true"><span>${safe(sector.short)}</span><b>0${card+1}</b></div><div class="catalog-copy"><small>CATÁLOGO DE EJEMPLO</small><h4>${safe(labels[card])}</h4><p>Revisa esta opción y la adaptamos a lo que necesitas.</p>${messageMeta()}<button data-action="choose-card">Me interesa esta opción ${arrow}</button></div></article></div><div class="catalog-controls"><button data-action="prev-card" aria-label="Opción anterior">←</button><span>${card+1} de ${labels.length}</span><button data-action="next-card" aria-label="Opción siguiente">→</button></div><div id="catalog-selection" role="status"></div>`;
  }

  function renderCall() {
    const script = [
      ['Kacho',`Hola, soy el asistente de ventas. ${detail.question}`],
      ['Cliente',sector.answer], ['Kacho',sector.reply],
      ['Resumen para el equipo',`${sector.next}. Contexto: ${detail.brief}.`]
    ];
    $('#feature-panel').innerHTML = `<div class="call-display"><span class="call-app">WhatsApp · Llamada de ejemplo</span><img src="assets/${sector.id}.webp" width="110" height="110" alt=""><strong>Kacho ${safe(detail.name)}</strong><span>${callStep === 4 ? 'Resumen preparado' : callStep ? 'Conversación de ejemplo' : 'Llamada entrante'}</span></div><div class="call-script" aria-live="polite">${script.slice(0,callStep).map(([who,text])=>`<p><span>${safe(who)}</span>${safe(text)}</p>`).join('')}</div><div class="call-decoration" aria-hidden="true"><span><svg class="icon" viewBox="0 0 24 24"><path d="M5 9h4l5-4v14l-5-4H5ZM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"/></svg></span><span><svg class="icon" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v4"/></svg></span><span><svg class="icon" viewBox="0 0 24 24"><rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 10 6-4v12l-6-4"/></svg></span></div><button class="demo-action" data-action="advance-call">${callStep===4?'Reiniciar llamada':callStep?'Siguiente parte':'Atender llamada de ejemplo'} ${arrow}</button>`;
    $('.call-script').scrollTop = $('.call-script').scrollHeight;
  }

  function renderFollowup() {
    const states = {
      pendiente: ['Hay algo por resolver',`Hola, retomando ${detail.brief}: ¿quieres que avancemos con ${sector.next.toLowerCase()}?`,'El seguimiento recupera el contexto y propone una acción concreta.'],
      respondio: ['Seguimiento detenido','El cliente ya respondió. La conversación continúa desde su último mensaje.','Se vuelve a comprobar el estado antes de enviar.'],
      asesor: ['Tu equipo tiene la conversación','Un asesor está atendiendo al cliente. Kacho deja espacio y conserva el contexto.','El bot no se interpone cuando entra una persona.']
    };
    const data = states[followup];
    $('#feature-panel').innerHTML = `${bubble('Gracias por la información, lo voy a revisar.', 'buyer')}${bubble('Claro, aquí estoy si tienes alguna duda.')}<div class="followup-states" role="group" aria-label="Estado del seguimiento">${[['pendiente','Sin respuesta'],['respondio','Cliente respondió'],['asesor','Asesor activo']].map(([id,label])=>`<button data-followup="${id}" aria-pressed="${id===followup}">${label}</button>`).join('')}</div><div class="followup-timeline"><strong>${data[0]}</strong></div>${followup === 'pendiente' ? bubble(data[1]) : `<div class="chat-system">${data[1]}</div>`}<p class="feature-description">${data[2]}</p>`;
  }

  function renderDashboard() {
    const views = {
      atencion: [['Consultas recibidas',120],['Atendidas',96],['Con siguiente paso',64]],
      cotizaciones: [['Consultas recibidas',120],['Cotizaciones',38],['Ventas confirmadas',8]],
      seguimiento: [['Cotizaciones',38],['En seguimiento',20],['Con asesor',10]]
    };
    $('#feature-panel').innerHTML = `${bubble('¿Cómo vamos con la atención y las cotizaciones?', 'buyer')}<div class="message agent shared-report"><p>Te comparto un resumen de tu tablero.</p><div class="dashboard-tabs" role="group" aria-label="Vista del tablero">${[['atencion','Atención'],['cotizaciones','Cotizaciones'],['seguimiento','Seguimiento']].map(([id,label])=>`<button data-dashboard="${id}" aria-pressed="${id===dashboard}">${label}</button>`).join('')}</div><div class="mini-dashboard"><div class="mini-dashboard-top"><strong>Operación comercial</strong><span>Datos de ejemplo</span></div>${views[dashboard].map(([label,value])=>`<div class="dashboard-row"><div><span>${label}</span><strong>${value}</strong></div><div class="dashboard-track"><i style="--bar:${value/120*100}%"></i></div></div>`).join('')}<div class="dashboard-footnote">Misma cohorte: 120 consultas recibidas.<br>Las etapas del embudo no se suman entre sí.</div></div>${messageMeta()}</div>`;
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
      if (!target.hidden) target.scrollIntoView({block:'nearest', behavior:'instant'});
    }
    if (action === 'next-card' || action === 'prev-card') {
      card = (card + (action==='next-card'?1:-1) + 3) % 3;
      renderCarousel(); $(`[data-action="${action}"]`).focus({preventScroll:true});
    }
    if (action === 'choose-card') {
      $('#catalog-selection').innerHTML = bubble(`Elegiste ${OPTIONS[sector.id][card].toLowerCase()}. Para avanzar, confirmemos ${sector.asks.toLowerCase()}.`);
      $('#catalog-selection').scrollIntoView({block:'nearest', behavior:'instant'});
    }
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
    $('#schedule-result').scrollIntoView({block:'nearest', behavior:'instant'});
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
