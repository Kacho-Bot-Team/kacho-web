// Plantilla de página por giro (KAC-64). Estructura: estrategia SEO + AEO, §6.1.
// Todo el contenido sale en el HTML: los rastreadores de IA no ejecutan JavaScript.

const SITIO = 'https://kachobot.com';

const esc = (texto) => String(texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const flecha = '<svg class="icon" aria-hidden="true"><use href="#arrow-up"/></svg>';

// Liga a la página del giro si ya existe; si no, a la demo de la home con ese giro elegido.
const hrefGiro = (id, paginas) => paginas[id] ? `/giros/${paginas[id]}` : `/?giro=${id}#especialistas`;

const absoluta = (href) => href.startsWith('http') ? href : SITIO + href;

export function paginaGiro({ giro, textos, giros, paginas, robots, contacto, hayIndice }) {
  const t = textos;
  const especialista = `Kacho ${giro.short}`;
  const url = `${SITIO}/giros/${t.slug}`;
  const migas = [
    ['Inicio', '/'],
    ['Giros', hayIndice ? '/giros' : '/#especialistas'],
    [t.miga, null],
  ];
  const datosMigas = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migas.map(([nombre, href], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: nombre,
      ...(href ? { item: absoluta(href) } : {}),
    })),
  };
  const conversacion = [
    ['cliente', 'Cliente', giro.buyer],
    ['kacho', especialista, giro.bot],
    ['cliente', 'Cliente', giro.answer],
    ['kacho', especialista, giro.reply],
  ];
  const porId = Object.fromEntries(giros.map((g) => [g.id, g]));

  return `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${robots}
  <meta name="theme-color" content="#f6f1ea">
  <title>${esc(t.titulo)}</title>
  <meta name="description" content="${esc(t.descripcion)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_MX">
  <meta property="og:site_name" content="Kacho">
  <meta property="og:title" content="${esc(t.titulo)}">
  <meta property="og:description" content="${esc(t.descripcion)}">
  <meta property="og:url" content="${url}">
  <link rel="icon" href="/assets/kacho-icon.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/${giro.id}.webp" as="image">
  <link rel="stylesheet" href="/kacho.css">
  <link rel="stylesheet" href="/giro.css">
  <script type="application/ld+json">${JSON.stringify(datosMigas)}</script>
</head>
<body class="giro-page" style="--giro:var(${t.color})">
  <svg class="svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
    <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="arrow-up" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6h12v12"/></symbol>
  </defs></svg>
  <a class="skip" href="#contenido">Ir al contenido</a>
  <header class="site-header">
    <a href="/" class="logo" aria-label="Kacho, inicio"><img src="/assets/kacho-icon.svg" width="32" height="32" alt=""><span>kacho<span class="logo-period">.</span></span></a>
    <div class="header-actions"><a class="button button-small" href="/#tu-kacho">Pedir demo ${flecha}</a></div>
  </header>

  <main id="contenido">
    <nav class="giro-migas section-shell" aria-label="Migas de pan"><ol>${migas.map(([nombre, href]) => href
      ? `<li><a href="${href}">${esc(nombre)}</a></li>`
      : `<li aria-current="page">${esc(nombre)}</li>`).join('')}</ol></nav>

    <section class="giro-hero section-shell">
      <div class="giro-hero-copy">
        <p class="giro-especialista">${esc(especialista)}</p>
        <h1>${esc(t.h1)}</h1>
        <p class="giro-lema">${esc(t.lema[0])} <em>${esc(t.lema[1])}</em></p>
        <p class="giro-respuesta">${esc(t.respuesta)}</p>
        <div class="hero-actions"><a class="button" href="/#tu-kacho">Pedir demo ${flecha}</a><a class="text-link" href="/?giro=${giro.id}#especialistas">Ver la demo <svg class="icon" aria-hidden="true"><use href="#arrow"/></svg></a></div>
      </div>
      <figure class="giro-retrato">
        <img src="/assets/${giro.id}.webp" width="900" height="900" fetchpriority="high" alt="${esc(t.alt)}">
      </figure>
    </section>

    <section class="giro-bloque giro-conversa section-shell" aria-labelledby="asi-conversa">
      <div class="giro-encabezado"><h2 id="asi-conversa">Así <em>conversa.</em></h2><p>Ejemplo ilustrativo. Tono: ${esc(giro.tone.toLowerCase())}.</p></div>
      <ol class="giro-chat">${conversacion.map(([quien, nombre, texto]) => `
        <li class="giro-mensaje giro-mensaje-${quien}"><span>${esc(nombre)}</span><p>${esc(texto)}</p></li>`).join('')}
      </ol>
    </section>

    <section class="giro-bloque section-shell" aria-labelledby="que-pregunta">
      <div class="giro-encabezado"><h2 id="que-pregunta">Qué pregunta antes de pasar <em>a tu equipo.</em></h2></div>
      <ol class="launch-steps giro-preguntas">${t.preguntas.map(([dato, porque], i) => `
        <li><span>${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(dato)}</h3><p>${esc(porque)}</p></div></li>`).join('')}
      </ol>
    </section>

    <section class="giro-bloque giro-entrega section-shell" aria-labelledby="que-recibe">
      <div class="giro-encabezado"><h2 id="que-recibe">Qué recibe <em>tu equipo.</em></h2><p>${esc(t.recibe.intro)}</p></div>
      <div class="giro-entrega-cuerpo">
        <article class="giro-solicitud" aria-labelledby="solicitud-titulo">
          <header><span>Ejemplo</span><h3 id="solicitud-titulo">${esc(giro.next)}</h3></header>
          <dl>${t.recibe.solicitud.map(([campo, valor]) => `
            <div><dt>${esc(campo)}</dt><dd>${esc(valor)}</dd></div>`).join('')}
          </dl>
        </article>
        <p class="giro-entrega-cierre">${esc(t.recibe.cierre)}</p>
      </div>
    </section>

    <section class="faq-section giro-faq section-shell" aria-labelledby="preguntas-frecuentes">
      <h2 id="preguntas-frecuentes">Preguntas <em>frecuentes.</em></h2>
      <div class="giro-faq-lista">${t.faq.map(([pregunta, respuesta]) => `
        <article><h3>${esc(pregunta)}</h3><p>${esc(respuesta)}</p></article>`).join('')}
      </div>
    </section>

    <section class="giro-llamado section-shell" aria-labelledby="llamado">
      <h2 id="llamado">${esc(t.llamado.titulo[0])} <em>${esc(t.llamado.titulo[1])}</em></h2>
      <p>${esc(t.llamado.texto)}</p>
      <a class="button" href="/#tu-kacho">Pedir demo ${flecha}</a>
    </section>

    <nav class="giro-vecinos section-shell" aria-labelledby="vecinos">
      <h2 id="vecinos">También en la familia</h2>
      <ul>${t.vecinos.map((id) => `
        <li><a href="${hrefGiro(id, paginas)}"><img src="/assets/${id}.webp" width="900" height="900" loading="lazy" alt=""><span>Kacho ${esc(porId[id].short)}</span><small>${esc(porId[id].name)}</small></a></li>`).join('')}
      </ul>
    </nav>
  </main>

  <footer class="site-footer section-shell">
    <div class="footer-top"><p>Se pone la cachucha.<br>Se sabe tu negocio.</p><a href="#contenido" class="text-link">Volver arriba ${flecha}</a></div>
    <p class="footer-wordmark" aria-label="Kacho">kacho<span>.</span></p>
    <nav class="giro-pie-giros" aria-label="Los 10 especialistas"><span>Especialistas</span><ul>${giros.map((g) => g.id === giro.id
      ? `<li aria-current="page">${esc(g.short)}</li>`
      : `<li><a href="${hrefGiro(g.id, paginas)}">${esc(g.short)}</a></li>`).join('')}</ul></nav>
    <div class="footer-bottom"><span>Especialistas de venta para WhatsApp.</span><a href="mailto:${esc(contacto)}">${esc(contacto)}</a><a href="/#tu-kacho">Pedir demo ${flecha}</a></div>
  </footer>
</body>
</html>
`;
}
