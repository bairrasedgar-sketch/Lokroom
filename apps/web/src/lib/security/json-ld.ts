// apps/web/src/lib/security/json-ld.ts

/**
 * 🔒 SÉCURITÉ : Sécurise les données JSON-LD contre les attaques XSS
 *
 * Problème : Si un utilisateur met "</script>" dans un champ texte,
 * cela pourrait fermer prématurément le tag <script type="application/ld+json">
 * et permettre l'exécution de code malveillant.
 *
 * Solution : Remplacer "</script>" par "<\/script>" dans le JSON,
 * ce qui est valide en JSON mais n'est pas interprété comme une balise HTML.
 *
 * @param data - L'objet à convertir en JSON sécurisé
 * @returns Une chaîne JSON sécurisée pour l'insertion dans un tag script
 */
export function secureJsonLd(data: unknown): string {
  const json = JSON.stringify(data);

  // Échapper les séquences dangereuses qui pourraient fermer le tag script
  return json
    .replace(/<\//g, '<\\/')  // </script> → <\/script>
    .replace(/<!--/g, '<\\!--')  // <!-- → <\!--
    .replace(/-->/g, '--\\>');  // --> → --\>
}

/**
 * 🔒 SÉCURITÉ : Nettoie une chaîne de caractères pour l'utilisation dans JSON-LD
 *
 * Supprime les caractères de contrôle et limite la longueur pour éviter les DoS.
 *
 * @param str - La chaîne à nettoyer
 * @param maxLength - Longueur maximale (défaut: 1000)
 * @returns La chaîne nettoyée
 */
export function sanitizeJsonLdString(str: string | null | undefined, maxLength = 1000): string {
  if (!str) return '';

  return str
    .replace(/[\x00-\x1F\x7F]/g, '') // Supprimer les caractères de contrôle
    .slice(0, maxLength)
    .trim();
}
