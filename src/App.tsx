import { useMemo, useState, type ReactNode } from "react";
import { dailyReport } from "./calc/report";
import { MealPlanner } from "./MealPlanner";
import {
  NUTRITION_PROFILES,
  type NutritionGoal,
  type Profile,
  type Sex,
} from "./calc/profile";
import type { CarbComponent, FattyAcidTarget, MacroTarget } from "./calc/macros";

const GOAL_KEYS = Object.keys(NUTRITION_PROFILES) as NutritionGoal[];

const round = (n: number) => Math.round(n);
const one = (n: number) => Math.round(n * 10) / 10;

// Ajustement calorique de l'objectif, relatif au TDEE.
function fmtAdjustment(kcal: number): string {
  if (kcal === 0) return "maintien";
  return kcal > 0 ? `surplus +${round(kcal)} kcal` : `déficit ${round(kcal)} kcal`;
}

// Ligne « fourchette » sous chaque macro : plage en grammes et ratio g/kg, ou
// mention « reste des calories » quand le profil ne fixe pas de ratio glucides.
function fmtMacroRange(t: MacroTarget): string {
  if (t.gramsMin === null || t.gramsMax === null || t.gPerKg === null)
    return "reste des calories";
  return `${round(t.gramsMin)}–${round(t.gramsMax)} g · ${t.gPerKg} g/kg`;
}

function fmtFattyAcid(fa: FattyAcidTarget): string {
  if (fa.milligrams !== null) return `${fa.milligrams} mg/j`;
  if (fa.percentAetMax !== null && fa.grams !== null && fa.gramsMax !== null)
    return `${fa.percentAet}–${fa.percentAetMax} % AET · ≈ ${round(fa.grams)}–${round(fa.gramsMax)} g`;
  const prefix = fa.kind === "limite" ? "≤ " : "";
  return `${prefix}${fa.percentAet} % AET · ≈ ${round(fa.grams ?? 0)} g`;
}

function fmtCarb(c: CarbComponent): string {
  const prefix = c.kind === "limite" ? "≤ " : c.kind === "OMS" ? "< " : "";
  const pct = c.percentAet !== null ? ` (${c.percentAet} % AET)` : "";
  return `${prefix}${round(c.grams ?? 0)} g/j${pct}`;
}

// Infobulles éducatives (contenu UI uniquement, indépendant du calcul). Chaque
// entrée est indexée sur le nom exact de la ligne (cf. macros.ts) : une intro,
// puis des sections « titre + points ». Ajouter une clé suffit pour équiper une
// nouvelle ligne de la même infobulle au survol/focus.
interface Tip {
  intro: string;
  sections: { heading: string; items: string[] }[];
}

const TIPS: Record<string, Tip> = {
  Fibres: {
    intro:
      "Viser plus de 30 g/j est excellent pour la santé, à condition d'adapter son corps en douceur.",
    sections: [
      {
        heading: "Pourquoi viser plus de 30 g ?",
        items: [
          "Améliore le transit et la digestion",
          "Aide à réguler la glycémie et le cholestérol",
          "Augmente la sensation de satiété",
        ],
      },
      {
        heading: "Augmenter sans risque",
        items: [
          "Augmentez progressivement, sur 2 à 3 semaines",
          "Buvez 1,5 à 2 L d'eau par jour pour aider les fibres à passer",
          "Légumineuses (lentilles, pois chiches), céréales complètes, fruits et légumes avec la peau",
        ],
      },
    ],
  },
  "Sucres libres / ajoutés": {
    intro:
      "L'OMS recommande de limiter les sucres libres à moins de 10 % des calories, idéalement moins de 5 %.",
    sections: [
      {
        heading: "Ce que sont les sucres libres",
        items: [
          "Sucres ajoutés lors de la fabrication ou à table",
          "Sucres du miel, des sirops et des jus de fruits",
        ],
      },
      {
        heading: "Ce qui n'en fait pas partie",
        items: [
          "Sucres des fruits entiers",
          "Lactose naturel des produits laitiers non sucrés",
        ],
      },
      {
        heading: "Comment s'en rapprocher",
        items: [
          "Sucrez moins café, thé et yaourts, votre goût s'adapte vite",
          "Remplacez les boissons sucrées et jus par de l'eau ou des infusions",
          "Gardez desserts et confiseries pour les occasions",
        ],
      },
    ],
  },
  "Acides gras saturés": {
    intro:
      "Limiter les acides gras saturés à 12 % des calories protège le cœur et les artères.",
    sections: [
      {
        heading: "Pourquoi limiter ?",
        items: [
          "Un excès élève le cholestérol LDL (« mauvais » cholestérol)",
          "Augmente le risque cardiovasculaire à long terme",
        ],
      },
      {
        heading: "Comment équilibrer",
        items: [
          "Privilégiez les huiles végétales (olive, colza) et les poissons gras",
          "Modérez beurre, crème, fromage et charcuterie",
          "Limitez les produits ultra-transformés (viennoiseries, plats industriels)",
        ],
      },
    ],
  },
  "Acide α-linolénique (ALA, ω-3)": {
    intro:
      "Les oméga-3 sont essentiels : le corps ne les fabrique pas et ils manquent souvent dans l'alimentation.",
    sections: [
      {
        heading: "Pourquoi en consommer assez ?",
        items: [
          "Soutiennent la santé cardiovasculaire",
          "Contribuent au bon fonctionnement du cerveau et de la vision",
          "Ont un effet anti-inflammatoire",
        ],
      },
      {
        heading: "Où les trouver",
        items: [
          "ALA : huiles de colza, de lin et de noix, noix",
          "EPA et DHA : poissons gras 2 fois par semaine (sardine, maquereau, saumon)",
        ],
      },
    ],
  },
};

// Infobulles des micronutriments (contenu UI, indexé sur le nom, cf. micros.ts) :
// à chaque fois un rôle, puis où en trouver — et un conseil pratique quand il
// est utile (absorption, exposition solaire, régime végétalien…).
const MICRO_TIPS: Record<string, Tip> = {
  "Vitamine C": {
    intro:
      "Antioxydant qui soutient l'immunité, la formation du collagène et l'absorption du fer d'origine végétale.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Agrumes, kiwi, fraises", "Poivron, persil, choux, légumes crus"],
      },
      {
        heading: "Bon à savoir",
        items: ["Fragile à la chaleur : privilégiez le cru ou une cuisson courte"],
      },
    ],
  },
  "Vitamine D": {
    intro:
      "Indispensable à la fixation du calcium sur l'os et au système immunitaire ; souvent insuffisante en hiver.",
    sections: [
      {
        heading: "Où en trouver",
        items: [
          "Poissons gras (saumon, hareng, sardine, maquereau)",
          "Jaune d'œuf, produits laitiers enrichis",
        ],
      },
      {
        heading: "Bon à savoir",
        items: ["La peau en fabrique au soleil ; une supplémentation hivernale est fréquente"],
      },
    ],
  },
  "Vitamine A": {
    intro: "Essentielle à la vision, à la peau et à l'immunité.",
    sections: [
      {
        heading: "Où en trouver",
        items: [
          "Foie, beurre, œufs, produits laitiers",
          "Bêta-carotène (provitamine A) : carotte, patate douce, légumes vert foncé",
        ],
      },
    ],
  },
  "Vitamine E": {
    intro: "Antioxydant qui protège les membranes des cellules.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Huiles végétales (tournesol, colza)", "Oléagineux (amandes, noisettes), germe de blé"],
      },
    ],
  },
  "Vitamine B1": {
    intro: "Thiamine : métabolisme des glucides et bon fonctionnement nerveux.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Céréales complètes, légumineuses", "Porc, oléagineux"],
      },
    ],
  },
  "Vitamine B2": {
    intro: "Riboflavine : production d'énergie, santé de la peau et des yeux.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Produits laitiers, œufs, abats", "Amandes, céréales complètes"],
      },
    ],
  },
  "Vitamine B3": {
    intro: "Niacine : métabolisme énergétique et système nerveux.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Viande, volaille, poisson", "Arachides, céréales complètes"],
      },
    ],
  },
  "Vitamine B6": {
    intro: "Métabolisme des protéines et fabrication des neurotransmetteurs.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Volaille, poisson", "Banane, pomme de terre, pois chiches"],
      },
    ],
  },
  "Vitamine B9": {
    intro:
      "Folates : renouvellement des cellules ; particulièrement importante avant et pendant la grossesse.",
    sections: [
      {
        heading: "Où en trouver",
        items: [
          "Légumes verts à feuilles (épinard, mâche, brocoli)",
          "Légumineuses, foie, agrumes",
        ],
      },
    ],
  },
  "Vitamine B12": {
    intro:
      "Formation des globules rouges et système nerveux ; présente presque uniquement dans les produits animaux.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Viande, poisson, œufs, produits laitiers"],
      },
      {
        heading: "Bon à savoir",
        items: ["En régime végétalien, une supplémentation est nécessaire"],
      },
    ],
  },
  Calcium: {
    intro: "Solidité des os et des dents, contraction musculaire, coagulation.",
    sections: [
      {
        heading: "Où en trouver",
        items: [
          "Produits laitiers",
          "Légumes verts, amandes, sardines avec arêtes, eaux riches en calcium",
        ],
      },
    ],
  },
  Fer: {
    intro:
      "Transporte l'oxygène dans le sang ; les carences sont fréquentes, surtout chez la femme réglée.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Viande rouge, boudin, abats", "Légumineuses, légumes verts, œufs"],
      },
      {
        heading: "Mieux l'absorber",
        items: [
          "Le fer animal (héminique) est mieux absorbé que le fer végétal",
          "Associez une source de vitamine C au fer végétal",
          "Thé et café pendant le repas réduisent l'absorption",
        ],
      },
    ],
  },
  "Magnésium": {
    intro: "Fonction musculaire et nerveuse, production d'énergie.",
    sections: [
      {
        heading: "Où en trouver",
        items: [
          "Chocolat noir, oléagineux, légumineuses",
          "Céréales complètes, certaines eaux minérales",
        ],
      },
    ],
  },
  Zinc: {
    intro: "Immunité, cicatrisation et synthèse des protéines.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Viande, fruits de mer (huîtres), fromage", "Légumineuses, oléagineux"],
      },
    ],
  },
  Iode: {
    intro: "Nécessaire à la fabrication des hormones thyroïdiennes.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Poissons de mer, fruits de mer, algues", "Produits laitiers, sel iodé"],
      },
    ],
  },
  "Sélénium": {
    intro: "Antioxydant qui soutient la thyroïde et l'immunité.",
    sections: [
      {
        heading: "Où en trouver",
        items: ["Noix du Brésil, poisson, fruits de mer", "Œufs, abats"],
      },
    ],
  },
  Potassium: {
    intro: "Équilibre hydrique, pression artérielle et fonction musculaire.",
    sections: [
      {
        heading: "Où en trouver",
        items: [
          "Fruits et légumes (banane, pomme de terre, épinard)",
          "Légumes secs, fruits secs",
        ],
      },
    ],
  },
  Phosphore: {
    intro: "Structure des os et des dents, production d'énergie.",
    sections: [
      {
        heading: "Où en trouver",
        items: [
          "Produits laitiers, viande, poisson",
          "Légumineuses, oléagineux (les carences sont rares)",
        ],
      },
    ],
  },
};

function NameWithTip({ name, tip }: { name: string; tip: Tip }) {
  return (
    <span tabIndex={0} className="group/tip relative inline-flex cursor-help items-center gap-1">
      <span className="text-slate-600 underline decoration-dotted decoration-slate-300 underline-offset-2">
        {name}
      </span>
      <span aria-hidden className="text-xs text-slate-400">ⓘ</span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-72 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs leading-relaxed text-slate-600 shadow-lg group-hover/tip:block group-focus-within/tip:block"
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

function MacroRow(props: { label: string; bar: string; target: MacroTarget; children?: ReactNode }) {
  const { label, bar, target, children } = props;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-slate-500">
          {round(target.grams)} g · {round(target.kcal)} kcal · {round(target.percentAet * 100)} %
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={"h-full rounded-full " + bar} style={{ width: `${target.percentAet * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-400">Fourchette : {fmtMacroRange(target)}</p>
      {children}
    </div>
  );
}

export function App() {
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
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">nutricalc</h1>
          <p className="mt-1 text-slate-600">
            Apports journaliers recommandés selon votre profil et votre objectif — énergie,
            macronutriments et micronutriments (références ANSES).
          </p>
        </header>

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

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Objectif</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={profile.goal}
                onChange={(e) => set("goal", e.target.value as NutritionGoal)}
              >
                {GOAL_KEYS.map((g) => (
                  <option key={g} value={g}>
                    {NUTRITION_PROFILES[g].label} — {NUTRITION_PROFILES[g].description}
                  </option>
                ))}
              </select>
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

        {result.error ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">{result.error}</p>
        ) : (
          result.report && (
            <>
              <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">Métabolisme de base</p>
                  <p className="mt-1 text-2xl font-bold">{round(result.report.bmrKcal)} <span className="text-base font-normal text-slate-400">kcal/j</span></p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">Dépense totale (TDEE)</p>
                  <p className="mt-1 text-2xl font-bold">{round(result.report.tdeeKcal)} <span className="text-base font-normal text-slate-400">kcal/j</span></p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                  <p className="text-sm text-emerald-700">Calories cibles</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">{round(result.report.energyKcal)} <span className="text-base font-normal text-emerald-600">kcal/j</span></p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {fmtAdjustment(result.report.energy.adjustmentKcal)} · {round(result.report.energy.energyMinKcal)}–{round(result.report.energy.energyMaxKcal)} kcal/j
                  </p>
                </div>
              </section>

              {result.report.weightAdjusted && (
                <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Les macros en g/kg sont calculées sur un poids de référence de{" "}
                  {one(result.report.effectiveWeightKg)} kg — la moyenne entre votre poids
                  actuel ({one(result.report.profile.weightKg)} kg) et votre poids cible
                  ({one(result.report.profile.targetWeightKg)} kg).
                </p>
              )}

              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Macronutriments</h2>
                <div className="space-y-4">
                  <MacroRow label="Protéines" bar="bg-sky-500" target={result.report.macros.protein}>
                    <details className="group mt-2">
                      <summary className="cursor-pointer text-xs text-sky-700 hover:underline">
                        Acides aminés indispensables (9) — minimums OMS × facteur sportif
                      </summary>
                      <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                        {result.report.macros.aminoAcids.map((aa) => (
                          <div key={aa.name} className="flex items-baseline justify-between border-b border-slate-100 py-1 text-sm">
                            <span className="text-slate-600">{aa.name}</span>
                            <span className="tabular-nums text-slate-900">{round(aa.mg)} mg</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </MacroRow>

                  <MacroRow label="Lipides" bar="bg-amber-500" target={result.report.macros.lipid}>
                    <details className="group mt-2">
                      <summary className="cursor-pointer text-xs text-amber-700 hover:underline">
                        Acides gras — références ANSES
                      </summary>
                      <div className="mt-2 space-y-1">
                        {result.report.macros.fattyAcids.map((fa) => (
                          <div key={fa.name} className="flex items-baseline justify-between border-b border-slate-100 py-1 text-sm">
                            {TIPS[fa.name] ? (
                              <NameWithTip name={fa.name} tip={TIPS[fa.name]} />
                            ) : (
                              <span className="text-slate-600" title={fa.note}>{fa.name}</span>
                            )}
                            <span className="tabular-nums text-slate-900">
                              {fmtFattyAcid(fa)}
                              <span className="ml-2 text-xs text-slate-400">{fa.kind}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </MacroRow>

                  <MacroRow label="Glucides" bar="bg-emerald-500" target={result.report.macros.carb}>
                    <details className="group mt-2">
                      <summary className="cursor-pointer text-xs text-emerald-700 hover:underline">
                        Fibres et sucres — références ANSES/OMS
                      </summary>
                      <div className="mt-2 space-y-1">
                        {result.report.macros.carbComponents.map((c) => (
                          <div key={c.name} className="flex items-baseline justify-between border-b border-slate-100 py-1 text-sm">
                            {TIPS[c.name] ? (
                              <NameWithTip name={c.name} tip={TIPS[c.name]} />
                            ) : (
                              <span className="text-slate-600" title={c.note}>{c.name}</span>
                            )}
                            <span className="tabular-nums text-slate-900">
                              {fmtCarb(c)}
                              <span className="ml-2 text-xs text-slate-400">{c.kind}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </MacroRow>
                </div>
              </section>

              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Micronutriments</h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                  {result.report.micros.map((micro) => (
                    <div key={micro.name} className="flex items-baseline justify-between border-b border-slate-100 py-1.5 text-sm">
                      {MICRO_TIPS[micro.name] ? (
                        <NameWithTip name={micro.name} tip={MICRO_TIPS[micro.name]} />
                      ) : (
                        <span className="text-slate-700" title={micro.note}>{micro.name}</span>
                      )}
                      <span className="tabular-nums text-slate-900">
                        {one(micro.amount)} {micro.unit}
                        <span className="ml-2 text-xs text-slate-400">{micro.kind}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Valeurs indicatives (références ANSES, RNP/AS ; acides aminés FAO/OMS), à
                  revalider. Outil informatif — ne remplace pas un avis médical ou diététique.
                </p>
              </section>

              <MealPlanner
                target={{
                  proteinG: result.report.macros.protein.grams,
                  lipidG: result.report.macros.lipid.grams,
                  carbG: result.report.macros.carb.grams,
                  kcal: result.report.energyKcal,
                }}
                muscleTargets={result.report.muscleTargets}
              />
            </>
          )
        )}
      </div>
    </div>
  );
}
