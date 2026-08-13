# nutricalc — features

## Fait

- [x] Scaffold repo (Nix flake, direnv, CI GitHub Actions, docs).
- [x] Modèle de profil avec validation (adulte 18-120 ans).
- [x] Énergie : BMR Mifflin-St Jeor + TDEE par niveau d'activité.
- [x] Macronutriments : protéines (0,83 g/kg), lipides (37,5 % AET), glucides.
- [x] Micronutriments : table de références ANSES (18 nutriments) par sexe.
- [x] Rapport journalier assemblé + rendu texte (démo CLI).
- [x] Suite de tests pytest, câblée dans `nix build` via `doCheck`.

## À venir

- [ ] App web : saisie du profil + affichage du rapport.
- [ ] Modulation des références par tranche d'âge.
- [ ] Grossesse / allaitement.
- [ ] Export du rapport (PDF / partage).

## Idées

- Comparer un apport saisi aux références (barres de couverture %).
- Suggestions d'aliments couvrant les carences.
