import { useMemo, useState } from "react";
import { dailyReport } from "./calc/report";
import { ACTIVITY_LEVELS, type ActivityLevel, type Profile, type Sex } from "./calc/profile";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sédentaire",
  light: "Légère (1-3 j/sem)",
  moderate: "Modérée (3-5 j/sem)",
  active: "Intense (6-7 j/sem)",
  veryActive: "Très intense",
};

const MACRO_STYLE = {
  protein: { label: "Protéines", bar: "bg-sky-500" },
  lipid: { label: "Lipides", bar: "bg-amber-500" },
  carb: { label: "Glucides", bar: "bg-emerald-500" },
} as const;

const round = (n: number) => Math.round(n);
const one = (n: number) => Math.round(n * 10) / 10;

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

export function App() {
  const [profile, setProfile] = useState<Profile>({
    sex: "female",
    ageYears: 35,
    weightKg: 65,
    heightCm: 168,
    activity: "moderate",
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
            Apports journaliers recommandés — énergie, macronutriments et micronutriments
            (références ANSES).
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
              <span className="font-medium text-slate-700">Niveau d'activité</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={profile.activity}
                onChange={(e) => set("activity", e.target.value as ActivityLevel)}
              >
                {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((a) => (
                  <option key={a} value={a}>
                    {ACTIVITY_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>

            <NumberField label="Âge" value={profile.ageYears} min={18} max={120} unit="ans"
              onChange={(v) => set("ageYears", v)} />
            <NumberField label="Poids" value={profile.weightKg} min={1} max={400} unit="kg"
              onChange={(v) => set("weightKg", v)} />
            <NumberField label="Taille" value={profile.heightCm} min={1} max={260} unit="cm"
              onChange={(v) => set("heightCm", v)} />
          </div>
        </section>

        {result.error ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">{result.error}</p>
        ) : (
          result.report && (
            <>
              <section className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">Métabolisme de base</p>
                  <p className="mt-1 text-2xl font-bold">{round(result.report.bmrKcal)} <span className="text-base font-normal text-slate-400">kcal/j</span></p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                  <p className="text-sm text-emerald-700">Besoin énergétique</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">{round(result.report.energyKcal)} <span className="text-base font-normal text-emerald-600">kcal/j</span></p>
                </div>
              </section>

              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Macronutriments</h2>
                <div className="space-y-4">
                  {(["protein", "lipid", "carb"] as const).map((key) => {
                    const m = result.report!.macros[key];
                    const style = MACRO_STYLE[key];
                    return (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">{style.label}</span>
                          <span className="text-slate-500">
                            {round(m.grams)} g · {round(m.kcal)} kcal · {round(m.percentAet * 100)} %
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className={"h-full rounded-full " + style.bar} style={{ width: `${m.percentAet * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Micronutriments</h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                  {result.report.micros.map((micro) => (
                    <div key={micro.name} className="flex items-baseline justify-between border-b border-slate-100 py-1.5 text-sm">
                      <span className="text-slate-700" title={micro.note}>{micro.name}</span>
                      <span className="tabular-nums text-slate-900">
                        {one(micro.amount)} {micro.unit}
                        <span className="ml-2 text-xs text-slate-400">{micro.kind}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Valeurs indicatives (références ANSES, RNP/AS), à revalider. Outil informatif —
                  ne remplace pas un avis médical ou diététique.
                </p>
              </section>
            </>
          )
        )}
      </div>
    </div>
  );
}
