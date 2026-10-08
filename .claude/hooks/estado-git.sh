#!/usr/bin/env bash
# Al abrir (o retomar) una sesión de Claude Code: ¿estás trabajando sobre lo más nuevo?
#
# Hace `git fetch` y avisa si `main` o tu rama están atrás de origin/main, si tu
# rama ya se mergeó (GitHub la borró) o si hay cambios sin commit. Si todo está
# al día, no dice nada. NUNCA bloquea la sesión: cualquier falla termina en
# silencio. Las reglas que acompaña están en AGENTS.md § Linear (KAC-46).

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# El fetch no puede colgar la sesión: sin preguntas de usuario y con corte por
# lentitud. El hook además tiene su propio timeout en .claude/settings.json.
red_ok=1
GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=5" \
  git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 fetch --quiet --prune origin >/dev/null 2>&1 || red_ok=0

git rev-parse --verify --quiet refs/remotes/origin/main >/dev/null || exit 0

avisos=()
rama=$(git symbolic-ref --quiet --short HEAD 2>/dev/null)

# 1. El main local.
if git rev-parse --verify --quiet refs/heads/main >/dev/null; then
  atras=$(git rev-list --count main..origin/main 2>/dev/null || echo 0)
  if [ "$atras" -gt 0 ]; then
    if [ "$rama" = "main" ]; then
      avisos+=("Tu main está $atras commit(s) atrás de origin/main. Antes de empezar: git pull")
    else
      avisos+=("Tu main local está $atras commit(s) atrás de origin/main. La próxima rama sácala después de: git switch main && git pull")
    fi
  fi
fi

# 2. La rama de trabajo.
if [ -n "$rama" ] && [ "$rama" != "main" ]; then
  rastreo=$(git for-each-ref --format='%(upstream:track)' "refs/heads/$rama" 2>/dev/null)
  if [ "$rastreo" = "[gone]" ]; then
    # Los repos borran la rama al mergear: si ya no está en GitHub, casi seguro entró.
    avisos+=("Tu rama $rama ya no existe en GitHub: lo más probable es que ya se mergeó. Cambia a main: git switch main && git pull")
  else
    atras=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
    if [ "$atras" -gt 0 ]; then
      avisos+=("Tu rama $rama está $atras commit(s) atrás de origin/main. Antes de abrir o actualizar su PR: git fetch && git merge origin/main")
    fi
  fi
fi

# Todo al día: silencio.
[ "${#avisos[@]}" -eq 0 ] && exit 0

cambios=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
[ "$cambios" -gt 0 ] && avisos+=("Tienes $cambios archivo(s) con cambios sin commit: guárdalos (commit o stash) antes de actualizar.")
[ "$red_ok" -eq 0 ] && avisos+=("No pude consultar GitHub (¿sin red?): esto compara contra la última copia que bajaste.")

texto="Estado de git al abrir la sesión ($(basename "$PWD")):"
for a in "${avisos[@]}"; do
  texto="$texto
- $a"
done

# JSON a mano (sin jq ni python): basta con escapar \, " y los saltos de línea.
esc() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | awk 'BEGIN { ORS = "" } NR > 1 { print "\\n" } { print }'; }
para_ti=$(esc "$texto")
para_el_agente=$(esc "$texto

Antes de trabajar, díselo a la persona y ofrécele actualizar con esos comandos, sin perder cambios sin commit.")
printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$para_ti" "$para_el_agente"
exit 0
