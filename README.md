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

La página tiene siete secciones: inicio, demo, valor, cómo empezamos, precios, preguntas
y solicitud de demo. La demo recorre ocho ejemplos interactivos (conversación, imágenes,
notas de voz, carrusel, llamadas, mensajes programados, seguimiento y tablero) dentro de
un mockup de celular con interfaz de WhatsApp. Son guiones y datos ilustrativos; no llaman
a proveedores ni envían mensajes. Un solo descargo lo dice bajo el teléfono.

La sección de valor es una sola imagen SVG estática, «Antes / Con Kacho», con versión de
escritorio (`assets/valor-kacho.svg`) y de celular (`assets/valor-kacho-mobile.svg`).
Antes: 1,000 leads, 50% de atención, 27% de cotización y 18% de calificación (≈24 leads
calificados). Con Kacho y captación ampliada: 5,000 leads, 100% de atención, 30% y 20%
(300 leads calificados). Es una proyección con supuestos fijos, no una mejora medida;
la propia imagen lo dice y no publica cifras de clientes.

En octubre de 2026 (KAC-47) se retiraron el personalizador de marca, la secuencia animada
de cotización y el chat flotante: la página se sentía saturada y con demasiado texto.
Siguen en el historial de git. En móvil la rueda de giros del inicio se oculta (las
pestañas de la demo hacen lo mismo) y los tipos de respuesta se muestran como una fila
que se desliza.

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
Cubren el presupuesto de la página (seis secciones, tope de palabras y de pantallas),
los diez giros, avance y reinicio, acciones de las ocho demos, solicitud y descarga,
enlaces por especialista y tamaños de 320 a 1440 px.
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
