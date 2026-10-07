# kachobot.com

Sitio de Kacho: diez especialistas de venta por WhatsApp, uno por giro.
HTML, CSS y JavaScript estáticos, sin compilación ni dependencias.
Las dependencias de desarrollo se usan únicamente para las pruebas.

Este repo es público y solo contiene lo que ya sirve el sitio. La marca, la propuesta, el hosting y la bitácora del equipo viven en el repo privado `kacho-interno`.

## Abrir en local

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory public
```

Abrir http://127.0.0.1:8080/. Con `file://` no carga `giros.json`.

## Demos y configuración pública

La sección de series incluye ocho ejemplos interactivos: conversación, imágenes,
notas de voz, carrusel, llamadas, mensajes programados, seguimiento y tablero.
Se recorren dentro de un mockup de celular con interfaz de WhatsApp; las llamadas
tienen su propia pantalla y el tablero se presenta como un reporte compartido.
Son guiones y datos ilustrativos; no llaman a proveedores ni envían mensajes.
La personalización muestra nombre, color y logo en el navegador. El logo no se
sube ni se conserva al recargar. La sección de valor muestra un proceso real de
venta de pasto sintético de forma anónima y una proyección ilustrativa fija,
separada del caso. No publica cifras de clientes ni resultados atribuidos.

`public/product-config.js` concentra únicamente configuración apta para publicación:

- `demoNumbers`: número autorizado de cada especialista, con lada, solo dígitos.
  `null` mantiene deshabilitada esa prueba. No existe un número de respaldo compartido.
- `contact`: destino comercial de la solicitud, separado de los números de demo.
- `pricing`: tarifas aprobadas de puesta en marcha y mensualidad, en MXN.
  `null` muestra «A cotizar»; nunca se calcula una tarifa a partir de los servicios elegidos.

Abrir un enlace de WhatsApp no prueba una respuesta del bot ni recepción humana.
Antes de activar un número público, verificar la conversación completa con ese especialista.
No colocar tokens, credenciales, costos internos ni información de clientes en la configuración.

## Verificar los cambios

Con Node.js y Playwright 1.58.2 con Chromium disponibles:

```sh
pnpm check
pnpm test
```

`package.json` y `pnpm-lock.yaml` fijan la dependencia de pruebas. Las pruebas
levantan y cierran su propio servidor local; no requieren modificar el puerto de una preview.
Cubren los diez giros, avance y reinicio, acciones de las ocho demos, personalización,
solicitud y descarga, enlaces por especialista y tamaños de 320 a 1440 px.
Los números de prueba solo se inyectan en el navegador del test y nunca se abren.
Esta suite no verifica bots reales, Safari ni dispositivos físicos.

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
