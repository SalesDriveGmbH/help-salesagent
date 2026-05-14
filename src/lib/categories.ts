export type CategorySlug =
  | "abrechnung"
  | "technik"
  | "projekt"
  | "vertrag"
  | "ausbildung"
  | "community";

export interface CategoryMeta {
  slug: CategorySlug;
  title: string;
  description: string;
  icon: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "abrechnung",
    title: "Abrechnung & Auszahlung",
    description: "Vergütung, Auszahlungstermine, Kontoblatt, Einwände.",
    icon: "Euro",
  },
  {
    slug: "technik",
    title: "Technik & Tools",
    description: "Close, Calendly, Analyse-AI, Triangility, Dashboard.",
    icon: "Settings",
  },
  {
    slug: "projekt",
    title: "Projekte & Onboarding",
    description: "Projektstart, Kapazitätenplanung, Pipeline, Zugangsdaten.",
    icon: "Briefcase",
  },
  {
    slug: "vertrag",
    title: "Vertrag & Rechtliches",
    description: "HVV, PNV, Gewerbe, Steuer, Kündigung.",
    icon: "FileText",
  },
  {
    slug: "ausbildung",
    title: "Ausbildung & Skripte",
    description: "Skripte, Tests, wöchentliche Live-Trainings.",
    icon: "BookOpen",
  },
  {
    slug: "community",
    title: "Community & Sonstiges",
    description: "Nutzungs-Tipps für den Hilfebereich, Reaktionszeiten, Wünsche.",
    icon: "Users",
  },
];

export function getCategory(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
