// Contenu éditorial des fiches d'objectif (onglet « Objectifs »).
//
// Indexé par `NutritionGoal` (cf. profile.ts) : chaque fiche décrit à qui
// l'objectif s'adresse, ses précautions, un persona illustratif, ce que le
// réglage implique (qualitativement — les chiffres détaillés restent dans
// « Comptes rendus ») et ses sources. Contenu INDICATIF et honnête : il ne
// remplace pas un avis professionnel. Ce module est purement éditorial et
// n'entre PAS dans le calcul.
import type { NutritionGoal } from "./calc/profile";

export interface ObjectiveInfo {
  // 1. Pour qui / quand c'est adapté
  forWhom: string;
  // 2. Précautions / déconseillé si… (cas d'âge / reprise inclus)
  precautions: string;
  // 3. Persona : exemple concret d'une personne-type
  persona: string;
  // 4. Ce que ça implique : UNE ligne qualitative (déficit/surplus + protéines)
  implication: string;
  // 5. Source(s) : citation courte
  sources: string;
}

export const OBJECTIVE_INFO: Record<NutritionGoal, ObjectiveInfo> = {
  sedentary: {
    forWhom:
      "Adapté si vous bougez peu au quotidien (travail assis, peu ou pas de sport). Sert de base d'entretien pour couvrir les besoins sans viser de performance.",
    precautions:
      "Rester durablement sédentaire n'est pas un objectif santé en soi : quelques minutes d'activité par jour restent recommandées. Si vous reprenez le sport, basculez vers « Actif ».",
    persona:
      "Camille, travail de bureau, se déplace surtout en transports, sans entraînement régulier.",
    implication: "Maintien des calories, protéines au niveau des repères santé.",
    sources: "ANSES (références nutritionnelles) ; OMS (activité physique).",
  },
  active: {
    forWhom:
      "Adapté si vous pratiquez 2 à 4 séances par semaine (fitness, sport loisir) et souhaitez soutenir cette activité sans perte ni prise de poids marquée.",
    precautions:
      "Objectif polyvalent avec peu de contre-indications. En cas de reprise après une longue pause ou à un âge avancé, c'est un bon point de départ avant tout objectif plus exigeant.",
    persona:
      "Sofia, 3 séances de sport par semaine, veut se sentir en forme et stable sur la balance.",
    implication: "Maintien des calories, protéines légèrement rehaussées pour l'activité.",
    sources: "ANSES ; ACSM/ISSN (protéines et activité physique).",
  },
  endurance: {
    forWhom:
      "Adapté aux pratiquants réguliers d'endurance (course, vélo, triathlon, sports collectifs intensifs) avec un gros volume hebdomadaire et des besoins en glucides élevés.",
    precautions:
      "Les besoins caloriques et glucidiques sont importants : un apport insuffisant expose à la fatigue et aux blessures. Peu adapté si votre volume d'entraînement est en réalité modéré — préférez « Actif ».",
    persona:
      "Marco, prépare un marathon, 5 à 6 sorties par semaine, longues sessions le week-end.",
    implication: "Maintien des calories, glucides élevés, protéines modérées à élevées.",
    sources: "ISSN (nutrition de l'endurance) ; ANSES.",
  },
  strengthMaintenance: {
    forWhom:
      "Adapté si vous faites de la musculation et souhaitez conserver votre masse musculaire et votre force, sans chercher à prendre ou perdre du poids.",
    precautions:
      "Peu de contre-indications. Si vous visez explicitement à gagner du muscle, « Prise de masse » (léger surplus) sera plus efficace.",
    persona:
      "Léa, musculation 3 fois par semaine, satisfaite de son physique, veut le maintenir.",
    implication: "Maintien des calories, protéines élevées pour préserver le muscle.",
    sources: "ISSN (position sur les protéines) ; ACSM.",
  },
  muscleGain: {
    forWhom:
      "Adapté si vous voulez développer votre masse musculaire avec un entraînement de force régulier et progressif, en acceptant un léger surplus calorique.",
    precautions:
      "Le surplus favorise aussi une prise de gras si l'entraînement ne suit pas. Peu adapté sans pratique régulière de musculation, ou si l'objectif prioritaire est de perdre du poids.",
    persona:
      "Yanis, débute une prise de masse, entraînement structuré 4 fois par semaine, veut gagner du muscle.",
    implication: "Léger surplus calorique, protéines élevées pour la synthèse musculaire.",
    sources: "ISSN (prise de masse) ; ACSM.",
  },
  fatLoss: {
    forWhom:
      "Adapté pour une perte de poids progressive et durable, avec un déficit calorique modéré et des protéines élevées pour préserver la masse musculaire.",
    precautions:
      "Un déficit trop marqué ou prolongé peut réduire l'énergie, la masse musculaire et affecter le moral. À éviter en cas d'antécédent de trouble du comportement alimentaire — un accompagnement professionnel est recommandé.",
    persona:
      "Nadia, souhaite perdre quelques kilos sans régime extrême, garde une activité régulière.",
    implication: "Déficit calorique modéré, protéines élevées pour protéger le muscle.",
    sources: "ANSES ; ISSN (protéines en déficit calorique).",
  },
  aggressiveCut: {
    forWhom:
      "Adapté à un public averti : sportif déjà sec visant une définition musculaire poussée sur une période courte, avec un déficit important et des protéines très élevées.",
    precautions:
      "Déconseillé en reprise du sport ou à un âge avancé : préférez « Actif » ou un déficit modéré (« Perte de poids »). Déficit exigeant, à limiter dans le temps et idéalement à encadrer par un professionnel ; à proscrire en cas d'antécédent de trouble du comportement alimentaire.",
    persona:
      "Thomas, compétiteur physique déjà mince, prépare une échéance et veut affiner sur quelques semaines.",
    implication: "Déficit calorique important, protéines très élevées, sur une durée limitée.",
    sources: "ISSN (athlètes en sèche) ; ACSM ; ANSES.",
  },
};
