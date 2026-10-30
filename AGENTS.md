# kacho-web — guía para agentes

Instrucciones para cualquier agente que trabaje en este repo (Claude, Codex, Cursor). `CLAUDE.md` importa este
archivo; edita aquí, no allá.

**Este repo es PÚBLICO.** Contiene solo el sitio kachobot.com: HTML, CSS y JavaScript estáticos, sin compilación
ni dependencias. Es uno de tres repos: `kacho` (backend y docs técnicos, privado), `kacho-interno` (marca,
comercial y bitácora, privado) y este.

Otros miembros del equipo trabajan con agentes en paralelo: **revisa el estado del remoto justo antes de
reorganizar algo**. `main` está protegida: todo entra por PR, con una aprobación.

## Reglas de repo público (antes que cualquier otra)

Todo lo que se sube aquí lo puede ver y clonar cualquiera, y ya no se puede «despublicar».

1. **Cero secretos:** ni tokens, ni llaves, ni contraseñas, ni `.env`. El escaneo de secretos con bloqueo de push
   está encendido, pero solo reconoce formatos conocidos; tú eres la primera línea.
2. **Nada comercial sin lanzar:** precios, nombres de clientes, propuestas, fechas o borradores van a
   `kacho-interno` hasta que estén listos para publicarse.
3. **Sin código de servidor:** si el sitio necesita backend (rutas de API, funciones con secretos), ese código va
   en `kacho`, y el sitio solo llama a su API pública.
4. **Solo lo que sirve el sitio:** Vercel publica únicamente `public/` y `vercel.json` (ver `.vercelignore`).
   Nada de documentos internos, bitácoras ni originales de marca.

## Trabajar en el sitio

- Vista local: `python3 -m http.server 8080 --bind 127.0.0.1 --directory public` y abrir
  http://127.0.0.1:8080/. Con `file://` no carga `giros.json`.
- Cada PR genera un preview de Vercel: revísalo antes de pedir aprobación.
- `public/giros.json` (los 10 giros) también existe en `kacho/packages/ficha/plantillas/giros.json`. Mientras no
  se acuerde cuál es la fuente (ADR 0012 de `kacho`), **no se cambia uno sin el otro**.

## Qué va en cada repo

> Esta sección es **igual en los tres repos** (`kacho`, `kacho-web` y `kacho-interno`). Si la cambias en uno,
> cámbiala en los tres. La decisión de fondo es el ADR 0012 de `kacho`.

| Repo | Qué va | Qué **no** va |
|---|---|---|
| `kacho` (privado) | El motor, el código de las herramientas internas y la documentación técnica: arquitectura, ADRs, infraestructura, cuentas y accesos, roadmap | El sitio público, la marca en alta resolución, precios y propuestas |
| `kacho-web` (**público**) | Solo lo que sirve kachobot.com | Nada interno: lo que se sube ahí ya no se puede «despublicar» |
| `kacho-interno` (privado) | Marca, comercial (propuesta, precios, competidores) y equipo (la guía de Linear y la bitácora) | Código e infraestructura |

**En caso de duda:** lo técnico va a `kacho` y lo demás a `kacho-interno`. Nada va a `kacho-web` si no lo necesita
el sitio.

**Antes de crear una carpeta nueva** (en la raíz o, en `kacho`, dentro de `apps/` o `packages/`), revisa esta
tabla y di en el PR por qué va en ese repo. En `kacho`, la prueba `apps/web/tests/repos.test.ts` falla con cada
carpeta nueva hasta que se agrega a su lista en el mismo PR: así la decisión queda a la vista de quien revisa.

**Herramientas internas y Linear** (propuesta de KAC-134; falta que la acepten los tres):

- el código de una herramienta interna va en `kacho`, como `apps/presentaciones`;
- sus datos de marca, comercial o equipo se leen desde tu copia local de `kacho-interno`. No se copian a `kacho`,
  y lo que la herramienta genera no se versiona: va en su `.gitignore`;
- no se guarda en git una copia de Linear (tickets, comentarios ni documentos), en ningún repo. La fuente es
  Linear, y la copia se queda vieja apenas se guarda.

## Linear (tareas del equipo)

> Esta sección es **igual en los tres repos** (`kacho`, `kacho-web` y `kacho-interno`). Si la cambias en uno,
> cámbiala en los tres. La guía para personas (las 10 áreas, proyectos y tareas) está en
> `kacho-interno/docs/LINEAR.md`.

El equipo en Linear se llama **Kachobot**, con clave `KAC`: los tickets tienen la forma `KAC-12`. Las herramientas
lo buscan por ese nombre; con «Kacho» no lo encuentran.

**Conexión.** `.mcp.json` declara el MCP oficial de Linear (`https://mcp.linear.app/mcp`). Ese servidor lo
hospeda Linear; en tu máquina no corre nada. La primera vez, en Claude Code, corre `/mcp` y entra **con tu propia
cuenta**: así cada acción en Linear queda a nombre de quien la hizo. Para Codex o Cursor, ver
https://linear.app/docs/mcp. Nunca guardes llaves de Linear en el repo, ni uses la de otra persona. Si en tu
sesión no aparece Linear, dilo antes de empezar: sin él no ves los tickets ni el documento del equipo, y su
estado no se adivina.

**Hacia dónde vamos.** El documento de Linear «Cómo trabajamos en Kacho» dice hacia dónde vamos, lo que falta
decidir, los frentes con su líder y la ruta crítica. Léelo antes de planear o de proponer prioridades. Lo
recién decidido puede estar todavía en un PR abierto: revisa los PRs abiertos antes de dar algo por decidido o
por pendiente.

**Los estados se mueven solos.** La integración GitHub ↔ Linear liga la rama o el PR con el ticket cuando llevan
su ID, y mueve el estado: rama → en curso, PR → en revisión, merge → hecho. **No muevas estados a mano**,
salvo para marcar algo como bloqueado o cancelado.

**Al empezar un trabajo:**

1. Busca si ya hay un ticket (por título y área) antes de crear uno. Nada de duplicados.
2. Si no existe y el trabajo es de más de una hora, o lo pidió alguien, créalo:
   - **un área** de las 10 de `LINEAR.md`. Si de verdad toca dos, son dos tickets, uno por área, ligados;
   - un responsable. Sin responsable se queda en Backlog;
   - qué se entrega;
   - su proyecto, si es parte de uno.

   Un ticket lo termina una persona en 1 o 2 días; si tarda más, se parte en sub-tickets o se vuelve proyecto.
   **Urgent** es solo para la ruta crítica. Un proyecto lleva además su «Terminado cuando…».
3. Trabaja en una rama `nombre/KAC-12-tema` sacada de un `main` **recién actualizado**: `git switch main &&
   git pull`, y después `git switch -c nombre/KAC-12-tema`. El ID en la rama es lo que liga todo.

En `kacho` y `kacho-interno`, al abrir una sesión de Claude Code, `.claude/hooks/estado-git.sh` te avisa si
`main` o tu rama están atrás de GitHub, si tu rama ya se mergeó o si tienes cambios sin commit. Si todo está
al día, no dice nada. `kacho-web` no lo lleva porque es público (ver «Nunca»): ahí revisa con
`git fetch && git status`.

**Mientras trabajas:**

- Las decisiones importantes se anotan como **comentario en el ticket**: qué se decidió, por qué y con el
  enlace al PR o al ADR. Si cambian el rumbo, van también al documento «Cómo trabajamos en Kacho» y a la
  descripción del proyecto.
- Lo que todavía no aceptan los tres se escribe como **propuesta**, diciendo quién falta.
- Si aparece trabajo nuevo, va en **otro ticket**, ligado al actual. No se agranda el que estás haciendo.
- Si algo te bloquea, márcalo como bloqueado y di en el ticket qué falta y de quién depende.
- **Antes de abrir el PR**, o si tu rama ya lleva más de un día, trae lo nuevo de `main`:
  `git fetch && git merge origin/main`. Si hay conflicto, lo resuelves tú en tu rama, que sabes qué querías.
- **En la descripción del PR,** `Closes KAC-12` cierra el ticket cuando el PR se mergea; `Part of KAC-12` lo liga
  sin cerrarlo, para cuando el ticket todavía tiene trabajo pendiente.
- **Antes de subir commits a un PR**, revisa que siga abierto (`gh pr view`): aquí los PRs se mergean rápido.

**Nunca:**

- pegar en Linear secretos, tokens ni datos de clientes;
- borrar tickets;
- reasignar trabajo de otra persona sin preguntarle;
- trabajar con la cuenta de otra persona, ni con la de KachoBot, que es de la organización: tickets, commits y
  PRs salen a nombre de quien los hace;
- subir directo a `main`, o hacer `push --force` en una rama que alguien más usa;
- cambiar `.claude/` (hooks y permisos) sin un PR revisado como código, porque corre solo en la máquina de
  cada quien; ni abrir Claude Code sobre la rama de un PR de fuera sin revisar antes su `.claude/`.

**Herramientas nuevas.** Cada herramienta que se conecte a los agentes se documenta aquí, con la misma
estructura: cómo se conecta, cuándo se usa y qué no se hace.
