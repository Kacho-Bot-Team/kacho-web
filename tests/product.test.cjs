const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

let browser, server, base;
before(async () => {
  const root = path.resolve(__dirname, '../public');
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

async function pageAt(width = 1440) {
  const page = await browser.newPage({ viewport:{ width, height:1000 }, reducedMotion:'reduce' });
  await page.goto(base);
  await page.waitForFunction(() => window.__kacho?.ready);
  return page;
}

test('la página se mantiene corta: seis secciones, un presupuesto de palabras y sin recursos externos', async () => {
  const page = await browser.newPage({ viewport:{ width:1440, height:900 }, reducedMotion:'reduce' });
  const external = [], errors = [], failed = [];
  page.on('request', request => { if (!request.url().startsWith(base)) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.goto(base);
  await page.waitForFunction(() => window.__kacho?.ready);
  const metrics = await page.evaluate(() => ({
    sections: document.querySelectorAll('main > section').length,
    words: document.body.innerText.trim().split(/\s+/).length,
    screens: document.documentElement.scrollHeight / innerHeight,
    demoCta: [...document.querySelectorAll('a.button, button.button')].filter(el => /pedir demo/i.test(el.textContent)).length
  }));
  assert.equal(metrics.sections, 6, 'inicio, demo, cómo empezamos, precios, preguntas y solicitud');
  assert.ok(metrics.words <= 650, `la página visible tiene ${metrics.words} palabras; el tope es 650`);
  assert.ok(metrics.screens <= 8, `${metrics.screens.toFixed(1)} pantallas en escritorio; el tope es 8`);
  assert.ok(metrics.demoCta >= 4, 'el único CTA es «Pedir demo» y se repite en header, hero, precios y formulario');
  assert.deepEqual(external, []);
  assert.deepEqual(failed, []);
  assert.deepEqual(errors, []);
  await page.close();
});

test('cada clic agrega un mensaje y conserva el contexto de la conversación', async () => {
  const page = await pageAt();
  const first = await page.locator('#messages .message').first().textContent();
  const before = await page.locator('#messages .message').count();
  await page.locator('#advance-scene').click();
  assert.equal(await page.locator('#messages .message').count(), before + 1);
  assert.equal(await page.locator('#messages .message').first().textContent(), first);
  await page.close();
});

test('los diez especialistas mantienen la conversación y el WhatsApp sin número cerrado', async () => {
  const page = await pageAt();
  const ids = await page.locator('button[data-sector]').evaluateAll(items => items.map(item => item.dataset.sector));
  assert.equal(ids.length, 10);
  for (const id of ids) {
    await page.locator(`button[data-sector="${id}"]`).click();
    await page.waitForFunction(id => window.__kacho.sector === id, id);
    assert.equal(await page.locator('#demo-whatsapp').isVisible(), false);
    for (const scene of ['orientar', 'precio', 'asesor']) {
      await page.locator(`[data-scene="${scene}"]`).click();
      assert.equal(await page.locator('#messages .message').count(), 1);
      for (let i = 0; i < 3; i++) await page.locator('#advance-scene').click();
      assert.equal(await page.locator('#messages .message').count(), 4);
      assert.equal(await page.locator('.conversation-next').isVisible(), true);
      await page.locator('#advance-scene').click();
      assert.equal(await page.locator('#messages .message').count(), 1);
    }
  }
  await page.close();
});

test('el visitante puede recorrer las capacidades sin solicitudes a proveedores', async () => {
  const page = await pageAt();
  const external = [], errors = [];
  page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('blob:')) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  for (const feature of ['imagenes', 'voz', 'carrusel', 'llamadas', 'programados', 'seguimiento', 'tablero']) {
    await page.locator(`button[data-feature="${feature}"]`).click();
    assert.equal(await page.locator('#feature-panel').getAttribute('data-feature'), feature);
    assert.equal(await page.locator('.phone-screen').getAttribute('data-mode'), feature);
    assert.equal(await page.locator('#feature-panel button').first().isVisible(), true);
    assert.equal(await page.locator('#device-note').isVisible(), true);
    assert.equal(await page.locator('#conversation-actions').isVisible(), false);
  }
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  await page.close();
});

test('las demos caben en móvil y escritorio y respetan reducir movimiento', async () => {
  for (const width of [320, 390, 768, 1440]) {
    const page = await pageAt(width);
    for (const feature of ['conversacion', 'imagenes', 'voz', 'carrusel', 'llamadas', 'programados', 'seguimiento', 'tablero']) {
      await page.locator(`button[data-feature="${feature}"]`).click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${feature}`);
    }
    assert.equal(await page.locator('body').getAttribute('data-motion'), 'off');
    await page.close();
  }
});

test('las acciones de cada demo producen su siguiente paso y se pueden reiniciar', async () => {
  const page = await pageAt(390);
  await page.locator('button[data-feature="imagenes"]').click();
  await page.locator('[data-action="image-answer"]').click();
  assert.equal(await page.locator('#image-answer').isVisible(), true);
  assert.match(await page.locator('#image-answer').innerText(), /uso · medida · cantidad · entrega/i);
  await page.locator('button[data-feature="voz"]').click();
  await page.locator('[data-action="voice-transcript"]').click();
  assert.match(await page.locator('#voice-transcript').innerText(), /80 m²/);
  await page.locator('button[data-feature="carrusel"]').click();
  await page.locator('[data-action="next-card"]').click();
  assert.match(await page.locator('.catalog-card h4').textContent(), /madera/);
  await page.locator('[data-action="choose-card"]').click();
  assert.match(await page.locator('#catalog-selection').textContent(), /Elegiste acabado madera/);
  await page.locator('[data-action="prev-card"]').click();
  assert.match(await page.locator('.catalog-card h4').textContent(), /piedra/);
  await page.locator('button[data-feature="llamadas"]').click();
  for(let i=0;i<4;i++) await page.locator('[data-action="advance-call"]').click();
  assert.equal(await page.locator('.call-script p').count(), 4);
  assert.match(await page.locator('.call-script').textContent(), /Resumen para el equipo/);
  await page.locator('[data-action="advance-call"]').click();
  assert.equal(await page.locator('.call-script p').count(), 0);
  await page.locator('button[data-feature="programados"]').click();
  await page.locator('#schedule-time').fill('11:45');
  await page.locator('#schedule-demo button').click();
  assert.match(await page.locator('#schedule-result').textContent(), /11:45/);
  assert.match(await page.locator('#schedule-result').textContent(), /cafetería/);
  await page.locator('button[data-feature="seguimiento"]').click();
  await page.locator('[data-followup="respondio"]').click();
  assert.match(await page.locator('.followup-timeline').textContent(), /detenido/);
  await page.locator('[data-followup="asesor"]').click();
  assert.match(await page.locator('.followup-timeline').textContent(), /Tu equipo/);
  await page.locator('button[data-feature="tablero"]').click();
  await page.locator('[data-dashboard="cotizaciones"]').click();
  assert.match(await page.locator('.mini-dashboard').textContent(), /Ventas confirmadas/);
  await page.close();
});

test('cada número configurado abre su destino exacto; el resto permanece cerrado', async () => {
  const page = await browser.newPage({ reducedMotion:'reduce' });
  const config = (await readFile(path.resolve(__dirname, '../public/product-config.js'), 'utf8'))
    .replace('materiales: null', 'materiales: "12025550101"')
    .replace('construccion: null', 'construccion: "12025550102"')
    .replace('ecommerce: null', 'ecommerce: "javascript:alert(1)"');
  await page.route('**/product-config.js', route => route.fulfill({ contentType:'text/javascript', body:config }));
  await page.goto(base); await page.waitForFunction(() => window.__kacho?.ready);
  assert.equal(await page.locator('#demo-whatsapp').isVisible(), true);
  let link = new URL(await page.locator('#demo-whatsapp').getAttribute('href'));
  assert.equal(link.origin + link.pathname, 'https://wa.me/12025550101');
  assert.match(link.searchParams.get('text'), /Kacho Materiales/);
  await page.locator('button[data-sector="construccion"]').click();
  await page.waitForFunction(() => window.__kacho.sector === 'construccion');
  link = new URL(await page.locator('#demo-whatsapp').getAttribute('href'));
  assert.equal(link.pathname, '/12025550102');
  assert.match(link.searchParams.get('text'), /Kacho Obra/);
  await page.locator('button[data-sector="ecommerce"]').click();
  await page.waitForFunction(() => window.__kacho.sector === 'ecommerce');
  assert.equal(await page.locator('#demo-whatsapp').getAttribute('href'), null);
  assert.equal(await page.locator('#demo-whatsapp').isVisible(), false);
  await page.close();
});

test('la solicitud se prepara con giro y objetivo, se descarga y no se envía', async () => {
  const page = await pageAt(390);
  await page.locator('#company').fill('Empresa de prueba');
  await page.locator('input[name="goal"][value="Preparar cotizaciones"]').check();
  await page.locator('#request-form button[type="submit"]').click();
  const summary = await page.locator('#request-summary').textContent();
  assert.match(summary, /Negocio: Empresa de prueba/);
  assert.match(summary, /Giro: Materiales/);
  assert.match(summary, /Objetivo inicial: Preparar cotizaciones/);
  assert.match(await page.locator('#result-state').textContent(), /no se ha enviado/);
  assert.equal(await page.locator('#send-request').isVisible(), false, 'sin canal configurado no hay botón de envío');
  const downloaded = page.waitForEvent('download');
  await page.locator('#download-request').click();
  const file = await downloaded;
  assert.equal(file.suggestedFilename(), 'solicitud-demo-kacho.txt');
  const content = await readFile(await file.path(), 'utf8');
  assert.match(content, /Empresa de prueba/);
  await page.locator('#edit-request').click();
  assert.equal(await page.locator('#company').inputValue(), 'Empresa de prueba');
  await page.close();
});

test('el selector del hero conserva el giro al recargar; en móvil se oculta y el menú cierra con Escape', async () => {
  const page = await pageAt(1440);
  await page.locator('#casting-next').click();
  await page.waitForFunction(() => window.__kacho.sector === 'construccion');
  assert.equal(await page.locator('#hero-character').getAttribute('src'), 'assets/construccion.webp');
  assert.match(page.url(), /giro=construccion/);
  await page.reload();
  await page.waitForFunction(() => window.__kacho?.sector === 'construccion');
  assert.equal(await page.locator('#chat-name').textContent(), 'Kacho Obra');
  await page.setViewportSize({ width:390, height:844 });
  assert.equal(await page.locator('#hero-casting').isVisible(), false, 'la rueda no se muestra en móvil');
  assert.equal(await page.locator('button[data-sector]').first().isVisible(), true, 'las pestañas de giro siguen disponibles');
  await page.locator('#menu-toggle').click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'false');
  await page.close();
});
