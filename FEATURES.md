# nutricalc — features

## Fait

- [x] Scaffold repo (Nix flake, direnv, CI GitHub Actions, docs).
- [x] Modèle de profil avec validation (adulte 18-120 ans).
- [x] Énergie : BMR Mifflin-St Jeor + TDEE par niveau d'activité.
- [x] Macronutriments : protéines (0,83 g/kg), lipides (37,5 % AET), glucides.
- [x] Micronutriments : table de références ANSES (18 nutriments) par sexe.
- [x] Découpage protéines → 9 acides aminés indispensables (FAO/OMS, mg/kg).
- [x] Découpage lipides → familles d'acides gras (ANSES : AGS, oléique,
      linoléique ω-6, ALA/EPA/DHA ω-3), en % AET et mg.
- [x] Découpage glucides → fibres (AS), sucres totaux (limite), sucres
      libres/ajoutés (objectif OMS), en g/j et % AET.
- [x] POC Python (`poc/`) : calcul + rendu texte + démo CLI, tests pytest.
- [x] App web (racine) : Vite + React + TS + Tailwind ; logique de calcul
      portée en TypeScript (`src/calc/`), UI formulaire → rapport, tests Vitest.
- [x] `nix build .#default` construit et teste POC + web (contrat de la CI).

## À venir

- [ ] Modulation des références par tranche d'âge.
- [ ] Grossesse / allaitement.
- [ ] Comparaison d'un apport saisi aux références (barres de couverture %).
- [ ] Déploiement (module NixOS + Caddy, comme countdown).

## Idées

- Suggestions d'aliments couvrant les carences.
- Export du rapport (PDF / partage).
