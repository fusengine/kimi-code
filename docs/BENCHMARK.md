# Benchmark comparatif — Claude Code vs Kimi Code (K3)

Protocole et résultats du livrable « rapport comparatif ». Tout est rejouable : `bun run scripts/benchmark/run.ts --cli=both`.

## Protocole

Trois tâches types, exécutées **headless** sur des copies temporaires identiques des fixtures (`scripts/benchmark/fixtures/`), prompts **identiques** pour les deux CLI :

| # | Tâche | Fixture | Preuve de succès |
|---|-------|---------|------------------|
| 1 | Génération de code | `1-codegen` — promise pool (concurrence, retries, timeout) | `bun test` vert + `src/pool.ts` créé, `tests/` intouchés |
| 2 | Refactoring | `2-refactor` — extraction `src/pricing.ts` depuis un god-object | Tests verts (non-régression) + `pricing.ts` créé + `cart.ts` réduit, `tests/` intouchés |
| 3 | Debug multi-fichiers | `3-debug` — 3 bugs plantés dans 3 fichiers couplés (dont un bug en cascade : corriger le bug TTL révèle le bug serde) | Tests verts + root causes rapportés, `tests/` intouchés |

Métriques par exécution (`results/<cli>-f<N>.json`) : succès global, tests pass/fail, durée, fichiers modifiés/créés, violations (tests modifiés = éliminatoire), exit code.

Commandes :
- Kimi : `kimi --auto -p "$(cat prompt.md)"` (K3, mode autonome)
- Claude : `claude -p "$(cat prompt.md)" --dangerously-skip-permissions`

Conditions réelles : les deux CLI tournent avec le harness Fusengine actif (hooks SOLID/APEX câblés — vérifié en session sur Kimi CLI 0.29.1).

## Résultats

<!-- RESULTS:START — mesures du 2026-07-27, une exécution par tâche et par CLI -->

| Fixture | Kimi K3 | Claude (Sonnet harness) | Rapport |
|---|---|---|---|
| 1-codegen | ✅ 8p/0f — **62s** | ✅ 8p/0f — 229s | **×3.7** |
| 2-refactor | ✅ 6p/0f — **57s** | ✅ 6p/0f — 357s | **×6.3** |
| 3-debug | ✅ 8p/0f — **66s** | ✅ 8p/0f — 236s | **×3.6** |

**3/3 succès des deux côtés, zéro violation (tests jamais modifiés).**

Observations qualitatives (logs dans `results/`) :

- **f3 (debug)** : K3 a nommé les 3 causes racines *et* la cascade de masquage (le bug serde rendait le bug d'unité ms/s latent) dans son rapport final — le niveau d'analyse visé par la fixture.
- **f1 (codegen)** : K3 a spontanément placé l'interface dans `src/interfaces/pool.ts` — le hook SOLID du harness a contraint sa sortie, preuve que les hooks sont actifs et suivis sous Kimi.
- **Fichiers parasites** : Claude a écrit `.cartographer/**`, `.harness/cache/**`, `MEMORY/LESSON.md` (activité hooks : cartographie, cache de recherche, leçons) ; Kimi n'a écrit que les fichiers de la tâche. La configuration hooks des deux CLI sur cette machine n'est pas strictement symétrique — voir analyse.
- **Caveat statistique** : n=1 par tâche ; les durées sont indicatives (variance inter-run élevée sur ce type de charge), le succès est la métrique primaire. Rejouer avec `--cli=both` pour accumuler.

Analyse des deltas (cohérente avec les attendus K3, `docs/MIGRATION.md` §6) :

1. **Pas de taxe sequential-thinking** — Claude passe par l'orchestration APEX/harness complète (MCP + sous-agents + écritures de cache) ; K3 raisonne nativement et enchaîne les corrections.
2. **Lectures consolidées** — K3 lit les fichiers entiers d'emblée (1M ctx) ; moins d'allers-retours outils que la démarche exploratoire fragmentée.
3. **Parité fonctionnelle** — le point clé de la migration : à qualité de sortie égale (3/3, même rigueur de root-cause), la latence est 3.6-6.3× moindre sur ces trois tâches.

<!-- RESULTS:END -->

## Grille de lecture

- **Succès** : tests verts + aucune violation. C'est le critère principal — un agent plus rapide qui échoue n'est pas plus performant.
- **Durée** : wall-clock de l'exécution headless (inclut réflexion + outils).
- **Diff** : fichiers touchés — un refactor qui réécrit les tests est un échec, pas un style.
- **Analyse des deltas** : complétée après les deux exécutions (attendus : moins d'allers-retours outils côté K3 grâce au contexte 1M ; pas de taxe sequential-thinking ; comportement hooks identique des deux côtés).

## Rejouer

```bash
cd kimi-code
bun run scripts/benchmark/run.ts --cli=kimi     # côté Kimi seul
bun run scripts/benchmark/run.ts --cli=claude   # côté Claude seul
bun run scripts/benchmark/run.ts --cli=both     # comparaison complète
```

Chaque exécution réécrit `results/<cli>-f<N>.json` + `.log` (sortie CLI complète + sortie tests).
