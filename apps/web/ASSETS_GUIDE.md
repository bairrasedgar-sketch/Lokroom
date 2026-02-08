# 🎨 Guide de Création des Assets Mobile

## 📐 Dimensions Requises

### Icône de l'Application
- **Taille source** : 1024x1024 px
- **Format** : PNG avec fond opaque (pas de transparence)
- **Nom** : `icon.png`
- **Emplacement** : `apps/web/public/icon.png`

### Splash Screen
- **Taille source** : 2732x2732 px (carré)
- **Format** : PNG
- **Nom** : `splash.png`
- **Emplacement** : `apps/web/public/splash.png`

---

## 🎨 Recommandations de Design

### Icône (icon.png)
```
┌─────────────────────┐
│                     │
│                     │
│      [LOGO]         │
│     Lok'Room        │
│                     │
│                     │
└─────────────────────┘
```

**Bonnes pratiques :**
- ✅ Logo simple et reconnaissable
- ✅ Contraste élevé
- ✅ Pas de texte trop petit (illisible sur petite icône)
- ✅ Fond uni ou dégradé simple
- ✅ Centré avec marges (safe area)
- ❌ Pas de transparence
- ❌ Pas de détails trop fins
- ❌ Pas de texte long

**Couleurs suggérées pour Lok'Room :**
- Fond : Blanc (#FFFFFF) ou Beige (#F5EFE6)
- Logo : Noir (#000000) ou Vert (#A5D8A1)
- Accent : Rose (#EC4899) ou Bleu (#3B82F6)

### Splash Screen (splash.png)
```
┌─────────────────────┐
│                     │
│                     │
│                     │
│      [LOGO]         │
│     Lok'Room        │
│                     │
│                     │
│                     │
└─────────────────────┘
```

**Bonnes pratiques :**
- ✅ Logo centré
- ✅ Beaucoup d'espace vide (sera cropé sur différents écrans)
- ✅ Zone de sécurité : 1200x1200 px au centre
- ✅ Fond uni (blanc recommandé)
- ✅ Peut inclure le nom de l'app sous le logo

---

## 🛠️ Outils pour Créer les Assets

### Option 1 : Figma (Recommandé)
**Gratuit et professionnel**

1. Créer un compte sur https://figma.com
2. Créer un nouveau fichier
3. Créer un frame 1024x1024 pour l'icône
4. Créer un frame 2732x2732 pour le splash
5. Designer avec les outils Figma
6. Exporter en PNG

**Template Figma prêt à l'emploi :**
- Chercher "App Icon Template" dans Figma Community
- Dupliquer et personnaliser

### Option 2 : Canva
**Très simple, gratuit**

1. Aller sur https://canva.com
2. Créer un design personnalisé 1024x1024
3. Ajouter logo, texte, formes
4. Télécharger en PNG
5. Répéter pour 2732x2732

### Option 3 : Photoshop / Illustrator
**Professionnel mais payant**

1. Nouveau document 1024x1024 px, 72 DPI
2. Designer l'icône
3. Exporter en PNG
4. Répéter pour 2732x2732

### Option 4 : Générateur en ligne
**Rapide mais moins personnalisé**

- https://icon.kitchen - Générateur d'icônes
- https://www.appicon.co - Générateur complet
- https://apetools.webprofusion.com - App Icon Generator

---

## 🤖 Génération Automatique des Tailles

Une fois que tu as `icon.png` et `splash.png` dans `apps/web/public/` :

```bash
# Installer l'outil
npm install -g @capacitor/assets

# Aller dans le dossier web
cd apps/web

# Générer toutes les tailles automatiquement
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'
```

**Ce que ça génère :**

**iOS :**
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (toutes les tailles d'icônes)
- `ios/App/App/Assets.xcassets/Splash.imageset/` (splash screens)

**Android :**
- `android/app/src/main/res/mipmap-*/` (icônes)
- `android/app/src/main/res/drawable-*/` (splash screens)

---

## 📝 Template Rapide (Si tu veux commencer vite)

### Icône Minimaliste
```
Fond : Blanc (#FFFFFF)
Texte : "LR" en gros (pour Lok'Room)
Police : Bold, moderne (Inter, SF Pro, Roboto)
Couleur texte : Noir (#000000)
```

### Splash Screen Minimaliste
```
Fond : Blanc (#FFFFFF)
Logo : "Lok'Room" centré
Police : Bold, grande taille
Couleur : Noir (#000000)
Sous-titre : "Location d'espaces" (optionnel)
```

---

## ✅ Checklist Assets

Avant de générer les tailles :
- [ ] `icon.png` créé (1024x1024 px)
- [ ] `splash.png` créé (2732x2732 px)
- [ ] Fichiers placés dans `apps/web/public/`
- [ ] Fond opaque (pas de transparence)
- [ ] Logo centré avec marges
- [ ] Contraste suffisant
- [ ] Testé visuellement (zoom in/out)

Après génération :
- [ ] Toutes les tailles générées dans `ios/` et `android/`
- [ ] Vérifier visuellement quelques tailles
- [ ] Commit et push des assets

---

## 🎯 Prochaine Étape

Une fois les assets créés :

```bash
# 1. Placer icon.png et splash.png dans apps/web/public/

# 2. Générer toutes les tailles
cd apps/web
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'

# 3. Faire le premier build
npm run mobile:build

# 4. Tester sur simulateur
npm run cap:open:ios      # ou
npm run cap:open:android
```

---

**Besoin d'aide pour créer les assets ? Dis-moi et je te guide ! 🎨**
