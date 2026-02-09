/**
 * Schémas de validation pour l'export de données
 */

import { z } from "zod";

export const dataExportFormatSchema = z.enum(["json", "csv", "pdf", "zip", "zip-no-photos"], {
  errorMap: () => ({ message: "Format d'export invalide" }),
});

export const createDataExportSchema = z.object({
  format: dataExportFormatSchema.default("json"),
});

export const dataExportIdSchema = z.object({
  id: z.string().min(1, "ID requis").max(128, "ID invalide"),
});
