# Guide de Test - Export de Données RGPD

## Tests Manuels

### 1. Test de création d'export JSON

**Objectif**: Vérifier que l'export JSON fonctionne correctement.

**Étapes**:
1. Se connecter à Lok'Room
2. Aller sur `/account/data-export`
3. Sélectionner le format "JSON"
4. Cliquer sur "Créer l'export"
5. Attendre la confirmation (quelques secondes)
6. Cliquer sur "Télécharger"

**Résultat attendu**:
- ✅ Fichier `lokroom-export-[userId]-[timestamp].json` téléchargé
- ✅ Taille: ~100-500 KB
- ✅ Contenu: JSON valide avec toutes les données
- ✅ Structure: `exportDate`, `exportVersion`, `account`, `profile`, etc.

**Vérification du contenu**:
```bash
# Ouvrir le fichier JSON
cat lokroom-export-*.json | jq .

# Vérifier les sections principales
cat lokroom-export-*.json | jq 'keys'
# Devrait afficher: ["account", "auditLogs", "bookingsAsGuest", "bookingsAsHost", ...]
```

---

### 2. Test de création d'export CSV

**Objectif**: Vérifier que l'export CSV génère plusieurs fichiers.

**Étapes**:
1. Aller sur `/account/data-export`
2. Sélectionner "CSV (ZIP)"
3. Créer l'export
4. Télécharger le fichier ZIP
5. Extraire le contenu

**Résultat attendu**:
- ✅ Fichier `lokroom-export-csv-[userId]-[timestamp].zip`
- ✅ Contient plusieurs fichiers CSV:
  - `profile.csv`
  - `listings.csv` (si l'utilisateur a des annonces)
  - `bookings_as_guest.csv` (si réservations)
  - `bookings_as_host.csv` (si hôte)
  - `reviews_given.csv`
  - `favorites.csv`
  - etc.

**Vérification**:
```bash
# Lister le contenu du ZIP
unzip -l lokroom-export-csv-*.zip

# Ouvrir un CSV dans Excel/LibreOffice
# Vérifier que les colonnes sont correctes
```

---

### 3. Test de création d'export PDF

**Objectif**: Vérifier la génération du rapport PDF.

**Étapes**:
1. Sélectionner "PDF"
2. Créer l'export
3. Télécharger et ouvrir le PDF

**Résultat attendu**:
- ✅ Fichier `lokroom-export-[userId]-[timestamp].pdf`
- ✅ Taille: ~200-800 KB
- ✅ Contenu:
  - Page de garde avec titre et date
  - Table des matières
  - Sections: Compte, Profil, Annonces, Réservations, etc.
  - Mise en page professionnelle
  - Numéros de page

**Vérification**:
- Ouvrir dans Adobe Reader / Chrome
- Vérifier que toutes les sections sont présentes
- Vérifier la lisibilité

---

### 4. Test de création d'export ZIP complet

**Objectif**: Vérifier l'export avec photos.

**Étapes**:
1. Sélectionner "ZIP (avec photos)"
2. Créer l'export (peut prendre 30-60 secondes)
3. Télécharger le ZIP
4. Extraire le contenu

**Résultat attendu**:
- ✅ Fichier `lokroom-export-[userId]-[timestamp].zip`
- ✅ Taille: ~5-50 MB (selon le nombre de photos)
- ✅ Contenu:
  - `data.json`
  - `csv/` (dossier avec tous les CSV)
  - `photos/` (dossier avec photos par annonce)
  - `README.md`
  - `metadata.json`

**Structure attendue**:
```
lokroom-export-*.zip
├── data.json
├── csv/
│   ├── profile.csv
│   ├── listings.csv
│   └── ...
├── photos/
│   ├── [listingId1]/
│   │   ├── 0_cover.jpg
│   │   ├── 1_image.jpg
│   │   └── ...
│   └── [listingId2]/
│       └── ...
├── README.md
└── metadata.json
```

---

### 5. Test du rate limiting

**Objectif**: Vérifier qu'on ne peut pas créer plusieurs exports rapidement.

**Étapes**:
1. Créer un export (n'importe quel format)
2. Immédiatement après, essayer d'en créer un autre

**Résultat attendu**:
- ✅ Premier export: Succès
- ✅ Deuxième export: Erreur 429
- ✅ Message: "Limite de fréquence atteinte. Vous pouvez demander un nouvel export dans 1 heure(s)"
- ✅ Affichage de `nextAllowedAt`

---

### 6. Test de l'historique

**Objectif**: Vérifier l'affichage de l'historique des exports.

**Étapes**:
1. Créer plusieurs exports (différents formats)
2. Rafraîchir la page
3. Vérifier la section "Historique des exports"

**Résultat attendu**:
- ✅ Liste des exports triée par date (plus récent en premier)
- ✅ Pour chaque export:
  - Format (JSON, CSV, PDF, ZIP)
  - Statut (Terminé, En cours, Échoué)
  - Taille du fichier
  - Date de création
  - Date d'expiration
  - Bouton "Télécharger" (si disponible)

---

### 7. Test de téléchargement

**Objectif**: Vérifier qu'on peut télécharger un export existant.

**Étapes**:
1. Dans l'historique, cliquer sur "Télécharger" pour un export terminé
2. Vérifier le téléchargement

**Résultat attendu**:
- ✅ Fichier téléchargé avec le bon nom
- ✅ Taille correcte
- ✅ Contenu valide

---

### 8. Test d'expiration

**Objectif**: Vérifier qu'un export expiré ne peut plus être téléchargé.

**Étapes**:
1. En base de données, modifier un export pour qu'il soit expiré:
```sql
UPDATE "DataExportRequest"
SET "expiresAt" = NOW() - INTERVAL '1 day'
WHERE id = '[exportId]';
```
2. Rafraîchir la page `/account/data-export`
3. Essayer de télécharger l'export expiré

**Résultat attendu**:
- ✅ Badge "Expiré" affiché
- ✅ Bouton "Télécharger" absent
- ✅ Si on essaie de télécharger via l'URL: Erreur 410 "Export expiré"

---

### 9. Test de sécurité

**Objectif**: Vérifier qu'un utilisateur ne peut pas télécharger l'export d'un autre.

**Étapes**:
1. Se connecter avec l'utilisateur A
2. Créer un export et noter l'ID
3. Se déconnecter
4. Se connecter avec l'utilisateur B
5. Essayer d'accéder à `/api/users/me/export/[exportId-de-A]/download`

**Résultat attendu**:
- ✅ Erreur 403 "Accès non autorisé"

---

### 10. Test du cron job de nettoyage

**Objectif**: Vérifier que les exports expirés sont supprimés.

**Étapes**:
1. Créer plusieurs exports expirés en DB:
```sql
INSERT INTO "DataExportRequest" (id, "userId", format, status, "expiresAt", "createdAt")
VALUES
  (gen_random_uuid(), '[userId]', 'json', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), '[userId]', 'pdf', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '9 days');
```
2. Appeler le cron job:
```bash
curl -X POST http://localhost:3000/api/cron/cleanup-exports \
  -H "Authorization: Bearer dev-secret"
```
3. Vérifier la réponse

**Résultat attendu**:
- ✅ Réponse JSON:
```json
{
  "success": true,
  "deleted": {
    "expired": 2,
    "failed": 0,
    "total": 2
  }
}
```
- ✅ Exports supprimés de la DB

---

## Tests Automatisés

### Exécuter les tests

```bash
# Tous les tests
npm test -- export.test.ts

# Tests spécifiques
npm test -- export.test.ts -t "collectUserData"
npm test -- export.test.ts -t "generateJSON"
npm test -- export.test.ts -t "Rate Limiting"
```

### Coverage

```bash
npm test -- export.test.ts --coverage
```

**Objectif**: > 80% de couverture

---

## Tests de Performance

### 1. Test de génération JSON

**Objectif**: Vérifier que la génération est rapide.

```bash
# Mesurer le temps
time curl -X POST http://localhost:3000/api/users/me/export \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"format":"json"}'
```

**Résultat attendu**: < 2 secondes

---

### 2. Test de génération ZIP avec photos

**Objectif**: Vérifier que la génération avec photos reste raisonnable.

```bash
time curl -X POST http://localhost:3000/api/users/me/export \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"format":"zip"}'
```

**Résultat attendu**: < 30 secondes (pour ~20 photos)

---

### 3. Test de charge

**Objectif**: Vérifier que le système supporte plusieurs exports simultanés.

```bash
# Utiliser Apache Bench
ab -n 10 -c 2 -H "Cookie: next-auth.session-token=..." \
  -p export-request.json -T application/json \
  http://localhost:3000/api/users/me/export
```

**Résultat attendu**:
- ✅ Tous les exports réussissent
- ✅ Temps de réponse moyen < 5 secondes
- ✅ Pas d'erreur 500

---

## Checklist de validation

Avant de déployer en production:

- [ ] ✅ Export JSON fonctionne
- [ ] ✅ Export CSV fonctionne
- [ ] ✅ Export PDF fonctionne
- [ ] ✅ Export ZIP fonctionne
- [ ] ✅ Export ZIP sans photos fonctionne
- [ ] ✅ Rate limiting fonctionne (1/heure)
- [ ] ✅ Historique s'affiche correctement
- [ ] ✅ Téléchargement fonctionne
- [ ] ✅ Expiration fonctionne (7 jours)
- [ ] ✅ Sécurité: utilisateur ne peut pas télécharger export d'un autre
- [ ] ✅ Cron job de nettoyage fonctionne
- [ ] ✅ Logs d'audit sont créés
- [ ] ✅ Tests automatisés passent (> 80% coverage)
- [ ] ✅ Performance acceptable (< 30s pour ZIP)
- [ ] ✅ Interface utilisateur responsive
- [ ] ✅ Messages d'erreur clairs
- [ ] ✅ Documentation complète

---

## Problèmes connus et solutions

### Problème 1: Export ZIP trop lent

**Symptôme**: La génération du ZIP avec photos prend > 60 secondes.

**Solution**:
- Limiter le nombre de photos (max 100)
- Utiliser un job background pour les gros exports
- Compresser les images avant de les ajouter au ZIP

### Problème 2: Erreur "Out of memory"

**Symptôme**: Erreur lors de la génération d'un gros export.

**Solution**:
- Augmenter la limite de mémoire Node.js: `NODE_OPTIONS=--max-old-space-size=4096`
- Utiliser des streams au lieu de charger tout en mémoire
- Passer à un job background pour les exports > 50 MB

### Problème 3: Rate limiting trop strict

**Symptôme**: Utilisateurs se plaignent de ne pas pouvoir créer plusieurs exports.

**Solution**:
- Augmenter la limite à 3 exports par jour
- Permettre 1 export par format par jour
- Ajouter une option "premium" sans limite

---

## Support

Pour toute question sur les tests:
- Documentation: `/DATA_EXPORT_IMPLEMENTATION.md`
- Code source: `/src/lib/export/`
- Tests: `/src/lib/export/export.test.ts`
