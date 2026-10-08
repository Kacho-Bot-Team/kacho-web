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
venta de pasto sintético de forma anónima y una sola escena SVG estática:
«Antes / Con Kacho», lado a lado también en móvil, con «Abre la llave de los leads».
El escenario inicial tiene 1,000 leads, 50% de atención, 27% de cotización y 18%
de calificación: 500 atendidos, 135 cotizaciones y 24.3 leads calificados (se muestra ≈24).
Con Kacho y captación ampliada: 5,000 leads, 100% de atención, 30% de cotización
y 20% de calificación: 5,000 atendidos, 1,500 cotizaciones y 300 leads calificados.
Las tasas iniciales son 10% menores en términos relativos (30 × 0.9 y 20 × 0.9).
Los incrementos son +4,500 atendidos, +1,365 cotizaciones y ≈+276 leads calificados.
Cada ficha equivale a cinco leads calificados, con fracción proporcional en el escenario
inicial. La comparación combina flujo, cobertura y tasas; la captación se trabaja
por separado. Es una proyección fija, no una mejora medida atribuible al bot.
La versión móvil adapta el recorrido y mantiene los mismos datos. Ambas imágenes
incluyen el personaje y la tipografía para cargarse de forma autónoma.
No publica cifras de clientes ni resultados atribuidos.

El icono flotante abre un chat genérico de Kacho con preguntas sugeridas, texto libre
y respuestas locales de ejemplo. Conserva la conversación mientras la página siga
abierta; permite minimizarla o reiniciarla y respeta reducir movimiento. No usa IA,
no envía mensajes a un proveedor ni guarda la conversación al recargar. Su interfaz
vive en `public/chat-widget.css` y `public/chat-widget.js`; `getDemoReply` concentra
las respuestas que se sustituirán al conectar el motor. Los enlaces llevan a las
secciones reales de la web; no simulan contacto con una persona.

La sección `#cotizacion-y-seguimiento` anima una consulta de 80 m²: reúne los datos,
representa una cotización y su documento, los lleva a una oportunidad en CRM y
muestra la tarea de seguimiento. `quote-flow.css` y `quote-flow.js` contienen la
escena y sus cuatro pasos. Se reproduce una sola vez al entrar en pantalla, permite
pausa/repetición y selección manual, y se detiene al salir de pantalla o cambiar de
pestaña. Con movimiento reducido o pausa global, el recorrido es manual.
El documento, el CRM y el mensaje son ilustrativos: no genera un PDF real, registra
clientes ni agenda/envía seguimientos. Los importes permanecen por confirmar.

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
solicitud y descarga, enlaces por especialista, chat flotante y tamaños de 320 a 1440 px.
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
