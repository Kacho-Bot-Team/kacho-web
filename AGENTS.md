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

## Linear (tareas del equipo)

> Esta sección es **igual en los tres repos** (`kacho`, `kacho-web` y `kacho-interno`). Si la cambias en uno,
> cámbiala en los tres. La guía para personas (las 10 áreas, proyectos y tareas) está en
> `kacho-interno/docs/LINEAR.md`.

Workspace **Kacho**, equipo **Kacho**. Los tickets tienen la forma `KAC-12`.

**Conexión.** `.mcp.json` declara el MCP oficial de Linear (`https://mcp.linear.app/mcp`). Ese servidor lo
hospeda Linear; en tu máquina no corre nada. La primera vez, en Claude Code, corre `/mcp` y entra **con tu propia
cuenta**: así cada acción en Linear queda a nombre de quien la hizo. Para Codex o Cursor, ver
https://linear.app/docs/mcp. Nunca guardes llaves de Linear en el repo, ni uses la de otra persona.

**Los estados se mueven solos.** La integración GitHub ↔ Linear liga la rama o el PR con el ticket cuando llevan
su ID, y mueve el estado: rama → en curso, PR → en revisión, merge → hecho. **No muevas estados a mano**,
salvo para marcar algo como bloqueado o cancelado.

**Al empezar un trabajo:**

1. Busca si ya hay un ticket (por título y área) antes de crear uno. Nada de duplicados.
2. Si no existe y el trabajo es de más de una hora, o lo pidió alguien, créalo:
   - **un área** de las 10 de `LINEAR.md`;
   - un responsable;
   - qué se entrega.
   Un proyecto lleva además su «Terminado cuando…».
3. Trabaja en una rama `nombre/KAC-12-tema` sacada de un `main` **recién actualizado**: `git switch main &&
   git pull`, y después `git switch -c nombre/KAC-12-tema`. El ID en la rama es lo que liga todo.

Al abrir una sesión de Claude Code, `.claude/hooks/estado-git.sh` te avisa si `main` o tu rama están atrás
de GitHub, si tu rama ya se mergeó o si tienes cambios sin commit. Si todo está al día, no dice nada.

**Mientras trabajas:**

- Las decisiones importantes se anotan como **comentario en el ticket**: qué se decidió, por qué y con el
  enlace al PR o al ADR.
- Si aparece trabajo nuevo, va en **otro ticket**, ligado al actual. No se agranda el que estás haciendo.
- Si algo te bloquea, márcalo como bloqueado y di en el ticket qué falta y de quién depende.
- **Antes de abrir el PR**, o si tu rama ya lleva más de un día, trae lo nuevo de `main`:
  `git fetch && git merge origin/main`. Si hay conflicto, lo resuelves tú en tu rama, que sabes qué querías.

**Nunca:**

- pegar en Linear secretos, tokens ni datos de clientes;
- borrar tickets;
- reasignar trabajo de otra persona sin preguntarle;
- subir directo a `main`, o hacer `push --force` en una rama que alguien más usa.

**Herramientas nuevas.** Cada herramienta que se conecte a los agentes se documenta aquí, con la misma
estructura: cómo se conecta, cuándo se usa y qué no se hace.
