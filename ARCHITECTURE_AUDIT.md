# 🏗️ Audit Architecture Composants - Lok'Room

## 📊 État Actuel

**71 fichiers à la racine de `src/components/`**
**17,866 lignes de code total**

### 🔴 Fichiers Monstres (>500 lignes)

| Fichier | Lignes | Problème |
|---------|--------|----------|
| `SearchModal.tsx` | 1,350 | 🔥 CRITIQUE - Devrait être découpé |
| `Navbar.tsx` | 1,053 | 🔥 CRITIQUE - Trop complexe |
| `Map.tsx` | 954 | 🔥 CRITIQUE - Logique métier mélangée |
| `CityIllustrations.tsx` | 899 | ⚠️ Données statiques, acceptable |
| `MobileBookingModal.tsx` | 784 | 🔥 CRITIQUE - Dupliquer logique BookingForm |
| `BookingForm.tsx` | 773 | 🔥 CRITIQUE - Formulaire monolithique |
| `EditListingImages.tsx` | 677 | ⚠️ Logique upload complexe |
| `CategoryIcon.tsx` | 538 | ⚠️ Switch géant, acceptable |
| `ListingReviews.tsx` | 527 | ⚠️ Affichage + pagination |

**Total fichiers >500 lignes: 9 fichiers = 7,555 lignes (42% du code)**

---

## 📁 Sous-dossiers Existants

✅ Déjà organisés:
- `accessibility/` - Composants accessibilité
- `admin/` - Interface admin
- `calendar/` - Calendrier réservations
- `chat/` - Messagerie
- `home/` - Page d'accueil
- `host/` - Interface hôte
- `layout/` - Layouts
- `lazy/` - Lazy loading
- `listings/` - Annonces
- `messages/` - Messages
- `notifications/` - Notifications
- `recommendations/` - Recommandations
- `reviews/` - Avis
- `search/` - Recherche
- `seo/` - SEO
- `ui/` - Composants UI génériques

---

## 🎯 Proposition Réorganisation

### Catégorie 1: Booking (Réservations)
**À déplacer vers `src/components/booking/`**

```
booking/
├── BookingForm.tsx (773 lignes)
├── MobileBookingModal.tsx (784 lignes)
├── BookingReviewForm.tsx
├── CancelBookingButton.tsx (278 lignes)
├── SecurityDepositBadge.tsx
├── SecurityDepositClaim.tsx (353 lignes)
├── SecurityDepositInfo.tsx
├── SecurityDepositStatus.tsx
└── InstantBookBadge.tsx (226 lignes)
```

**Impact:** 9 fichiers, ~3,000 lignes

---

### Catégorie 2: Navigation
**À déplacer vers `src/components/navigation/`**

```
navigation/
├── Navbar.tsx (1,053 lignes) ⚠️ À découper
├── MobileNavBar.tsx
├── Footer.tsx (254 lignes)
├── UserTopBar.tsx
└── TopbarLanguageButton.tsx
```

**Impact:** 5 fichiers, ~1,400 lignes

---

### Catégorie 3: Maps & Location
**À déplacer vers `src/components/maps/`**

```
maps/
├── Map.tsx (954 lignes) ⚠️ À découper
├── GoogleMapsLoader.tsx
├── LocationAutocomplete.tsx (375 lignes)
├── MapExpandButton.tsx
└── CityIllustrations.tsx (899 lignes - données)
```

**Impact:** 5 fichiers, ~2,300 lignes

---

### Catégorie 4: Modals
**À déplacer vers `src/components/modals/`**

```
modals/
├── SearchModal.tsx (1,350 lignes) 🔥 À découper d'abord
├── AmenitiesModal.tsx
├── WishlistModal.tsx (292 lignes)
└── LanguageCurrencyModal.tsx
```

**Impact:** 4 fichiers, ~1,700 lignes

---

### Catégorie 5: Forms
**À déplacer vers `src/components/forms/`**

```
forms/
├── EditListingForm.tsx (401 lignes)
├── EditListingImages.tsx (677 lignes)
├── HostProfileForm.tsx (253 lignes)
├── DateTimePicker.tsx (433 lignes)
├── PasswordInput.tsx (330 lignes)
└── ListingImagesManager.tsx
```

**Impact:** 6 fichiers, ~2,100 lignes

---

### Catégorie 6: User & Auth
**À déplacer vers `src/components/user/`**

```
user/
├── user-avatar.tsx (déjà existe)
├── UserBadges.tsx
├── KycWarning.tsx
└── ShareButton.tsx
```

**Impact:** 4 fichiers

---

### Catégorie 7: Payments
**À déplacer vers `src/components/payments/`**

```
payments/
├── PayPalButton.tsx (308 lignes)
├── WithdrawButton.tsx
└── DisputeAssistant.tsx (324 lignes)
```

**Impact:** 3 fichiers, ~650 lignes

---

### Catégorie 8: Settings & Preferences
**À déplacer vers `src/components/settings/`**

```
settings/
├── LanguageSwitcher.tsx
├── LocaleSwitcher.tsx
├── CurrencySwitcher.tsx
├── CurrencyNotice.tsx
├── ThemeToggle.tsx
├── TranslationToggle.tsx (303 lignes)
└── InstantBookSettings.tsx (442 lignes)
```

**Impact:** 7 fichiers, ~800 lignes

---

### Catégorie 9: Providers & Context
**À déplacer vers `src/components/providers/`**

```
providers/
├── providers.tsx (déjà existe)
├── SessionProviderWrapper.tsx
├── ThemeProvider.tsx
└── ServiceWorkerRegistration.tsx
```

**Impact:** 4 fichiers

---

### Catégorie 10: Error Handling
**À déplacer vers `src/components/errors/`**

```
errors/
├── ErrorBoundary.tsx
├── ComponentErrorBoundary.tsx
├── PageErrorBoundary.tsx
└── SentryErrorBoundary.tsx
```

**Impact:** 4 fichiers

---

### Catégorie 11: Utilities (Rester à la racine)
**Composants génériques/utilitaires**

```
components/ (racine)
├── Analytics.tsx
├── ConditionalLayout.tsx
├── CookieBanner.tsx (296 lignes)
├── FavoriteButton.tsx (231 lignes)
├── BecomeHostButton.tsx
├── DeleteListingButton.tsx
├── LoadingStates.tsx
├── MaintenanceRedirect.tsx
├── NotificationBell.tsx (289 lignes)
├── SplashScreen.tsx
├── TranslatedMessage.tsx
├── toaster-client.tsx
├── CategoryIcon.tsx (538 lignes - switch géant)
├── HomeClient.tsx (237 lignes)
├── HomeClientSkeleton.tsx
├── ListingFilters.tsx (243 lignes)
├── ListingGallery.tsx (485 lignes)
├── ListingReviews.tsx (527 lignes)
└── ListingsResultsWithMap.tsx
```

**Impact:** ~20 fichiers restants à la racine (au lieu de 71)

---

## 🔥 Fichiers à Découper EN PRIORITÉ

### 1. SearchModal.tsx (1,350 lignes)
**Découpage proposé:**

```
modals/search/
├── SearchModal.tsx (orchestrateur, ~200 lignes)
├── SearchFilters.tsx (~300 lignes)
├── SearchResults.tsx (~300 lignes)
├── SearchSuggestions.tsx (~200 lignes)
├── SearchDatePicker.tsx (~150 lignes)
├── SearchGuestPicker.tsx (~100 lignes)
└── SearchPriceRange.tsx (~100 lignes)
```

---

### 2. Navbar.tsx (1,053 lignes)
**Découpage proposé:**

```
navigation/
├── Navbar.tsx (orchestrateur, ~150 lignes)
├── NavbarDesktop.tsx (~300 lignes)
├── NavbarMobile.tsx (~250 lignes)
├── NavbarUserMenu.tsx (~200 lignes)
└── NavbarSearch.tsx (~150 lignes)
```

---

### 3. Map.tsx (954 lignes)
**Découpage proposé:**

```
maps/
├── Map.tsx (orchestrateur, ~150 lignes)
├── MapMarkers.tsx (~250 lignes)
├── MapControls.tsx (~200 lignes)
├── MapClustering.tsx (~200 lignes)
└── MapPopup.tsx (~150 lignes)
```

---

### 4. BookingForm.tsx (773 lignes)
**Découpage proposé:**

```
booking/
├── BookingForm.tsx (orchestrateur, ~150 lignes)
├── BookingDateSelector.tsx (~200 lignes)
├── BookingGuestSelector.tsx (~150 lignes)
├── BookingPriceBreakdown.tsx (~150 lignes)
└── BookingSubmit.tsx (~120 lignes)
```

---

### 5. MobileBookingModal.tsx (784 lignes)
**Action:** Fusionner avec BookingForm.tsx (logique dupliquée)
- Créer `BookingFormMobile.tsx` qui réutilise les sous-composants
- Supprimer duplication

---

## 📋 Plan d'Action

### Phase 1: Découpage Fichiers Critiques (Cette semaine)
1. ✅ SearchModal.tsx → 7 sous-composants
2. ✅ Navbar.tsx → 5 sous-composants
3. ✅ Map.tsx → 5 sous-composants
4. ✅ BookingForm.tsx + MobileBookingModal.tsx → composants partagés

**Gain:** ~4,700 lignes réorganisées, 71 → 55 fichiers racine

---

### Phase 2: Réorganisation Dossiers (Semaine prochaine)
1. ✅ Créer 10 nouveaux dossiers
2. ✅ Déplacer 51 fichiers
3. ✅ Mettre à jour imports (script automatique)
4. ✅ Tester build

**Gain:** 71 → 20 fichiers racine

---

### Phase 3: Optimisations (Ce mois)
1. ⏳ Lazy loading composants lourds
2. ⏳ Code splitting routes
3. ⏳ Tree-shaking optimisations

**Gain:** Bundle size 500KB → <200KB

---

## 🧪 Script Migration Automatique

```bash
#!/bin/bash
# scripts/reorganize-components.sh

# Créer nouveaux dossiers
mkdir -p src/components/{booking,navigation,maps,modals,forms,user,payments,settings,providers,errors}

# Déplacer fichiers booking
mv src/components/{BookingForm,MobileBookingModal,BookingReviewForm,CancelBookingButton,SecurityDeposit*,InstantBookBadge}.tsx src/components/booking/

# Déplacer fichiers navigation
mv src/components/{Navbar,MobileNavBar,Footer,UserTopBar,TopbarLanguageButton}.tsx src/components/navigation/

# ... etc pour chaque catégorie

# Mettre à jour imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/components/BookingForm|@/components/booking/BookingForm|g'

# Tester build
npm run build
```

---

## 📊 Métriques Avant/Après

| Métrique | Avant | Après Phase 1 | Après Phase 2 |
|----------|-------|---------------|---------------|
| Fichiers racine | 71 | 55 | 20 |
| Fichiers >500 lignes | 9 | 2 | 2 |
| Fichiers >1000 lignes | 3 | 0 | 0 |
| Dossiers organisés | 16 | 16 | 26 |
| Lisibilité | 4/10 | 7/10 | 9/10 |

---

## ⚠️ Risques & Précautions

1. **Imports cassés** → Script automatique + tests
2. **Lazy loading cassé** → Vérifier dynamic imports
3. **Build time** → Tester après chaque phase
4. **Git history** → Utiliser `git mv` pour préserver historique

---

## 📝 Checklist Exécution

### Phase 1 (Découpage)
- [ ] Découper SearchModal.tsx
- [ ] Découper Navbar.tsx
- [ ] Découper Map.tsx
- [ ] Découper BookingForm.tsx
- [ ] Fusionner MobileBookingModal.tsx
- [ ] Tester chaque composant
- [ ] Commit après chaque découpage

### Phase 2 (Réorganisation)
- [ ] Créer script migration
- [ ] Tester script sur branche test
- [ ] Exécuter migration
- [ ] Mettre à jour imports
- [ ] Tester build
- [ ] Tester app en dev
- [ ] Commit

### Phase 3 (Optimisation)
- [ ] Analyser bundle actuel
- [ ] Identifier composants à lazy load
- [ ] Implémenter lazy loading
- [ ] Mesurer gain bundle size
- [ ] Commit

---

**Dernière mise à jour:** 2026-03-09
**Statut:** Audit complété, prêt pour Phase 1
