# kachobot.com

Sitio de Kacho: diez especialistas de venta por WhatsApp, uno por giro.
HTML, CSS y JavaScript estáticos, sin compilación ni dependencias.

Este repo es público y solo contiene lo que ya sirve el sitio. La marca, la propuesta, el hosting y la bitácora del equipo viven en el repo privado `kacho-interno`.

## Abrir en local

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory public
```

Abrir http://127.0.0.1:8080/. Con `file://` no carga `giros.json`.

## Cómo se publica

Vercel está conectado a este repo:

- **Cada rama y cada PR** generan un preview con su propia URL; Vercel la comenta en el PR.
- **Lo que se mergea a `main`** sale a producción en kachobot.com.

`vercel.json` sirve `public/` tal cual, y `.vercelignore` sube solo `public/` y `vercel.json`.

## Cómo trabajamos

`main` está protegida: no acepta push directo ni force-push, y no se puede borrar.

1. Cada cambio va en una rama `nombre/KAC-12-tema` con su Pull Request. El ID de Linear en el nombre liga ticket y código.
2. Antes de mergear, otro del equipo revisa el preview y aprueba. Merge con squash; la rama se borra sola.
3. Ningún secreto entra al repo (`.env`, tokens, llaves). Este repo es público: lo que se sube, cualquiera lo ve.
4. Lo interno (precios, clientes, propuesta, notas) va a `kacho-interno`, nunca aquí.

## Derechos

El código y el arte de Kacho no tienen licencia abierta: todos los derechos reservados. La tipografía Instrument Sans se distribuye bajo la SIL Open Font License; ver `OFL-instrument-sans.txt`.
