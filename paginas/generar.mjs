// Genera public/giros/<slug>.html desde public/giros.json + paginas/textos-giros.json.
// Uso: pnpm run giros. Sin dependencias: Vercel sigue publicando public/ sin build,
// así que las páginas generadas se versionan junto con sus fuentes.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paginaGiro } from './plantilla-giro.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => readFileSync(join(raiz, ruta), 'utf8');

export function generar() {
  const giros = JSON.parse(leer('public/giros.json'));
  const textos = Object.fromEntries(
    Object.entries(JSON.parse(leer('paginas/textos-giros.json'))).filter(([id]) => !id.startsWith('_')),
  );
  // Mientras la home lleve noindex (hasta KAC-17), las páginas por giro también.
  const robots = leer('public/index.html').match(/<meta name="robots"[^>]*>/)?.[0] ?? '';
  const contacto = leer('public/product-config.js').match(/email:\s*'([^']+)'/)?.[1];
  if (!contacto) throw new Error('No encontré el correo de contacto en public/product-config.js');
  const hayIndice = existsSync(join(raiz, 'public/giros.html'));
  const paginas = Object.fromEntries(Object.entries(textos).map(([id, t]) => [id, t.slug]));

  return Object.entries(textos).map(([id, t]) => {
    const giro = giros.find((g) => g.id === id);
    if (!giro) throw new Error(`«${id}» está en textos-giros.json pero no en public/giros.json`);
    return {
      ruta: `public/giros/${t.slug}.html`,
      html: paginaGiro({ giro, textos: t, giros, paginas, robots, contacto, hayIndice }),
    };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(join(raiz, 'public/giros'), { recursive: true });
  for (const { ruta, html } of generar()) {
    writeFileSync(join(raiz, ruta), html);
    console.log(ruta);
  }
}
