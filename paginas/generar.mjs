// Genera public/giros/<slug>.html desde public/giros.json + paginas/textos-giros.json, y
// public/alternativa-a/<slug>.html desde paginas/textos-comparativas.json (KAC-58).
// Uso: pnpm run giros. Sin dependencias: Vercel sigue publicando public/ sin build,
// así que las páginas generadas se versionan junto con sus fuentes.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paginaGiro } from './plantilla-giro.mjs';
import { paginaComparativa } from './plantilla-comparativa.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => readFileSync(join(raiz, ruta), 'utf8');

const sinNotas = (ruta) => Object.fromEntries(Object.entries(JSON.parse(leer(ruta))).filter(([id]) => !id.startsWith('_')));

/** Lo que comparten todas las páginas generadas: los giros, el robots de la home y el correo de contacto. */
function comun() {
  const giros = JSON.parse(leer('public/giros.json'));
  const textos = sinNotas('paginas/textos-giros.json');
  // Mientras la home lleve noindex (hasta KAC-17), las páginas generadas también.
  const robots = leer('public/index.html').match(/<meta name="robots"[^>]*>/)?.[0] ?? '';
  const contacto = leer('public/product-config.js').match(/email:\s*'([^']+)'/)?.[1];
  if (!contacto) throw new Error('No encontré el correo de contacto en public/product-config.js');
  const paginas = Object.fromEntries(Object.entries(textos).map(([id, t]) => [id, t.slug]));
  return { giros, textos, robots, contacto, paginas };
}

export function generar() {
  const { giros, textos, robots, contacto, paginas } = comun();
  const hayIndice = existsSync(join(raiz, 'public/giros.html'));

  return Object.entries(textos).map(([id, t]) => {
    const giro = giros.find((g) => g.id === id);
    if (!giro) throw new Error(`«${id}» está en textos-giros.json pero no en public/giros.json`);
    return {
      ruta: `public/giros/${t.slug}.html`,
      html: paginaGiro({ giro, textos: t, giros, paginas, robots, contacto, hayIndice }),
    };
  });
}

export function generarComparativas() {
  const { giros, robots, contacto, paginas } = comun();
  return Object.entries(sinNotas('paginas/textos-comparativas.json')).map(([slug, t]) => {
    for (const id of t.especialistas) if (!giros.some((g) => g.id === id)) throw new Error(`«${id}» no está en public/giros.json`);
    return { ruta: `public/alternativa-a/${slug}.html`, html: paginaComparativa({ slug, textos: t, giros, paginas, robots, contacto }) };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(join(raiz, 'public/giros'), { recursive: true });
  mkdirSync(join(raiz, 'public/alternativa-a'), { recursive: true });
  for (const { ruta, html } of [...generar(), ...generarComparativas()]) {
    writeFileSync(join(raiz, ruta), html);
    console.log(ruta);
  }
}
