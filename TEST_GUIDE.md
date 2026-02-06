# 🧪 Guide de Test - Système de Création d'Annonce Enrichi

## ✅ Tests à Effectuer

### 1. Test de l'Étape 6 - Caractéristiques (Amenities)

**URL:** http://localhost:3003/listings/new

**Étapes:**
1. Sélectionner un type d'espace (ex: APARTMENT)
2. Remplir les étapes jusqu'à l'étape 6 (Features)
3. Vérifier que le composant `AmenitiesSelector` s'affiche
4. Vérifier les catégories:
   - ✅ Essentiel (WiFi, Climatisation, Chauffage, etc.)
   - ✅ Professionnel (Imprimante, Vidéoprojecteur, etc.)
   - ✅ Stationnement (Parking gratuit/payant, Borne électrique)
   - ✅ Accessibilité (Ascenseur, Accessible fauteuil roulant)
   - ✅ Extérieur (Piscine, Jardin, Balcon, etc.)
   - ✅ Média & Studio (Système audio, Fond vert, etc.)
5. Sélectionner plusieurs amenities
6. Vérifier le compteur (ex: "5 équipements sélectionnés")
7. Vérifier l'affichage des équipements sélectionnés avec bouton X
8. Retirer un équipement en cliquant sur X
9. Continuer vers l'étape suivante

**Résultat attendu:**
- Les amenities sont chargées depuis l'API
- La sélection/désélection fonctionne
- Le compteur est correct
- Les équipements sélectionnés sont affichés
- La suppression fonctionne

---

### 2. Test de l'Étape 8 - Description

**Étapes:**
1. Arriver à l'étape 8 (Description)
2. Vérifier les nouveaux champs:
   - ✅ Titre (120 caractères max)
   - ✅ Points forts (2-3 max) - boutons sélectionnables
   - ✅ L'espace (1000 caractères)
   - ✅ Accès voyageurs (500 caractères, optionnel)
   - ✅ Le quartier (500 caractères, optionnel)
   - ✅ Description générale (2000 caractères)
3. Sélectionner 2-3 points forts
4. Vérifier le compteur "2/3 sélectionnés"
5. Essayer de sélectionner un 4ème point fort (devrait être bloqué)
6. Remplir les différentes sections
7. Vérifier les compteurs de caractères

**Résultat attendu:**
- Tous les champs sont présents
- Les compteurs fonctionnent
- Maximum 3 points forts sélectionnables
- Les sections sont bien séparées

---

### 3. Test de l'Étape 9 - Tarification

**Étapes:**
1. Arriver à l'étape 9 (Pricing)
2. Sélectionner "À l'heure" ou "Les deux"
3. Vérifier les nouveaux champs:
   - ✅ Incrément de réservation (30 min / 1 heure)
   - ✅ Durée minimum de réservation (select)
   - ✅ Frais de ménage (input number)
   - ✅ Frais par voyageur supplémentaire (2 inputs)
4. Tester l'incrément:
   - Sélectionner 30 minutes
   - Sélectionner 1 heure
5. Tester la durée minimum:
   - Sélectionner "2 heures"
   - Vérifier que la valeur est enregistrée
6. Ajouter des frais:
   - Frais de ménage: 50€
   - Frais voyageur: 10€ à partir de 3 voyageurs

**Résultat attendu:**
- Les nouveaux champs s'affichent uniquement pour tarification horaire
- Les boutons d'incrément fonctionnent
- Le select de durée minimum fonctionne
- Les frais sont enregistrés

---

### 4. Test de l'Étape 10 - Réductions

**Étapes:**
1. Arriver à l'étape 10 (Discounts)
2. Vérifier les réductions horaires (si tarification horaire):
   - ✅ 2h+ (nouveau)
   - ✅ 3h+ (existant)
   - ✅ 4h+ (nouveau)
   - ✅ 6h+ (existant)
   - ✅ 8h+ (nouveau)
3. Vérifier les réductions journalières (si tarification journalière):
   - ✅ 2j+ (nouveau)
   - ✅ 3j+ (existant)
   - ✅ 5j+ (nouveau)
   - ✅ 7j+ (existant)
   - ✅ 14j+ (nouveau)
   - ✅ 28j+ (existant)
4. Ajouter plusieurs réductions:
   - 3h+: 10%
   - 6h+: 15%
   - 3j+: 10%
   - 7j+: 20%
5. Vérifier le preview des réductions
6. Vérifier que toutes les réductions sont listées

**Résultat attendu:**
- 11 types de réductions disponibles (vs 5 avant)
- Le preview affiche toutes les réductions actives
- Les pourcentages sont enregistrés

---

### 5. Test de Soumission Complète

**Étapes:**
1. Créer une annonce complète de A à Z
2. Remplir toutes les étapes:
   - Type: APARTMENT
   - Localisation: Paris
   - Capacité: 4 voyageurs, 2 lits, 1 salle de bain
   - Caractéristiques: WiFi, Cuisine, Lave-linge, Climatisation
   - Photos: 3 images minimum
   - Description: Titre + 2 points forts + sections
   - Tarification: 80€/nuit + frais ménage 50€
   - Réductions: -10% 7j+, -20% 28j+
3. Soumettre l'annonce
4. Vérifier la redirection vers la page de l'annonce
5. Vérifier en base de données:

```sql
-- Vérifier l'annonce
SELECT id, title, price, cleaningFee, extraGuestFee, hourlyIncrement
FROM Listing
ORDER BY createdAt DESC
LIMIT 1;

-- Vérifier les amenities
SELECT a.label, a.category
FROM ListingAmenity la
JOIN Amenity a ON la.amenityId = a.id
WHERE la.listingId = 'ID_DE_L_ANNONCE';

-- Vérifier les réductions
SELECT discountHours2Plus, discountHours3Plus, discountHours4Plus,
       discountDays2Plus, discountDays3Plus, discountDays5Plus
FROM Listing
WHERE id = 'ID_DE_L_ANNONCE';
```

**Résultat attendu:**
- L'annonce est créée avec succès
- Tous les champs sont enregistrés en DB
- Les amenities sont liées correctement
- Les réductions sont enregistrées
- Redirection vers la page de l'annonce

---

### 6. Test de l'API Amenities

**Test 1: GET /api/amenities**
```bash
curl http://localhost:3003/api/amenities
```

**Résultat attendu:**
```json
{
  "amenities": [
    { "id": "...", "slug": "wifi", "label": "WiFi", "category": "GENERAL" },
    ...
  ],
  "grouped": {
    "GENERAL": [...],
    "BUSINESS": [...],
    "PARKING": [...],
    ...
  }
}
```

**Test 2: POST /api/listings/[id]/amenities**
```bash
curl -X POST http://localhost:3003/api/listings/ID_ANNONCE/amenities \
  -H "Content-Type: application/json" \
  -d '{"amenityIds": ["id1", "id2", "id3"]}'
```

**Résultat attendu:**
```json
{
  "success": true,
  "amenities": [...]
}
```

---

### 7. Test de Compatibilité (Annonces Existantes)

**Étapes:**
1. Ouvrir une annonce existante (créée avant la mise à jour)
2. Vérifier qu'elle s'affiche correctement
3. Essayer de la modifier
4. Vérifier que les nouveaux champs sont optionnels
5. Sauvegarder sans remplir les nouveaux champs
6. Vérifier que l'annonce fonctionne toujours

**Résultat attendu:**
- Les annonces existantes fonctionnent
- Pas d'erreur sur les champs manquants
- Les nouveaux champs sont optionnels

---

### 8. Test de Performance

**Étapes:**
1. Ouvrir le formulaire de création
2. Ouvrir les DevTools (F12)
3. Aller dans l'onglet Network
4. Naviguer vers l'étape 6 (Features)
5. Vérifier le chargement des amenities:
   - Temps de réponse < 500ms
   - Pas d'erreur 500
6. Sélectionner/désélectionner plusieurs amenities rapidement
7. Vérifier qu'il n'y a pas de lag

**Résultat attendu:**
- Chargement rapide des amenities
- Pas de lag lors de la sélection
- Interface fluide

---

## 🐛 Bugs Potentiels à Surveiller

### 1. Amenities
- [ ] Les amenities ne se chargent pas (erreur API)
- [ ] La sélection ne fonctionne pas
- [ ] Le compteur est incorrect
- [ ] Les amenities sélectionnées ne s'affichent pas

### 2. Description
- [ ] Les compteurs de caractères sont incorrects
- [ ] On peut sélectionner plus de 3 points forts
- [ ] Les sections ne sont pas enregistrées

### 3. Tarification
- [ ] L'incrément horaire ne fonctionne pas
- [ ] La durée minimum n'est pas enregistrée
- [ ] Les frais ne sont pas enregistrés

### 4. Réductions
- [ ] Les nouvelles réductions ne s'affichent pas
- [ ] Le preview ne fonctionne pas
- [ ] Les réductions ne sont pas enregistrées

### 5. Soumission
- [ ] Erreur lors de la soumission
- [ ] Les nouveaux champs ne sont pas envoyés
- [ ] Les amenities ne sont pas liées

---

## 📊 Checklist de Validation

### Backend
- [x] Schéma Prisma mis à jour
- [x] Migration appliquée
- [x] Amenities seedées
- [x] API amenities créée
- [x] API listing amenities créée
- [x] API listings mise à jour
- [x] Validations Zod complètes

### Frontend - Composants
- [x] AmenitiesSelector créé
- [x] BedConfiguration créé
- [ ] BedConfiguration intégré (étape 5)

### Frontend - Formulaire
- [x] Type FormData étendu
- [x] État initial mis à jour
- [ ] Étape 5 (Details) enrichie
- [x] Étape 6 (Features) remplacée
- [x] Étape 8 (Description) enrichie
- [x] Étape 9 (Pricing) enrichie
- [x] Étape 10 (Discounts) enrichie
- [x] handleSubmit mis à jour

### Tests
- [ ] Test étape 6 (Amenities)
- [ ] Test étape 8 (Description)
- [ ] Test étape 9 (Pricing)
- [ ] Test étape 10 (Discounts)
- [ ] Test soumission complète
- [ ] Test API amenities
- [ ] Test compatibilité
- [ ] Test performance

### Documentation
- [x] IMPLEMENTATION_SUMMARY.md créé
- [x] MEMORY.md mis à jour
- [x] TEST_GUIDE.md créé
- [x] Commit créé avec message détaillé

---

## 🚀 Commandes Utiles

### Démarrer le serveur
```bash
cd apps/web
npm run dev
```

### Vérifier les erreurs TypeScript
```bash
cd apps/web
npx tsc --noEmit --skipLibCheck
```

### Réinitialiser la base de données
```bash
cd apps/web
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

### Voir les amenities en DB
```bash
cd apps/web
npx prisma studio
# Ouvrir http://localhost:5555
# Aller dans la table Amenity
```

### Voir les logs du serveur
```bash
# Les logs s'affichent dans le terminal où npm run dev est lancé
```

---

## 📝 Notes

### Prochaine Étape Prioritaire
**Compléter l'étape 5 (Details)** avec les champs conditionnels par type d'espace:
- APARTMENT/HOUSE: bedrooms, bedConfiguration, bathroomsFull/Half
- HOUSE: floors, garden, pool, terrace
- STUDIO: studioType, height, greenScreen, soundproofing
- PARKING: type, dimensions, EV charger

### Estimation
- Tests manuels: 1-2 heures
- Correction de bugs: 1-2 heures
- Étape 5 (Details): 2-3 heures
- **Total: 4-7 heures**

---

## ✅ Validation Finale

Avant de considérer l'implémentation comme terminée:

1. ✅ Tous les tests passent
2. ✅ Aucune erreur TypeScript
3. ✅ Serveur démarre correctement
4. ✅ Création d'annonce fonctionne de bout en bout
5. ✅ Amenities sont enregistrées
6. ✅ Réductions sont enregistrées
7. ✅ Annonces existantes fonctionnent
8. ⏳ Étape 5 (Details) complétée
9. ⏳ EditListingClient synchronisé
10. ⏳ Tests de régression effectués
