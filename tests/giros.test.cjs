const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');
const giros = JSON.parse(readFileSync(path.join(raiz, 'public/giros.json'), 'utf8'));
const textos = Object.entries(JSON.parse(readFileSync(path.join(raiz, 'paginas/textos-giros.json'), 'utf8')))
  .filter(([id]) => !id.startsWith('_'));
const html = (slug) => readFileSync(path.join(raiz, `public/giros/${slug}.html`), 'utf8');
const visible = (pagina) => pagina.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<head>[\s\S]*?<\/head>/, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

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

test('las páginas por giro están al día con sus fuentes (no se editaron a mano)', async () => {
  const { generar } = await import(path.join(raiz, 'paginas/generar.mjs'));
  const generadas = generar();
  assert.equal(generadas.length, textos.length);
  for (const { ruta, html: esperado } of generadas) {
    assert.equal(readFileSync(path.join(raiz, ruta), 'utf8'), esperado, `${ruta} no coincide: corre pnpm run giros`);
  }
});

test('la conversación y las preguntas del giro están en el HTML, sin depender de JavaScript', () => {
  for (const [id, t] of textos) {
    const pagina = html(t.slug);
    const giro = giros.find(g => g.id === id);
    for (const linea of [giro.buyer, giro.bot, giro.answer, giro.reply]) assert.ok(pagina.includes(linea), `falta «${linea}»`);
    assert.equal(t.preguntas.length, 4);
    for (const [dato] of t.preguntas) assert.ok(pagina.includes(`<h3>${dato}</h3>`), `falta la pregunta ${dato}`);
    assert.ok(pagina.includes('Ejemplo ilustrativo'));
    assert.doesNotMatch(pagina, /<script\b(?![^>]*application\/ld\+json)/, 'la página no carga JavaScript');
  }
});

test('cada página sigue la plantilla: título, H1, canonical, migas, FAQ y llamado a la demo', () => {
  const robotsHome = readFileSync(path.join(raiz, 'public/index.html'), 'utf8').match(/<meta name="robots"[^>]*>/)?.[0];
  for (const [, t] of textos) {
    const pagina = html(t.slug);
    assert.ok(pagina.includes(`<title>${t.titulo}</title>`));
    assert.equal((pagina.match(/<h1\b/g) || []).length, 1);
    assert.ok(pagina.includes(`<h1>${t.h1}</h1>`));
    assert.ok(pagina.includes(`<link rel="canonical" href="https://kachobot.com/giros/${t.slug}">`));
    if (robotsHome) assert.ok(pagina.includes(robotsHome), 'mientras la home lleve noindex, el giro también');
    const migas = JSON.parse(pagina.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
    assert.equal(migas['@type'], 'BreadcrumbList');
    assert.equal(migas.itemListElement.length, 3);
    const faq = pagina.match(/<div class="giro-faq-lista">([\s\S]*?)<\/div>/)[1];
    const preguntas = (faq.match(/<h3>/g) || []).length;
    assert.ok(preguntas >= 4 && preguntas <= 6, `${preguntas} preguntas frecuentes`);
    assert.ok((pagina.match(/href="\/#tu-kacho"/g) || []).length >= 2);
  }
});

test('ningún texto afirma precios, cifras, plazos, disponibilidad continua ni integraciones activas', () => {
  const prohibido = /\$\s?\d|\d+\s?%|\bMXN\b|24\/7|24 horas|las 24|en minutos|en \d+ (días|horas|semanas)|garantiza|aumenta tus ventas|más ventas|se integra con|integrado con|ya se conecta|clientes como/i;
  for (const [, t] of textos) {
    const texto = visible(html(t.slug));
    assert.doesNotMatch(texto, prohibido, texto.match(prohibido)?.[0]);
  }
});

test('el texto cabe en el presupuesto y la mitad o más es propia del giro', async () => {
  for (const [, t] of textos) {
    const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
    await page.goto(`${base}/giros/${t.slug}.html`);
    const { total, propias } = await page.evaluate(() => {
      const palabras = el => el ? el.innerText.trim().split(/\s+/).filter(Boolean).length : 0;
      const propios = ['.giro-hero h1', '.giro-respuesta', '.giro-chat', '.giro-preguntas', '.giro-solicitud', '.giro-entrega-cierre', '.giro-faq-lista', '.giro-llamado'];
      return { total: palabras(document.body), propias: propios.reduce((n, s) => n + palabras(document.querySelector(s)), 0) };
    });
    await page.close();
    assert.ok(total >= 400 && total <= 700, `${total} palabras visibles`);
    assert.ok(propias / total >= 0.5, `${propias} de ${total} palabras son propias del giro`);
  }
});

test('se ve en celular y escritorio sin desbordarse, sin recursos rotos ni externos', async () => {
  for (const [, t] of textos) for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport:{ width, height:900 } });
    const externos = [], rotos = [], errores = [];
    page.on('request', r => { if (!r.url().startsWith(base)) externos.push(r.url()); });
    page.on('response', r => { if (r.status() >= 400) rotos.push(r.url()); });
    page.on('pageerror', e => errores.push(e.message));
    await page.goto(`${base}/giros/${t.slug}.html`, { waitUntil:'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await page.close();
    assert.equal(desborde, 0, `se desborda ${desborde}px a ${width}px`);
    assert.deepEqual([externos, rotos, errores], [[], [], []]);
  }
});
