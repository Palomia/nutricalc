// Analyse de la journée saisie (onglet « Comptes rendus », partie basse).
//
// À partir de la journée partagée (`day`) et des cibles issues du profil, affiche
// la couverture apport/cible, l'analyse anabolique (score musculaire, acide
// aminé limitant, leucine par repas) et des suggestions d'aliments. La logique
// de calcul (intake / aminoAcids / suggestions) est INCHANGÉE : ce composant ne
// fait que présenter les résultats.
import { useMemo, type ReactNode } from "react";
import { dayMacros, type Day, type MacroIntake } from "./calc/intake";
import {
  analyzeMuscleProfile,
  type LeucineLevel,
  type MuscleAnalysis,
  type MuscleBand,
  type MuscleTargets,
} from "./calc/aminoAcids";
import { suggestFoods, type FoodSuggestion } from "./calc/suggestions";
import type { FoodFilter } from "./calc/food";

// Cible de comparaison, en valeurs absolues journalières.
export interface MacroGoal {
  proteinG: number;
  lipidG: number;
  carbG: number;
  kcal: number;
}

const round = (n: number) => Math.round(n);
const one = (n: number) => Math.round(n * 10) / 10;

function MacroPills({ m }: { m: MacroIntake }) {
  return (
    <span className="tabular-nums text-slate-500">
      {round(m.kcal)} kcal · P {round(m.proteinG)} · L {round(m.lipidG)} · G {round(m.carbG)} (g)
    </span>
  );
}

function CoverageRow(props: { label: string; bar: string; consumed: number; target: number; unit: string }) {
  const { label, bar, consumed, target, unit } = props;
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-slate-500">
          {round(consumed)} / {round(target)} {unit}
          <span className={"ml-2 " + (pct > 105 ? "text-amber-600" : "text-slate-400")}>
            {round(pct)} %
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={"h-full rounded-full " + bar} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// --- Analyse anabolique ---

const BAND_LABEL: Record<MuscleBand, string> = {
  excellent: "Optimisation quasi complète",
  tresBon: "Très bon profil musculaire",
  correct: "Correct mais améliorable",
  limitant: "Plusieurs facteurs limitants",
};

const BAND_STYLE: Record<MuscleBand, { text: string; bar: string; ring: string }> = {
  excellent: { text: "text-emerald-700", bar: "bg-emerald-500", ring: "border-emerald-200 bg-emerald-50" },
  tresBon: { text: "text-sky-700", bar: "bg-sky-500", ring: "border-sky-200 bg-sky-50" },
  correct: { text: "text-amber-700", bar: "bg-amber-500", ring: "border-amber-200 bg-amber-50" },
  limitant: { text: "text-red-700", bar: "bg-red-500", ring: "border-red-200 bg-red-50" },
};

const LEUCINE_STYLE: Record<LeucineLevel, { label: string; cls: string }> = {
  faible: { label: "pauvre en leucine", cls: "text-red-600" },
  min: { label: "minimum atteint", cls: "text-amber-600" },
  optimal: { label: "optimal", cls: "text-sky-600" },
  excellent: { label: "excellent", cls: "text-emerald-600" },
};

// Infobulle pédagogique locale (contenu UI seulement, sans effet sur le calcul).
interface InfoTipContent {
  intro: string;
  sections: { heading: string; items: string[] }[];
}

function InfoTip({ label, tip }: { label: string; tip: InfoTipContent }) {
  return (
    <span
      tabIndex={0}
      role="button"
      aria-label={label}
      className="group/tip relative inline-flex cursor-help items-center align-middle"
    >
      <span aria-hidden className="text-xs text-slate-400">ⓘ</span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-72 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs normal-case leading-relaxed tracking-normal text-slate-600 shadow-lg group-hover/tip:block group-focus-within/tip:block"
      >
        <p className="mb-2 font-medium text-slate-800">{tip.intro}</p>
        {tip.sections.map((s, i) => (
          <div key={s.heading}>
            <p className="font-semibold text-emerald-700">{s.heading}</p>
            <ul className={(i < tip.sections.length - 1 ? "mb-2 " : "") + "ml-4 list-disc"}>
              {s.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </span>
  );
}

// Explication de la « leucine anabolique » : pourquoi viser des pics répartis.
const LEUCINE_ANABOLIC_TIP: InfoTipContent = {
  intro:
    "La leucine est l'acide aminé qui « déclenche » la synthèse des protéines musculaires (MPS) après un repas.",
  sections: [
    {
      heading: "Un seuil à atteindre par repas",
      items: [
        "Il faut ~2 à 3 g de leucine (optimal ~2,5 g) et ~25 à 40 g de protéines dans une même prise pour déclencher un pic anabolique.",
        "En dessous du seuil, la MPS n'est stimulée que partiellement.",
      ],
    },
    {
      heading: "Pourquoi répartir les pics",
      items: [
        "Viser 3 à 5 pics dans la journée relance la MPS plusieurs fois.",
        "À quantité totale de protéines égale, c'est plus favorable à la construction musculaire qu'un seul gros apport.",
      ],
    },
    {
      heading: "À garder en tête",
      items: [
        "Ce raisonnement est PAR REPAS, distinct de la couverture JOURNALIÈRE des besoins en leucine.",
        "Un total journalier élevé ne garantit pas que chaque prise atteigne le seuil.",
        "Repères indicatifs (physiologie du sport), pas une prescription.",
      ],
    },
  ],
};

// Encart « Origine animale vs végétale » : pourquoi l'outil n'accorde AUCUNE
// prime à l'origine animale (la qualité est déjà captée par l'AA limitant).
const ANIMAL_VS_PLANT_TIP: InfoTipContent = {
  intro:
    "Animal ou végétal : à apports équilibrés, l'écart de « qualité » protéique est faible et déjà pris en compte ailleurs dans l'outil.",
  sections: [
    {
      heading: "L'écart, en pratique",
      items: [
        "Les protéines animales sont en moyenne un peu mieux digérées et plus riches en leucine (indices DIAAS/PDCAAS plus élevés).",
        "Végétales variées et suffisantes en lysine (légumineuses + céréales), l'écart s'efface largement.",
      ],
    },
    {
      heading: "Pourquoi aucune prime animale",
      items: [
        "L'acide aminé limitant mesure déjà la couverture réelle en AAE de la journée.",
        "Classer les sources animales « au-dessus » ferait donc doublon et introduirait un biais.",
        "Repères indicatifs (DIAAS/FAO), pas une prescription.",
      ],
    },
  ],
};

// Explication du sous-score « Leucine (seuil/repas) » du score musculaire :
// pourquoi il diffère de la couverture JOURNALIÈRE de la leucine et peut rester
// bas malgré un total journalier élevé.
const LEUCINE_SUBSCORE_TIP: InfoTipContent = {
  intro:
    "Ce sous-score compte le NOMBRE de prises atteignant le seuil anabolique (~2,5 g de leucine), pas la couverture journalière.",
  sections: [
    {
      heading: "Comment il est calculé",
      items: [
        "On compte les repas dont la leucine atteint ~2,5 g.",
        "On divise par le nombre de prises anaboliques visées (dérivé du besoin protéique journalier, borné à 3-7).",
        "Plafonné à 100 %, il pèse 20 % de la note finale.",
      ],
    },
    {
      heading: "Pourquoi il peut rester bas",
      items: [
        "Un total journalier élevé (ex. 287 % des besoins) ne suffit pas s'il est concentré sur peu de prises.",
        "Répartir la leucine sur davantage de repas atteignant ~2,5 g relève ce sous-score.",
      ],
    },
  ],
};

// Ligne sous-score du score musculaire (part pondérée, 0-1).
// `tip` optionnel : ⓘ pédagogique affiché juste après le libellé.
function SubScore({
  label,
  value,
  weight,
  tip,
}: {
  label: ReactNode;
  value: number;
  weight: number;
  tip?: InfoTipContent;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="inline-flex w-40 shrink-0 items-center gap-1 whitespace-nowrap text-slate-500">
        {label}
        {tip && <InfoTip label="En savoir plus sur ce sous-score" tip={tip} />}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-400" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="w-24 shrink-0 text-right tabular-nums text-slate-400">
        {round(value * 100)} % · {round(weight * 100)} %
      </span>
    </div>
  );
}

function MuscleAnalysisPanel({ analysis }: { analysis: MuscleAnalysis }) {
  const { score, limiting, distribution, aminoAcids } = analysis;
  const style = BAND_STYLE[score.band];
  return (
    <div className="mt-6 space-y-4">
      {/* Score de construction musculaire */}
      <div className={"rounded-xl border p-4 " + style.ring}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Score de construction musculaire
            </p>
            <p className={"mt-1 text-sm font-semibold " + style.text}>{BAND_LABEL[score.band]}</p>
          </div>
          <p className={"text-3xl font-bold tabular-nums " + style.text}>
            {round(score.total)}
            <span className="text-base font-normal text-slate-400"> / 100</span>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
          <div className={"h-full rounded-full " + style.bar} style={{ width: `${score.total}%` }} />
        </div>
        <div className="mt-3 space-y-1">
          <SubScore label="Protéines" value={score.proteinScore} weight={0.3} />
          <SubScore label="Couverture AAE" value={score.aaeScore} weight={0.25} />
          <SubScore label="Leucine (seuil/repas)" value={score.leucineScore} weight={0.2} tip={LEUCINE_SUBSCORE_TIP} />
          <SubScore label="Calories" value={score.calorieScore} weight={0.15} />
          <SubScore label="Répartition" value={score.distributionScore} weight={0.1} />
        </div>
        <p className="mt-2 text-right text-[10px] text-slate-400">score · poids dans la note</p>
      </div>

      {/* Acide aminé limitant */}
      {limiting ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Acide aminé limitant
          </p>
          <p className="mt-1 text-sm">
            <span className="font-semibold text-slate-800">{limiting.name}</span>
            {" — couverture "}
            <span className={limiting.coverage < 1 ? "font-semibold text-amber-600" : "font-semibold text-emerald-600"}>
              {round(limiting.coverage * 100)} %
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Le potentiel anabolique de la journée est plafonné par cet acide aminé
            (le moins couvert). Diversifiez les sources protéiques pour le relever.
          </p>
          <details className="group mt-2">
            <summary className="cursor-pointer text-xs text-slate-600 hover:underline">
              Couverture journalière des 9 acides aminés indispensables
            </summary>
            <div className="mt-2 space-y-1">
              {[...aminoAcids].sort((a, b) => a.coverage - b.coverage).map((c) => (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  <span className="w-52 shrink-0 truncate text-slate-600" title={c.name}>{c.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={"h-full rounded-full " + (c.coverage < 1 ? "bg-amber-400" : "bg-emerald-400")}
                      style={{ width: `${Math.min(c.coverage * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right tabular-nums text-slate-500">{round(c.coverage * 100)} %</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Objectifs = minimums OMS × facteur sportif du profil.
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Couverture journalière = apport du jour ÷ besoin ; elle peut dépasser
              100 %. À ne pas confondre avec le sous-score « Leucine (seuil/repas) »
              du score, qui compte le nombre de prises atteignant ~2,5 g de leucine
              (plafonné à 100 %).
            </p>
          </details>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          Ajoutez des aliments riches en protéines pour analyser la couverture des
          acides aminés et l'acide aminé limitant.
        </div>
      )}

      {/* Origine animale vs végétale : encart pédagogique. */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Origine animale vs végétale
          <InfoTip label="En savoir plus sur l'origine des protéines" tip={ANIMAL_VS_PLANT_TIP} />
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          En moyenne, les protéines animales sont un peu mieux valorisées
          (meilleure digestibilité, plus de leucine). Mais avec de bons apports en
          lysine et des sources variées et équilibrées, cet écart s'efface. Comme
          l'outil évalue déjà l'acide aminé limitant, aucune prime n'est accordée à
          l'origine animale.
        </p>
        <p className="mt-1 text-[10px] text-slate-400">Repères indicatifs (DIAAS/FAO).</p>
      </div>

      {/* Leucine et distribution par repas */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Leucine et répartition par repas
            <InfoTip label="En savoir plus sur la leucine et les pics anaboliques" tip={LEUCINE_ANABOLIC_TIP} />
          </span>
          <span className={"text-xs font-medium " + (distribution.bonus ? "text-emerald-600" : "text-slate-400")}>
            {distribution.peaks} pic{distribution.peaks > 1 ? "s" : ""} anabolique{distribution.peaks > 1 ? "s" : ""}
            {distribution.bonus ? " · bonus 3-5 ✓" : ""}
          </span>
        </div>
        <div className="space-y-1">
          {distribution.meals.map((mm, i) => {
            const leu = LEUCINE_STYLE[mm.leucineLevel];
            return (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 py-1 text-sm">
                <span className="truncate text-slate-600">
                  {mm.name}
                  {mm.isAnabolicPeak && <span className="ml-1 text-emerald-500" title="Pic anabolique (≥ 25 g)">●</span>}
                </span>
                <span className="tabular-nums text-slate-500">
                  {one(mm.totalProteinG)} g protéines · leucine {one(mm.leucineG)} g
                  <span className={"ml-2 " + leu.cls}>{leu.label}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Cible : 25-40 g de protéines par prise et ≥ 2 g de leucine
          (optimal 2,5 g). 3 à 5 pics anaboliques dans la journée = bonus.
        </p>
      </div>
    </div>
  );
}

// Suggestions pour compléter la journée. Liste sobre d'aliments recommandés avec
// leur raison ; bouton « + Ajouter » pour insérer l'aliment (100 g) dans le repas
// « Suggestions » de la journée.
function SuggestionsPanel({
  suggestions,
  onAdd,
}: {
  suggestions: FoodSuggestion[];
  onAdd: (foodId: string) => void;
}) {
  return (
    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
        Suggestions pour compléter la journée
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Aliments qui amélioreraient le mieux la journée en cours (relèvent l'acide
        aminé limitant, comblent le déficit protéique). Respectent les filtres de régime.
      </p>
      <ul className="mt-3 space-y-1.5">
        {suggestions.map((s) => (
          <li
            key={s.food.id}
            className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-sm"
          >
            <span className="font-medium text-slate-700">{s.food.name}</span>
            <span className="truncate text-xs text-slate-500">— {s.reason}</span>
            <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-400" title="Pour 100 g">
              {round(s.food.kcalPer100g)} kcal · P {one(s.food.proteinPer100g)}
            </span>
            <button
              type="button"
              onClick={() => onAdd(s.food.id)}
              className="shrink-0 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
              title="Ajouter 100 g au repas « Suggestions »"
            >
              + Ajouter
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DayAnalysis(props: {
  day: Day;
  hasMeals: boolean;
  target?: MacroGoal;
  muscleTargets?: MuscleTargets;
  filters: FoodFilter;
  onAddSuggestedFood: (foodId: string) => void;
}) {
  const { day, hasMeals, target, muscleTargets, filters, onAddSuggestedFood } = props;

  const total = useMemo(() => dayMacros(day), [day]);
  const analysis = useMemo(
    () => (muscleTargets ? analyzeMuscleProfile(day, muscleTargets) : null),
    [day, muscleTargets],
  );
  // Aliments qui complètent le mieux la journée (respecte les filtres de régime
  // actifs et, si fournie, la cible macro). Vide sans cibles musculaires.
  const suggestions = useMemo(
    () =>
      muscleTargets
        ? suggestFoods(day, muscleTargets, { filter: filters, macroGoal: target, limit: 4 })
        : [],
    [day, muscleTargets, filters, target],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Analyse de la journée</h2>

      {!hasMeals ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
          <p className="text-sm font-medium text-slate-600">Aucun repas saisi pour l'instant.</p>
          <p className="mt-1 text-sm text-slate-500">
            Rendez-vous dans l'onglet « Repas » pour construire votre journée : l'analyse
            de couverture des cibles et le score anabolique s'afficheront ici.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-800">Total de la journée</span>
              <MacroPills m={total} />
            </div>

            {target && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Couverture de la cible
                </p>
                <CoverageRow label="Énergie" bar="bg-emerald-500" consumed={total.kcal} target={target.kcal} unit="kcal" />
                <CoverageRow label="Protéines" bar="bg-sky-500" consumed={total.proteinG} target={target.proteinG} unit="g" />
                <CoverageRow label="Lipides" bar="bg-amber-500" consumed={total.lipidG} target={target.lipidG} unit="g" />
                <CoverageRow label="Glucides" bar="bg-emerald-500" consumed={total.carbG} target={target.carbG} unit="g" />
              </div>
            )}
          </div>

          {analysis && <MuscleAnalysisPanel analysis={analysis} />}

          {muscleTargets && suggestions.length > 0 && (
            <SuggestionsPanel suggestions={suggestions} onAdd={onAddSuggestedFood} />
          )}

          <p className="mt-4 text-xs text-slate-400">
            Analyse anabolique et scores : extrapolations produit, pas des
            recommandations officielles. Outil informatif — ne remplace pas un avis diététique.
          </p>
        </>
      )}
    </section>
  );
}
