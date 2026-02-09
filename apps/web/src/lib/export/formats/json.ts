/**
 * Générateur de format JSON pour l'export de données
 */

import type { UserDataExport } from "../user-data";

/**
 * Génère un export JSON formaté
 */
export function generateJSON(userData: UserDataExport): string {
  return JSON.stringify(userData, null, 2);
}

/**
 * Génère un export JSON compact (sans indentation)
 */
export function generateJSONCompact(userData: UserDataExport): string {
  return JSON.stringify(userData);
}
