/**
 * Tag-IDs aus dem Intercom-Workspace.
 * Gepullt aus der Intercom-API am 2026-05-14.
 */
export const INTERCOM_TAG_IDS: Record<string, string> = {
  abrechnung: "15060321",
  technik: "15060326",
  projekt: "15060328",
  vertrag: "15060333",
  ausbildung: "15060335",
  community: "15060336",
  sonstiges: "15060337",
};

export type IntercomCategory = keyof typeof INTERCOM_TAG_IDS;
