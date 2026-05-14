/**
 * Tag-IDs aus dem Intercom-Workspace.
 *
 * Setup: in Intercom 7 Tags anlegen, Tag-IDs hier eintragen.
 * Solange Werte fehlen, wird das Tagging im API-Wrapper still übersprungen.
 */
export const INTERCOM_TAG_IDS: Record<string, string> = {
  abrechnung: "",
  technik: "",
  projekt: "",
  vertrag: "",
  ausbildung: "",
  community: "",
  sonstiges: "",
};

export type IntercomCategory = keyof typeof INTERCOM_TAG_IDS;
