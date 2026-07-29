# Handoff — Travaux en attente (session du 2026-07-29)

État des lieux au moment de la passation, et instructions exactes pour la suite.

## Contexte

- Repo : `kimi-code/` (https://github.com/fusengine/kimi-code), branche `main`, tag `v1.0.6`.
- Migration claude-plugins → Kimi terminée et publiée (24 plugins, hooks natifs, MCP, installateur, benchmark, statusline daemon).
- **Gate APEX** : cette session-ci ne peut pas écrire dans `scripts/lib/**/*.ts` (le gate freshness exige `explore-codebase` + `research-expert` sous 120 s ; ces profils ne sont découverts qu'au démarrage, et la découverte d'agents custom est web-only en CLI 0.29.x). Dans une session où le gate est actif, soit `/plugins disable fusengine` temporairement, soit jouer le jeu APEX (les agents seront découverts si le CLI les supporte).
- Les hooks customs de l'utilisateur (`~/.kimi-code/config.toml`) sont **commentés** (backup : `config.toml.bak-hooks`) — à restaurer à la fin.
- `kimi-code/scripts/tests/gate-probe.test.mts` : artefact de test (105 lignes) créé pour vérifier le dégatage — **à supprimer**.

## 1. Agents en symlinks (édits prêts, à appliquer)

### 1a. `scripts/lib/install/agents-targets.ts` — durcir `sourceRoot`

La fonction actuelle utilise `existsSync(managed)` seul. Remplacer par : le chemin managed ne gagne QUE s'il contient ≥1 plugin avec manifeste :

```ts
import { existsSync, readdirSync } from "node:fs";

/** Managed plugin copy when it holds ≥1 real plugin (manifest present), else the repo's plugins dir. */
export function sourceRoot(ctx: InstallContext): { root: string; managed: boolean } {
	const managed = join(ctx.kimiHome, "plugins", "managed", "fusengine", "plugins");
	const hasPlugins = existsSync(managed)
		&& readdirSync(managed).some((d) => existsSync(join(managed, d, "kimi.plugin.json")));
	return hasPlugins ? { root: managed, managed: true } : { root: ctx.pluginsRoot, managed: false };
}
```

### 1b. `scripts/lib/install/agents-install.ts` — réécriture complète

Remplacer tout le fichier par la version symlink (voir le contenu validé dans l'historique de session ou demander à agent-4) : `installAgents` matérialise via **symlink** quand `sourceRoot().managed === true` (liens vers la copie gérée — mises à jour automatiques à chaque `/plugins install`), **copie** sinon ; supprime les entrées possédées devenues orphelines (dangling) ; ne touche jamais un fichier non possédé (tracking `.fusengine-agents.json`).

Test attendu : `bun test scripts/tests/install.test.mts` → 7/7 (le test "global hooks block is removed" crée un managed vide — le durcissement 1a garde le mode copie).

## 2. UI clack pour l'installeur (parité Claude)

- `@clack/prompts ^1.7.0` déjà déclaré dans `package.json` ; `setup.sh` fait déjà `bun install`.
- `scripts/lib/install/ui.ts` : dual-mode — TTY → clack (`p.intro`, `p.note`, `p.outro`, spinners), non-TTY → console actuelle (ne rien casser des tests).
- Import **dynamique** de `@clack/prompts` (tests sans node_modules).
- `mcp-key-prompt.ts` : TTY → `p.note` (liste des clés manquantes) puis `p.text` par clé (placeholder = `apiKeyUrl`), `p.isCancel` géré ; non-TTY → buffer pipé existant (`stdin-lines.ts`).

## 3. Sélection des serveurs MCP (clés filtrées sur la sélection)

Flow Claude : sélection d'abord, clés ensuite.

1. Nouvelle étape `selectMcpServers` (avant `promptMcpKeys`) : TTY → `p.multiselect` sur le catalogue (`scripts/mcp/mcp.json`, `initialValues` = serveurs `default: true`) ; non-TTY → tous, ou liste via env `FUSENGINE_MCP_SERVERS="a,b,c"`.
2. Stocker dans `ctx.mcpSelection: Set<string> | undefined` (champ déjà ajouté à `InstallContext` dans `src/interfaces/installer.ts`).
3. `missingKeys` (mcp-key-prompt) et `scanMcpServers` (mcp-resolve) filtrent sur `ctx.mcpSelection` quand défini.
4. Test : fixture avec 1 serveur `default:false` — sélection env restreinte → serveur non installé, sa clé non demandée.

## 4. Statusline native (0.30.0)

- Script natif déjà posé et testé : `~/.kimi-code/bin/statusline-native.mjs` + `[status_line] command` dans `tui.toml` (activé dès que le CLI ≥ 0.30.0, brew n'a pas encore la 0.30).
- **À porter dans le repo** : copier le script dans `plugins/core-guards/statusline/bin/statusline-native.mjs`, ajouter une étape installateur qui le déploie dans `~/.kimi-code/bin/` + écrit la section `[status_line]` dans `tui.toml` (idempotent), doc `plugins/core-guards/statusline/README.md` mise à jour (section native vs daemon).

## 5. Release

1. Supprimer `scripts/tests/gate-probe.test.mts`.
2. `bun test scripts/tests/` tout vert + `bun run scripts/validate.ts` (24/24 + root manifest).
3. Bump `package.json` → `1.0.7` + `bun run scripts/build-root-manifest.ts` + entrée CHANGELOG.
4. Branche `feat/...` → commit → push → PR → merge `--merge --delete-branch` → tag `v1.0.7` → `gh release create v1.0.7`.
5. Restaurer les hooks customs : `cp ~/.kimi-code/config.toml.bak-hooks ~/.kimi-code/config.toml`.

## Divers en suspens

- `plugins/solid/skills/solid-generic/SKILL.md` ligne 17 : `TeamCreate` restant (à mapper → `AgentSwarm` — ajouter la règle au scrub ou corriger à la main + core-overrides).
- Hooks upstream (0.1.86+) : `PROTECTED_FRAGMENTS` sans `.kimi-code`, `claudeHome()` en dur, `readPluginMeta` sans `kimi.plugin.json`, pas de `kimiInit`.
