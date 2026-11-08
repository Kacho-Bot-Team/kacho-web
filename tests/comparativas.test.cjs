const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');
const textos = Object.entries(JSON.parse(readFileSync(path.join(raiz, 'paginas/textos-comparativas.json'), 'utf8')))
  .filter(([slug]) => !slug.startsWith('_'));
const html = (slug) => readFileSync(path.join(raiz, `public/alternativa-a/${slug}.html`), 'utf8');
const visible = (pagina) => pagina.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<head>[\s\S]*?<\/head>/, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

let browser, server, base;
before(async () => {
  const root = path.join(raiz, 'public');
  const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
  server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try { res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless:true });
});
after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });

test('las comparativas están al día con sus fuentes (no se editaron a mano)', async () => {
  const { generarComparativas } = await import(path.join(raiz, 'paginas/generar.mjs'));
  const generadas = generarComparativas();
  assert.equal(generadas.length, textos.length);
  for (const { ruta, html: esperado } of generadas) {
    assert.equal(readFileSync(path.join(raiz, ruta), 'utf8'), esperado, `${ruta} no coincide: corre pnpm run giros`);
  }
});

test('cada afirmación sobre el otro producto cita una fuente pública con fecha de consulta', () => {
  for (const [slug, t] of textos) {
    const pagina = html(slug);
    const citas = [...t.queEs.puntos.map((p) => p.fuente), ...t.tabla.filas.map((f) => f.fuente)];
    assert.ok(citas.length >= 5);
    for (const id of citas) {
      const f = t.fuentes[id];
      assert.ok(f, `«${id}» no está en fuentes`);
      assert.match(f.url, /^https:\/\//);
      assert.match(f.consultada, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(pagina.includes(`href="${esc(f.url)}"`), `la página no liga la fuente ${f.url}`);
    }
  }
});

test('la tabla y las respuestas están en el HTML, sin depender de JavaScript', () => {
  for (const [slug, t] of textos) {
    const pagina = html(slug);
    assert.ok(pagina.includes('<table'));
    for (const fila of t.tabla.filas) {
      for (const celda of [fila.criterio, fila.otro, fila.kacho]) assert.ok(pagina.includes(esc(celda)), `falta «${celda}»`);
    }
    assert.ok(pagina.includes(esc(t.respuesta)));
    assert.doesNotMatch(pagina, /<script\b(?![^>]*application\/ld\+json)/, 'la página no carga JavaScript');
  }
});

test('el ejemplo de Kacho sale de giros.json y se presenta como ejemplo ilustrativo', () => {
  const giros = JSON.parse(readFileSync(path.join(raiz, 'public/giros.json'), 'utf8'));
  for (const [slug, t] of textos) {
    const pagina = html(slug);
    const giro = giros.find((g) => g.id === t.ejemplo.giro);
    assert.ok(giro, `«${t.ejemplo.giro}» no está en giros.json`);
    for (const linea of [giro.buyer, giro.bot, giro.answer, giro.reply]) assert.ok(pagina.includes(esc(linea)), `falta «${linea}»`);
    assert.ok(pagina.includes('Ejemplo ilustrativo'));
  }
});

test('cada página sigue la plantilla: título, H1, canonical, migas, FAQ, ligas a un giro y llamado a la demo', () => {
  const robotsHome = readFileSync(path.join(raiz, 'public/index.html'), 'utf8').match(/<meta name="robots"[^>]*>/)?.[0];
  for (const [slug, t] of textos) {
    const pagina = html(slug);
    assert.ok(pagina.includes(`<title>${esc(t.titulo)}</title>`));
    assert.ok(t.titulo.length >= 30 && t.titulo.length <= 60, `título de ${t.titulo.length} caracteres`);
    assert.ok(t.descripcion.length >= 120 && t.descripcion.length <= 160, `descripción de ${t.descripcion.length} caracteres`);
    assert.equal((pagina.match(/<h1\b/g) || []).length, 1);
    assert.ok(pagina.includes(`<h1>${esc(t.h1)}</h1>`));
    assert.ok(pagina.includes(`<link rel="canonical" href="https://kachobot.com/alternativa-a/${slug}">`));
    if (robotsHome) assert.ok(pagina.includes(robotsHome), 'mientras la home lleve noindex, la comparativa también');
    const migas = JSON.parse(pagina.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
    assert.equal(migas['@type'], 'BreadcrumbList');
    const faq = pagina.match(/<div class="giro-faq-lista">([\s\S]*?)<\/div>/)[1];
    const preguntas = (faq.match(/<h3>/g) || []).length;
    assert.ok(preguntas >= 4 && preguntas <= 6, `${preguntas} preguntas frecuentes`);
    assert.ok((pagina.match(/href="\/#tu-kacho"/g) || []).length >= 2);
    assert.match(pagina, /href="\/giros\/[a-z-]+"/, 'liga al menos a una página por giro');
    assert.ok(pagina.includes(t.actualizada.texto), 'muestra la fecha de actualización');
  }
});

test('nada afirma precios, cifras, plazos, disponibilidad continua ni integraciones de Kacho', () => {
  const prohibido = /\$\s?\d|\d+\s?%|\bMXN\b|24\/7|24 horas|las 24|en minutos|en \d+ (días|horas|semanas)|garantiza|aumenta tus ventas|más ventas|se integra con|integrado con|ya se conecta|clientes como/i;
  for (const [slug] of textos) {
    const texto = visible(html(slug));
    assert.doesNotMatch(texto, prohibido, texto.match(prohibido)?.[0]);
  }
});

test('el texto cabe en el presupuesto de una comparativa', async () => {
  for (const [slug] of textos) {
    const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
    await page.goto(`${base}/alternativa-a/${slug}.html`);
    const total = await page.evaluate(() => document.body.innerText.trim().split(/\s+/).filter(Boolean).length);
    await page.close();
    assert.ok(total >= 500 && total <= 1100, `${total} palabras visibles`);
  }
});

test('se ve en celular y escritorio sin desbordarse, sin recursos rotos ni externos', async () => {
  for (const [slug] of textos) for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport:{ width, height:900 } });
    const externos = [], rotos = [], errores = [];
    page.on('request', r => { if (!r.url().startsWith(base)) externos.push(r.url()); });
    page.on('response', r => { if (r.status() >= 400) rotos.push(r.url()); });
    page.on('pageerror', e => errores.push(e.message));
    await page.goto(`${base}/alternativa-a/${slug}.html`, { waitUntil:'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await page.close();
    assert.equal(desborde, 0, `se desborda ${desborde}px a ${width}px`);
    assert.deepEqual([externos, rotos, errores], [[], [], []]);
  }
});
