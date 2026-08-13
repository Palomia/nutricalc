# nutricalc

Calcul des apports journaliers recommandés d'un adulte : énergie,
macronutriments et micronutriments (références ANSES).

⚠️ Outil informatif — ne remplace pas un avis médical ou diététique. Les
références micronutriments sont indicatives (voir [DESIGN.md](DESIGN.md)).

## Démarrage

L'environnement est géré par Nix + direnv (comme
[countdown](https://github.com/etrobert/countdown)).

```sh
direnv allow        # ou : nix develop
```

## POC Python

```sh
cd poc
pytest -q           # tests
python -m nutricalc # démo sur un profil synthétique
```

Ou via Nix, ce qui construit le POC et lance les tests (contrat de la CI) :

```sh
nix build .#default --print-build-logs
```

## Structure

- `poc/` — proof of concept Python (logique de calcul + tests).
- `DESIGN.md` — spécification (formules, sources, limites, architecture).
- `FEATURES.md` — état d'avancement.
- `web/` — app web (React + Vite), phase à venir.

## Licence

Usage personnel. Références nutritionnelles : ANSES.
