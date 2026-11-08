// Plantilla de comparativa (KAC-58): Kacho frente a otro producto, con la fuente de cada afirmación sobre el otro.
// Misma familia visual que la página por giro (KAC-64) y, como ella, todo el contenido en el HTML: los rastreadores de
// IA no ejecutan JavaScript.
import { SITIO, absoluta, esc, flecha, hrefGiro } from './plantilla-giro.mjs';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre',
  'noviembre', 'diciembre'];
const fechaLarga = (iso) => { const [a, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${a}`; };

export function paginaComparativa({ slug, textos, giros, paginas, robots, contacto }) {
  const t = textos;
  const url = `${SITIO}/alternativa-a/${slug}`;
  const migas = [['Inicio', '/'], [t.miga, null]];
  const datosMigas = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migas.map(([nombre, href], i) => ({
      '@type': 'ListItem', position: i + 1, name: nombre, ...(href ? { item: absoluta(href) } : {}),
    })),
  };
  // Las fuentes se numeran en el orden en que aparecen por primera vez.
  const orden = [...new Set([...t.queEs.puntos.map((p) => p.fuente), ...t.tabla.filas.map((f) => f.fuente)])];
  const nota = (id) => `<sup><a href="#fuente-${id}">${orden.indexOf(id) + 1}</a></sup>`;
  const porId = Object.fromEntries(giros.map((g) => [g.id, g]));
  const ej = porId[t.ejemplo.giro];
  const conversacion = [['cliente', 'Cliente', ej.buyer], ['kacho', `Kacho ${ej.short}`, ej.bot],
    ['cliente', 'Cliente', ej.answer], ['kacho', `Kacho ${ej.short}`, ej.reply]];

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
  <meta property="og:type" content="article">
  <meta property="og:locale" content="es_MX">
  <meta property="og:site_name" content="Kacho">
  <meta property="og:title" content="${esc(t.titulo)}">
  <meta property="og:description" content="${esc(t.descripcion)}">
  <meta property="og:url" content="${url}">
  <meta property="article:modified_time" content="${t.actualizada.fecha}">
  <link rel="icon" href="/assets/kacho-icon.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/kacho.css">
  <link rel="stylesheet" href="/giro.css">
  <link rel="stylesheet" href="/comparativa.css">
  <script type="application/ld+json">${JSON.stringify(datosMigas)}</script>
</head>
<body class="giro-page comparativa-page" style="--giro:var(${t.color})">
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

    <section class="giro-hero comparativa-hero section-shell">
      <div class="giro-hero-copy">
        <p class="giro-especialista">${esc(t.etiqueta)} · <time datetime="${t.actualizada.fecha}">${esc(t.actualizada.texto)}</time></p>
        <h1>${esc(t.h1)}</h1>
        <p class="giro-lema">${esc(t.lema[0])} <em>${esc(t.lema[1])}</em></p>
        <p class="giro-respuesta">${esc(t.respuesta)}</p>
        <div class="hero-actions"><a class="button" href="/#tu-kacho">Pedir demo ${flecha}</a><a class="text-link" href="#lado-a-lado">Ver lado a lado <svg class="icon" aria-hidden="true"><use href="#arrow"/></svg></a></div>
      </div>
    </section>

    <section class="giro-bloque section-shell" aria-labelledby="que-es">
      <div class="giro-encabezado"><h2 id="que-es">${esc(t.queEs.titulo[0])} <em>${esc(t.queEs.titulo[1])}</em></h2><p>${esc(t.queEs.intro)}</p></div>
      <ul class="comparativa-puntos">${t.queEs.puntos.map((p) => `
        <li><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}${nota(p.fuente)}</p></li>`).join('')}
      </ul>
    </section>

    <section class="giro-bloque section-shell" aria-labelledby="lado-a-lado">
      <div class="giro-encabezado"><h2 id="lado-a-lado">${esc(t.tabla.titulo[0])} <em>${esc(t.tabla.titulo[1])}</em></h2></div>
      <table class="comparativa-tabla">
        <thead><tr><th scope="col"><span class="sr-only">Qué se compara</span></th><th scope="col">${esc(t.tabla.otro)}</th><th scope="col">Kacho</th></tr></thead>
        <tbody>${t.tabla.filas.map((f) => `
          <tr><th scope="row">${esc(f.criterio)}</th><td data-col="${esc(t.tabla.otro)}">${esc(f.otro)}${nota(f.fuente)}</td><td data-col="Kacho">${esc(f.kacho)}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="giro-bloque section-shell" aria-labelledby="cuando">
      <div class="giro-encabezado"><h2 id="cuando">Cuándo te conviene <em>cada uno.</em></h2></div>
      <div class="comparativa-cuando">${[t.cuando.otro, t.cuando.kacho].map((c, i) => `
        <article${i ? ' class="comparativa-cuando-kacho"' : ''}><h3>${esc(c.titulo)}</h3><ul>${c.puntos.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></article>`).join('')}
      </div>
    </section>

    <section class="giro-bloque giro-conversa section-shell" aria-labelledby="ejemplo">
      <div class="giro-encabezado"><h2 id="ejemplo">${esc(t.ejemplo.titulo[0])} <em>${esc(t.ejemplo.titulo[1])}</em></h2><p>${esc(t.ejemplo.intro)}</p></div>
      <ol class="giro-chat">${conversacion.map(([quien, nombre, texto]) => `
        <li class="giro-mensaje giro-mensaje-${quien}"><span>${esc(nombre)}</span><p>${esc(texto)}</p></li>`).join('')}
      </ol>
      <p class="comparativa-entrega">Tu equipo recibe: <strong>${esc(ej.next)}</strong>, con ${esc(ej.asks.toLowerCase())}.</p>
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
      <h2 id="vecinos">Conoce a un especialista</h2>
      <ul>${t.especialistas.map((id) => `
        <li><a href="${hrefGiro(id, paginas)}"><img src="/assets/${id}.webp" width="900" height="900" loading="lazy" alt=""><span>Kacho ${esc(porId[id].short)}</span><small>${esc(porId[id].name)}</small></a></li>`).join('')}
      </ul>
    </nav>

    <section class="comparativa-fuentes section-shell" aria-labelledby="fuentes">
      <h2 id="fuentes">Fuentes</h2>
      <ol>${orden.map((id) => `
        <li id="fuente-${id}"><a href="${esc(t.fuentes[id].url)}" rel="noopener">${esc(t.fuentes[id].titulo)}</a>. Consultada el ${fechaLarga(t.fuentes[id].consultada)}.</li>`).join('')}
      </ol>
      <p>Meta, WhatsApp y Meta Business Agent son marcas de Meta Platforms. Kacho no está afiliado a Meta.</p>
    </section>
  </main>

  <footer class="site-footer section-shell">
    <div class="footer-top"><p>Se pone la cachucha.<br>Se sabe tu negocio.</p><a href="#contenido" class="text-link">Volver arriba ${flecha}</a></div>
    <p class="footer-wordmark" aria-label="Kacho">kacho<span>.</span></p>
    <nav class="giro-pie-giros" aria-label="Los 10 especialistas"><span>Especialistas</span><ul>${giros.map((g) => `<li><a href="${hrefGiro(g.id, paginas)}">${esc(g.short)}</a></li>`).join('')}</ul></nav>
    <div class="footer-bottom"><span>Especialistas de venta para WhatsApp.</span><a href="mailto:${esc(contacto)}">${esc(contacto)}</a><a href="/#tu-kacho">Pedir demo ${flecha}</a></div>
  </footer>
</body>
</html>
`;
}
