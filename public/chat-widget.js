(() => {
  'use strict';
  const widget = document.querySelector('#kacho-chat-widget');
  if (!widget) return;
  const $ = selector => widget.querySelector(selector);
  const panel = $('#kacho-chat');
  const launcher = $('#kacho-chat-launcher');
  const content = $('#kacho-chat-content');
  const welcome = $('#kacho-chat-welcome');
  const messages = $('#kacho-chat-messages');
  const followups = $('#kacho-chat-followups');
  const input = $('#kacho-chat-input');
  const send = $('#kacho-chat-send');
  const reset = $('#kacho-chat-reset');
  const threadLabel = $('#kacho-chat-thread-label');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = null;

  const questions = {
    funciones: '¿Qué puede hacer Kacho?',
    negocio: '¿Cómo sería Kacho para mi negocio?',
    precio: '¿Cuánto cuesta?',
    inicio: '¿Qué necesito para empezar?',
    demo: 'Quiero ver una demo',
    equipo: '¿Cuándo entra mi equipo?',
    marca: '¿Puede llevar mi marca?'
  };

  // Respuestas locales para revisar la experiencia. Este es el punto a reemplazar
  // al conectar el motor; no hay llamadas, credenciales ni persistencia de mensajes.
  function getDemoReply(question) {
    const text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/\b(precio|cuesta|cuestan|costo|costos|cobra|cobran|cobro|tarifa|tarifas|plan|planes|pagar|gratis|inversion|mensualidad)\b/.test(text)) return {
      text: 'La propuesta se prepara a medida de tu negocio. Separamos la puesta en marcha, la operación mensual y los consumos de proveedores.\n\nTodavía no hay una tarifa publicada. El alcance depende de tu catálogo, volumen de conversaciones y conexiones.',
      link: ['Ver servicios e inversión', '#propuesta'], next: ['inicio', 'negocio']
    };
    if (/\b(marca|nombre|logo|personalizar|personaliza|personalizacion|tono|colores|identidad)\b/.test(text)) return {
      text: 'Sí. La propuesta contempla adaptar el nombre, la apariencia y la forma de hablar a tu marca. También se prepara con tu catálogo, tus condiciones y tus reglas.\n\nEn la página puedes probar el nombre, logo y color para imaginarlo.',
      link: ['Probar mi marca', '#a-tu-medida'], next: ['inicio', 'precio']
    };
    if (/\b(persona|humano|humana|asesor|asesora|vendedor|equipo)\b/.test(text) && !/\b(que es|que hace|puede hacer)\b/.test(text)) return {
      text: 'Tu equipo sigue formando parte de la conversación. Desde la preparación se define cuándo pasar una consulta a una persona y qué contexto necesita recibir.\n\nPor ejemplo: una condición especial, una excepción o un cliente que pide hablar con alguien.',
      link: ['Ver cómo se prepara', '#como-empezamos'], next: ['funciones', 'inicio']
    };
    if (/\b(empezar|comenzar|inicio|necesito|necesitan|instalar|instalacion|onboarding|preparar|contratar|informacion)\b/.test(text)) return {
      text: 'Empezamos por qué vendes y qué te preguntan tus clientes. Nos sirven tu catálogo o servicios, condiciones comerciales y ejemplos de conversaciones.\n\nCon eso se define el alcance, se prepara al especialista y se prueban sus respuestas contigo.',
      link: ['Preparar mi solicitud de demo', '#tu-kacho'], next: ['precio', 'marca']
    };
    if (/\b(demo|probar|prueba|verlo|ejemplo|ejemplos)\b/.test(text)) return {
      text: 'Puedes recorrer las demos de la página: elige una especialidad y avanza mensaje por mensaje. Hay ejemplos de conversación, imágenes, voz, seguimiento y más.\n\nSon experiencias ilustrativas para conocer la propuesta; todavía no hay un bot conectado.',
      link: ['Explorar las demos', '#especialistas'], next: ['negocio', 'precio']
    };
    if (/\b(negocio|empresa|giro|restaurante|tienda|clinica|inmobiliaria|construccion|materiales|ecommerce|muebles|auto|autos|solar|industrial|cursos|eventos)\b/.test(text)) return {
      text: 'Kacho se pone la cachucha de tu negocio. La idea es preparar a tu asistente con lo que vendes, las preguntas de tus clientes y el siguiente paso que quieres lograr.\n\nTenemos diez especialidades de ejemplo para explorar. Si tu giro es distinto, se revisa en la propuesta.',
      link: ['Conocer las especialidades', '#especialistas'], next: ['marca', 'inicio']
    };
    if (/\b(whatsapp|crm|conectar|conexiones|integracion|integraciones|herramientas)\b/.test(text)) return {
      text: 'La propuesta de Kacho está pensada para WhatsApp y las herramientas de tu operación. Primero se revisan tu número y tus sistemas; cada conexión se confirma dentro del alcance.\n\nEste chat es una demo local. No está conectado a WhatsApp, a un CRM ni al motor de Kacho.',
      link: ['Revisar preguntas frecuentes', '#preguntas'], next: ['inicio', 'precio']
    };
    if (/\b(datos|privacidad|guardar|guarda|guardan|envia|envian|enviar)\b/.test(text)) return {
      text: 'En esta demo, lo que escribes se queda en la memoria de esta página y se borra al recargarla. No se envía a ningún motor.\n\nPuedes empezar de nuevo con la flecha circular de arriba.',
      next: ['funciones', 'demo']
    };
    if (/\b(que es|quien eres|que haces|que hace|puede hacer|funciona|funciones|sirve|kacho|hola|buenas|buenos dias|buenas tardes)\b/.test(text)) return {
      text: 'Kacho es una familia de asistentes de venta, preparados para entender cada negocio. La propuesta contempla orientar a quien pregunta, mostrar opciones, apoyar cotizaciones y dar seguimiento.\n\nYo soy tu guía por esta página. Puedes preguntarme por las funciones, la personalización o cómo empezar.',
      link: ['Ver a Kacho en acción', '#especialistas'], next: ['negocio', 'precio']
    };
    if (/\b(gracias|perfecto|genial|listo)\b/.test(text)) return {
      text: 'Aquí seguimos. Si te surge otra duda sobre Kacho, puedes escribirla o elegir una pregunta.',
      next: ['demo', 'inicio']
    };
    return {
      text: 'Esa todavía no la tengo en esta demo. Por ahora puedo contarte qué puede hacer Kacho, cómo se adapta a tu negocio y cómo se prepara una propuesta.\n\n¿Te cuento por dónde empezar?',
      next: ['funciones', 'inicio']
    };
  }

  function makeIcon(id) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', `#${id}`);
    svg.append(use);
    return svg;
  }

  function scrollToLatest() {
    if (!panel.hidden) content.scrollTo({ top: content.scrollHeight, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  }

  function resizeInput() {
    input.style.height = '44px';
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
    send.disabled = pending !== null || !input.value.trim();
  }

  function syncViewport() {
    // La altura visible mantiene el compositor accesible con teclado en móvil.
    const viewport = window.visualViewport;
    if (!viewport || viewport.scale !== 1) return;
    panel.style.setProperty('--kc-viewport-height', `${viewport.height}px`);
    const keyboardOffset = Math.max(0, innerHeight - viewport.height - viewport.offsetTop);
    panel.style.setProperty('--kc-keyboard-offset', `${keyboardOffset}px`);
  }

  function openChat() {
    panel.hidden = false;
    launcher.hidden = true;
    launcher.dataset.visited = 'true';
    launcher.setAttribute('aria-expanded', 'true');
    syncViewport();
    resizeInput();
    if (matchMedia('(min-width: 601px)').matches) input.focus({ preventScroll: true });
    else $('#kacho-chat-close').focus({ preventScroll: true });
    if (welcome.hidden) scrollToLatest();
    else content.scrollTop = 0;
  }

  function closeChat() {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus({ preventScroll: true });
  }

  function showFollowups(ids) {
    followups.replaceChildren();
    ids.forEach(id => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.kachoQuestion = id;
      button.textContent = questions[id];
      followups.append(button);
    });
    followups.hidden = false;
  }

  function appendAnswer(reply) {
    const message = document.createElement('div');
    message.className = 'kc-message kc-answer';
    const label = document.createElement('span');
    label.className = 'kc-answer-label';
    const avatar = document.createElement('img');
    avatar.src = 'assets/kacho-icon.svg';
    avatar.width = 23;
    avatar.height = 23;
    avatar.alt = '';
    label.append(avatar, 'Kacho');
    const body = document.createElement('div');
    body.className = 'kc-answer-body';
    const text = document.createElement('p');
    text.textContent = reply.text;
    body.append(text);
    if (reply.link) {
      const link = document.createElement('a');
      link.href = reply.link[1];
      link.append(reply.link[0], makeIcon('arrow-up'));
      link.addEventListener('click', () => {
        closeChat();
        const target = document.querySelector(reply.link[1]);
        if (target) {
          const focusTarget = target.querySelector('h2') || target;
          const previousTabIndex = focusTarget.getAttribute('tabindex');
          focusTarget.setAttribute('tabindex', '-1');
          focusTarget.focus({ preventScroll: true });
          focusTarget.addEventListener('blur', () => {
            if (previousTabIndex === null) focusTarget.removeAttribute('tabindex');
            else focusTarget.setAttribute('tabindex', previousTabIndex);
          }, { once: true });
        }
      });
      body.append(link);
    }
    message.append(label, body);
    messages.append(message);
    showFollowups(reply.next);
  }

  function ask(question) {
    const text = question.trim().slice(0, 700);
    if (!text || pending !== null) return;
    welcome.hidden = true;
    threadLabel.hidden = false;
    followups.hidden = true;
    reset.disabled = false;
    const message = document.createElement('div');
    message.className = 'kc-message kc-message-user';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.append(paragraph);
    messages.append(message);
    const typing = document.createElement('div');
    typing.className = 'kc-typing';
    typing.setAttribute('aria-label', 'Preparando respuesta de ejemplo');
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'kc-typing-dot';
      dot.setAttribute('aria-hidden', 'true');
      typing.append(dot);
    }
    messages.append(typing);
    // Breve transición visual. La respuesta siempre se resuelve en el navegador.
    pending = window.setTimeout(() => {
      typing.remove();
      appendAnswer(getDemoReply(text));
      pending = null;
      resizeInput();
      scrollToLatest();
    }, 550);
    input.value = '';
    resizeInput();
    scrollToLatest();
  }

  launcher.addEventListener('click', openChat);
  $('#kacho-chat-close').addEventListener('click', closeChat);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeChat(); }
  });
  $('#kacho-chat-form').addEventListener('submit', event => {
    event.preventDefault();
    ask(input.value);
    input.focus({ preventScroll: true });
  });
  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      ask(input.value);
    }
  });
  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-kacho-question]');
    if (button && questions[button.dataset.kachoQuestion]) {
      ask(questions[button.dataset.kachoQuestion]);
      if (matchMedia('(min-width: 601px)').matches) input.focus({ preventScroll: true });
      else panel.focus({ preventScroll: true });
    }
  });
  reset.addEventListener('click', () => {
    window.clearTimeout(pending);
    pending = null;
    messages.replaceChildren();
    followups.replaceChildren();
    followups.hidden = true;
    threadLabel.hidden = true;
    welcome.hidden = false;
    input.value = '';
    reset.disabled = true;
    resizeInput();
    content.scrollTop = 0;
    if (matchMedia('(min-width: 601px)').matches) input.focus({ preventScroll: true });
    else panel.focus({ preventScroll: true });
  });
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);
  widget.hidden = false;
})();
