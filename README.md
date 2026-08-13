# nutricalc

Calcul des apports journaliers recommandés d'un adulte : énergie,
macronutriments et micronutriments (références ANSES).

⚠️ Outil informatif — ne remplace pas un avis médical ou diététique. Les
références micronutriments sont indicatives (voir [DESIGN.md](DESIGN.md)).

## Démarrage

L'environnement est géré par Nix + direnv (comme
[countdown](https://github.com/etrobert/countdown)) : `node`, `pnpm` et
`python` viennent du devShell du flake, pas d'installation globale.

```sh
direnv allow        # ou : nix develop
```

## App web (racine)

```sh
pnpm install
pnpm dev            # serveur de dev Vite
pnpm test           # tests Vitest
pnpm build          # build de production dans dist/
```

## POC Python (`poc/`)

```sh
cd poc
pytest -q           # tests
python -m nutricalc # démo sur un profil synthétique
```

## Build/CI via Nix

`nix build .#default` construit **et teste le POC Python** (pytest). L'app web
se construit avec `pnpm` dans le devShell ; la CI enchaîne les deux (voir
[DESIGN.md](DESIGN.md)).

```sh
nix build .#default --print-build-logs
```

## Structure

- `src/` — app web (React + Vite), logique de calcul dans `src/calc/`.
- `poc/` — proof of concept Python (mêmes formules).
- `DESIGN.md` — spécification (formules, sources, limites, architecture).
- `FEATURES.md` — état d'avancement.

## Licence

Usage personnel. Références nutritionnelles : ANSES.
