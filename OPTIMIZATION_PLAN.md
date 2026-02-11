# Plan d'Optimisation des Images Lok'Room

## État Actuel

### Images Détectées
- `lyon.jpg` (60KB)
- `lyon_new.jpg` (taille inconnue)
- `marseille.jpg` (taille inconnue)
- `marseille_new.jpg` (225KB)
- `lyon.webp` (déjà optimisé)
- `lyon_new.webp` (déjà optimisé)
- `marseille.webp` (déjà optimisé)
- `marseille_new.webp` (déjà optimisé)
- `bordeaux.webp` (déjà optimisé)

### Utilisation dans le Code
Les images sont référencées dans:
- `apps/web/src/components/SearchModal.tsx` - Utilise déjà `.webp`
- `apps/web/src/components/search/SearchDestination.tsx` - Utilise déjà `.webp`

## Actions à Effectuer

### 1. Installation de Sharp
```bash
npm install
```

### 2. Exécution du Script d'Optimisation
```bash
npm run optimize:images
```

### 3. Vérification Post-Optimisation
- Vérifier que les images `.jpg` ont été converties en `.webp`
- Vérifier que les backups sont dans `apps/web/public/images/originals/`
- Vérifier le rapport d'optimisation

### 4. Nettoyage (Optionnel)
Après vérification que tout fonctionne:
- Supprimer les fichiers `.jpg` originaux (backups dans `originals/`)
- Garder uniquement les `.webp`

## Configuration Next.js

La configuration est déjà optimale dans `next.config.mjs`:
```javascript
formats: ['image/avif', 'image/webp']
```

## Résultat Attendu

- Toutes les images converties en WebP
- Qualité: 85%
- Taille cible: < 200KB par image
- Gain estimé: 30-50% de réduction de taille
