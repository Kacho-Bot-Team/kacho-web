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
    assert.equal(await page.locator('#demo-whatsapp-pending').isDisabled(), true);
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

test('nombre y logo locales se aplican a la marca y llegan a la solicitud', async () => {
  const page = await pageAt();
  await page.locator('#brand-company').fill('Constructora <Juanito>');
  assert.equal(await page.locator('#brand-preview-name').textContent(), 'Constructora <Juanito>');
  assert.equal(await page.locator('#brand-preview-name juanito').count(), 0);
  await page.locator('#brand-logo-input').setInputFiles({ name:'logo.svg', mimeType:'image/svg+xml', buffer:Buffer.from('<svg/>') });
  assert.match(await page.locator('#brand-upload-status').textContent(), /PNG|JPG|WebP/);
  await page.locator('#brand-use').click();
  assert.equal(await page.locator('#company').inputValue(), 'Constructora <Juanito>');
  await page.locator('#request-form button[type="submit"]').click();
  assert.match(await page.locator('#request-summary').textContent(), /Constructora <Juanito>/);
  await page.close();
});

test('demos y personalización caben en móvil y respetan reducir movimiento', async () => {
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

test('el logo válido se muestra localmente y puede retirarse', async () => {
  const page = await pageAt();
  const requests = [];
  page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('blob:')) requests.push(request.url()); });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
  await page.locator('#brand-logo-input').setInputFiles({ name:'mi-logo.png', mimeType:'image/png', buffer:png });
  await page.waitForFunction(() => document.querySelector('[data-logo-slot] img')?.naturalWidth > 0);
  assert.equal(await page.locator('[data-logo-slot] img').count(), 2);
  await page.locator('[data-brand-color="salvia"]').click();
  assert.equal(await page.locator('#brand-preview').getAttribute('data-color'), 'salvia');
  await page.locator('#brand-logo-remove').click();
  assert.equal(await page.locator('[data-logo-slot] img').count(), 0);
  assert.deepEqual(requests, []);
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
  assert.equal(await page.locator('#demo-whatsapp-pending').isDisabled(), true);
  await page.close();
});

test('la solicitud conserva los servicios seleccionados y se descarga sin enviarse', async () => {
  const page = await pageAt(390);
  await page.locator('.service-picker input[value="Llamadas"]').check();
  await page.locator('#company').fill('Empresa de prueba');
  await page.locator('#request-form button[type="submit"]').click();
  assert.match(await page.locator('#request-summary').textContent(), /Servicios de interés:.*Llamadas/);
  assert.match(await page.locator('#result-state').textContent(), /no se ha enviado/);
  const downloaded = page.waitForEvent('download');
  await page.locator('#download-request').click();
  const file = await downloaded;
  assert.equal(file.suggestedFilename(), 'solicitud-demo-kacho.txt');
  const content = await readFile(await file.path(), 'utf8');
  assert.match(content, /Empresa de prueba/);
  assert.match(content, /Llamadas/);
  await page.locator('#edit-request').click();
  assert.equal(await page.locator('#company').inputValue(), 'Empresa de prueba');
  await page.close();
});

test('cambiar servicios invalida el resumen anterior para no pedir una propuesta incompleta', async () => {
  const page = await pageAt();
  await page.locator('#company').fill('Mi empresa');
  await page.locator('#request-form button[type="submit"]').click();
  await page.locator('.service-picker input[value="Llamadas"]').check();
  assert.equal(await page.locator('#request-result').isVisible(), false);
  await page.locator('#request-form button[type="submit"]').click();
  assert.match(await page.locator('#request-summary').textContent(), /Llamadas/);
  await page.close();
});

test('la identidad de la solicitud cambia solo al aplicar la vista previa', async () => {
  const page = await pageAt();
  await page.locator('#brand-company').fill('Empresa A');
  await page.locator('#brand-use').click();
  await page.locator('#brand-company').fill('Empresa B');
  await page.locator('#request-form button[type="submit"]').click();
  const summary = await page.locator('#request-summary').textContent();
  assert.match(summary, /Identidad: Empresa A/);
  assert.doesNotMatch(summary, /Empresa B/);
  await page.close();
});

test('el selector del hero conserva el giro al recargar y el menú móvil cierra con Escape', async () => {
  const page = await pageAt(390);
  await page.locator('#casting-next').click();
  await page.waitForFunction(() => window.__kacho.sector === 'construccion');
  assert.equal(await page.locator('#hero-character').getAttribute('src'), 'assets/construccion.webp');
  assert.match(page.url(), /giro=construccion/);
  await page.reload();
  await page.waitForFunction(() => window.__kacho?.sector === 'construccion');
  assert.equal(await page.locator('#chat-name').textContent(), 'Kacho Obra');
  await page.locator('#menu-toggle').click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'false');
  await page.close();
});
