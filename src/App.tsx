// Coquille de l'application : navigation par 3 onglets (état React, pas de
// routeur) et orchestration de l'état partagé.
//
// - « Objectifs » : saisie du profil + choix de l'objectif via 7 fiches en cartes.
// - « Repas » : SAISIE de la journée (cf. MealEditor).
// - « Comptes rendus » : AJR cibles (cf. TargetReport) + analyse de la journée
//   (cf. DayAnalysis), avec état vide si aucun repas.
//
// L'état profil et l'état « journée » (hook useMeals) vivent ici pour être
// PARTAGÉS entre onglets et PERSISTER (le démontage d'un onglet ne les perd pas).
// La logique de calcul (dailyReport, etc.) est inchangée.
import { useEffect, useMemo, useState } from "react";
import { dailyReport } from "./calc/report";
import {
  NUTRITION_PROFILES,
  type NutritionGoal,
  type Profile,
  type Sex,
} from "./calc/profile";
import { OBJECTIVE_INFO } from "./objectiveInfo";
import { useMeals } from "./useMeals";
import { MealEditor } from "./MealEditor";
import { TargetReport } from "./TargetReport";
import { DayAnalysis } from "./DayAnalysis";

const GOAL_KEYS = Object.keys(NUTRITION_PROFILES) as NutritionGoal[];

// Onglets de l'application (ordre d'affichage).
type Tab = "objectifs" | "repas" | "comptes";
const TABS: { id: Tab; label: string }[] = [
  { id: "objectifs", label: "Objectifs" },
  { id: "repas", label: "Repas" },
  { id: "comptes", label: "Comptes rendus" },
];
const TAB_KEY = "nutricalc:tab";

function loadTab(): Tab {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(TAB_KEY);
    if (raw && TABS.some((t) => t.id === raw)) return raw as Tab;
  } catch {
    // stockage indisponible : onglet par défaut.
  }
  return "objectifs";
}

function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{props.label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          value={props.value}
          min={props.min}
          max={props.max}
          onChange={(e) => props.onChange(Number(e.target.value))}
        />
        <span className="text-slate-400">{props.unit}</span>
      </div>
    </label>
  );
}

// Fiche d'un objectif : cliquer la carte sélectionne l'objectif. La carte
// sélectionnée est mise en évidence (bordure/fond emerald). Contenu éditorial
// (5 rubriques) issu de objectiveInfo.ts.
function ObjectiveCard({
  goal,
  selected,
  onSelect,
}: {
  goal: NutritionGoal;
  selected: boolean;
  onSelect: () => void;
}) {
  const profile = NUTRITION_PROFILES[goal];
  const info = OBJECTIVE_INFO[goal];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        "flex flex-col rounded-2xl border p-5 text-left shadow-sm transition " +
        (selected
          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className={"text-base font-semibold " + (selected ? "text-emerald-800" : "text-slate-800")}>
          {profile.label}
        </span>
        {selected && (
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
            Sélectionné
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-slate-500">{profile.description}</p>

      <dl className="mt-3 space-y-2 text-xs leading-relaxed">
        <div>
          <dt className="font-semibold text-emerald-700">Pour qui / quand</dt>
          <dd className="text-slate-600">{info.forWhom}</dd>
        </div>
        <div>
          <dt className="font-semibold text-emerald-700">Précautions</dt>
          <dd className="text-slate-600">{info.precautions}</dd>
        </div>
        <div>
          <dt className="font-semibold text-emerald-700">Persona</dt>
          <dd className="text-slate-600">{info.persona}</dd>
        </div>
        <div>
          <dt className="font-semibold text-emerald-700">Ce que ça implique</dt>
          <dd className="text-slate-600">{info.implication}</dd>
        </div>
        <div>
          <dt className="font-semibold text-emerald-700">Source(s)</dt>
          <dd className="text-slate-400">{info.sources}</dd>
        </div>
      </dl>
    </button>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>(loadTab);
  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(TAB_KEY, tab);
    } catch {
      // stockage indisponible : on ignore.
    }
  }, [tab]);

  const [profile, setProfile] = useState<Profile>({
    sex: "female",
    ageYears: 35,
    weightKg: 65,
    targetWeightKg: 65,
    heightCm: 168,
    goal: "active",
  });

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  // État « journée » partagé entre « Repas » (saisie) et « Comptes rendus »
  // (analyse) : même journée, même bibliothèque, même persistance localStorage.
  const meals = useMeals();

  const result = useMemo(() => {
    try {
      return { report: dailyReport(profile), error: null as string | null };
    } catch (e) {
      return { report: null, error: e instanceof Error ? e.message : "Entrée invalide" };
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">nutricalc</h1>
          <p className="mt-1 text-slate-600">
            Apports journaliers recommandés selon votre profil et votre objectif — énergie,
            macronutriments et micronutriments (références ANSES).
          </p>
        </header>

        {/* Barre d'onglets (état React, sans routeur). */}
        <nav className="mb-8 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition " +
                (tab === t.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50")
              }
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* --- Onglet Objectifs : profil + fiches d'objectif --- */}
        {tab === "objectifs" && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Profil</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Sexe</span>
                  <div className="flex gap-2">
                    {(["female", "male"] as Sex[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("sex", s)}
                        className={
                          "flex-1 rounded-lg border px-3 py-2 " +
                          (profile.sex === s
                            ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-700"
                            : "border-slate-300 text-slate-600 hover:bg-slate-50")
                        }
                      >
                        {s === "female" ? "Femme" : "Homme"}
                      </button>
                    ))}
                  </div>
                </label>

                <NumberField label="Âge" value={profile.ageYears} min={18} max={120} unit="ans"
                  onChange={(v) => set("ageYears", v)} />
                <NumberField label="Poids actuel" value={profile.weightKg} min={1} max={400} unit="kg"
                  onChange={(v) => set("weightKg", v)} />
                <NumberField label="Poids cible" value={profile.targetWeightKg} min={1} max={400} unit="kg"
                  onChange={(v) => set("targetWeightKg", v)} />
                <NumberField label="Taille" value={profile.heightCm} min={1} max={260} unit="cm"
                  onChange={(v) => set("heightCm", v)} />
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-1 text-lg font-semibold">Objectif nutritionnel</h2>
              <p className="mb-4 text-sm text-slate-500">
                Choisissez la fiche qui vous correspond : elle détermine l'ajustement
                calorique et les ratios de macronutriments utilisés dans « Comptes rendus ».
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {GOAL_KEYS.map((g) => (
                  <ObjectiveCard
                    key={g}
                    goal={g}
                    selected={profile.goal === g}
                    onSelect={() => set("goal", g)}
                  />
                ))}
              </div>

              <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-600">Références &amp; limites.</span>{" "}
                Les ratios g/kg et ajustements caloriques de chaque fiche sont des repères
                INDICATIFS (extrapolation produit à partir de la littérature — cf. commentaires
                de <code>profile.ts</code>), pas des seuils officiels. Les sources citées
                (ANSES, FAO/OMS, ISSN/ACSM) documentent la démarche mais n'en valident pas les
                valeurs exactes. Cet outil est informatif et ne remplace pas l'avis d'un
                professionnel de santé ou de la nutrition.
              </p>
            </section>
          </>
        )}

        {/* --- Onglet Repas : saisie pure --- */}
        {tab === "repas" && <MealEditor meals={meals} />}

        {/* --- Onglet Comptes rendus : AJR cibles + analyse de la journée --- */}
        {tab === "comptes" && (
          <div className="space-y-6">
            {result.error ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{result.error}</p>
            ) : (
              result.report && (
                <>
                  <TargetReport report={result.report} />
                  <DayAnalysis
                    day={meals.day}
                    hasMeals={meals.meals.length > 0}
                    target={{
                      proteinG: result.report.macros.protein.grams,
                      lipidG: result.report.macros.lipid.grams,
                      carbG: result.report.macros.carb.grams,
                      kcal: result.report.energyKcal,
                    }}
                    muscleTargets={result.report.muscleTargets}
                    filters={meals.filters}
                    onAddSuggestedFood={meals.addSuggestedFood}
                  />
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
