# Migration Claude Code → Kimi Code (K3) — Analyse architecturale

Date: 2026-07-27 · Source: `claude-plugins/` (25 plugins, 196 skills, 43 agents, 34 commands, 21 hooks.json) · Cible: `kimi-code/` pour Kimi K3 (`kimi-code/k3`, 1 048 576 tokens de contexte, `always_thinking`, vision `image_in`/`video_in` native — valeurs issues de la config officielle).

## 1. Ce que le template Claude faisait (et pourquoi)

Extrait de `claude-rules/templates/CLAUDE.md.template` :

| Mécanisme Claude | Fonction | Traitement K3 |
|---|---|---|
| Note de troncature ~2 KB sur `additionalContext` | Contourner la perte silencieuse des règles réinjectées par hooks | **Supprimé** — Kimi délivre le contexte hooks intégralement aux événements documentés |
| `mcp__sequential-thinking` OBLIGATOIRE avant tout raisonnement multi-étapes | Forcer le chain-of-thought externe | **Rétrogradé optionnel** — K3 raisonne nativement (`always_thinking`) ; gardé uniquement pour décisions à branches |
| TeamCreate / mailbox / mtime-polling (`TaskCreate`, `SendMessage`) | Coordination d'équipes Claude avec notifications asynchrones | **Remplacé** par `Agent` / `AgentSwarm` / tâches background Kimi (notifications de complétion natives, `TaskStop`) |
| Prompts fragmentés + rappels répétés (2 KB) | Survivre à la troncature | **Consolidé** — instructions uniques dans `AGENTS.md` global + règles 00-08 fusionnées entre fences à l'install (1M tokens) |
| Vision via encodeur externe / MCP screenshots | Analyser les rendus UI | **Vision native** — règle ajoutée : screenshot AVANT tout diagnostic visuel (`browser_screenshot` → lecture directe) |
| `model: sonnet/opus` par agent | Router vers des modèles différents | **Supprimé** — Kimi ignore le champ ; les sous-agents héritent du modèle principal (K3 partout) |

Conservés à l'identique (c'est le cœur agentique) : APEX 6 phases + gate eLicit/Verify, exit contract (Stop/Retry/Rollback/Ask/Escalate), challenger adversarial (verdict CONFIRMED/REFUTED/UNCERTAIN), sniper 7 phases + Fix Retry Loop 3 cycles, scope ladder, two-speed communication, verification chain fuse-browser→Context7→Exa.

## 2. Mapping des formats

| Claude | Kimi | Conversion |
|---|---|---|
| `.claude-plugin/plugin.json` | `kimi.plugin.json` | champs conservés ; `skills`/`commands`/`hooks` ajoutés ; `interface{}` synthétisé |
| `agents/*.md` (frontmatter `model,color,tools,skills`) | `agents/*.md` (`name,description,whenToUse,tools`) | `model`/`color`/`skills` supprimés ; `Task`→`Agent`, `WebFetch`→`FetchURL` dans tools et corps |
| `skills/*/SKILL.md` (`version,references,related-skills,user-invocable`) | `SKILL.md` (`name,description`) | frontmatter réduit aux 2 champs documentés ; corps verbatim ; `references/` copiées |
| `commands/*.md` | `commands/*.md` | **verbatim** — format compatible (`$ARGUMENTS`) |
| `hooks/hooks.json` (objet par événement) | `hooks[]` inline dans `kimi.plugin.json` | mapping événements ci-dessous ; commandes → shim |
| MCP : `mcp.json.bak` par plugin | `~/.kimi-code/mcp.json` (fusion à marqueurs par l'installateur) | jamais dans le manifeste (simple propriétaire, pas de double démarrage) |
| marketplace `fusengine-plugins` | `marketplace.json` `{version:"2", plugins:[{id,displayName,source}]}` | régénéré à l'install |

## 3. Mapping des événements hooks (quasi identitaire — mieux que Codex)

Identité : `SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, SubagentStart, SubagentStop, Stop, SessionEnd, PermissionRequest, PreCompact, PostCompact, PostToolUseFailure, Notification` (Kimi supporte nativement les 4 derniers, que Codex devait collapser).

Collapses résiduels (Claude-only) : `InstructionsLoaded→SessionStart` · `TeammateIdle→SubagentStop` · `TaskCompleted→Notification` (matcher `task.completed`).

Matchers : `Task→Agent`, `WebFetch→FetchURL`, `MultiEdit→Edit` ; `Read|Grep|Glob|Write|Edit|Bash|mcp__*` inchangés.

Bloquants Kimi : `UserPromptSubmit`, `PreToolUse`, `Stop` — identiques à Claude. Contrat stdin/stdout quasi identique (`hook_event_name`, `tool_input`, exit 2 = blocage via stderr).

## 4. Le harness reste le moteur — avec l'adapter kimi NATIF (v0.1.83+)

Tous les hooks Claude funnellent vers `@fusengine/harness`. La version npm 0.1.83 embarque un **adapter `kimi` natif** (`dist/adapters/kimi/`) qui lit directement `KIMI_CODE_HOME` / `KIMI_PLUGIN_ROOT` et émet les réponses au format Kimi (texte brut pour l'injection de contexte, JSON `hookSpecificOutput.permissionDecision` pour les blocages). Chaque hook Kimi invoque donc `scripts/kimi-hook-shim.mjs <scope>`, un pont minimal : résolution du binaire sous `$KIMI_CODE_HOME/node_modules`, forwarding stdin verbatim, propagation de l'exit code, fail-open. Aucun mapping d'env n'est nécessaire — l'adapter natif lit les variables Kimi lui-même. Vérifié en live sur les 65 règles : comportement identique à l'adapter claude-code sur 64, différence justifiée sur 1 (§5).

Note historique : la première itération du shim appelait `hook claude-code` avec un mapping `KIMI_*→CLAUDE_*` ; la découverte de l'adapter natif (0.1.83) a simplifié le shim à ~40 lignes.

## 5. Régressions connues et acceptées

| Régression | Impact | Mitigation |
|---|---|---|
| `type:"prompt"` hook (core-guards Stop, vérification APEX par LLM) supprimé — Kimi ne supporte que `command` | 1 hook sur ~60 | Noté au rapport de migration ; réimplémentable côté harness en scope dédié |
| Champ `model` des agents perdu | Les sous-agents tournent tous en K3 | Accepté : K3 uniforme > routage sonnet/opus ; `model_preference` (expérimental) disponible plus tard |
| Champ `skills` du frontmatter agents perdu | Association agent→skill | Préservée dans le corps des agents (références nommées) |
| Événements Claude-only collapsés | `TeammateIdle`/`TaskCompleted`/`InstructionsLoaded` | Mapping documenté §3 |
| `core-guards` UserPromptSubmit (scope `core`) : n'injecte plus le system prompt legacy | Sous Claude, ce hook ré-injectait CLAUDE.md (workaround de la troncature 2 Ko) ; l'adapter kimi natif ne lit aucun fichier de prompt | Correct-by-design sous Kimi : `$KIMI_CODE_HOME/AGENTS.md` est chargé nativement à chaque session + `kimi-rules` ré-injecte les règles 00-08 à chaque prompt. Aucune perte fonctionnelle |
| Découverte des skills de plugin | Nécessite `/plugins install` (pas de scan de dossier) | Installateur rend le chemin explicite + marketplace.json |

## 6. Gains attendus pour K3

1. **Moins d'appels fragmentés** : briefs consolidés + lectures de fichiers entiers (1M ctx) au lieu de slice-and-dice — mesuré au benchmark (durée, étapes).
2. **Pas de taxe sequential-thinking** : le raisonnement natif supprime un aller-retour MCP obligatoire par décision.
3. **Vision native** : diagnostic visuel direct (design/SEO/debug UI) sans pipeline d'encodage externe.
4. **Fidélité hooks ≥ Claude** : Kimi supporte nativement des événements que Codex collapait (`PostToolUseFailure`, `SessionEnd`, `Notification`) — le câblage est plus fidèle que le portage Codex.
5. **Template ~2× plus concis** : K3 suit mieux des instructions claires non verbeuses ; la note de troncature et les répétitions associées disparaissent.

## 7. Protocole de mesure

Voir `docs/BENCHMARK.md` — 3 tâches (génération, refactoring, debug multi-fichiers) exécutées headless sur les deux CLI (`kimi -p` / `claude -p --dangerously-skip-permissions`), métriques : tests verts, durée, fichiers touchés, violations (tests modifiés).
