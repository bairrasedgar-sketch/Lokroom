# Script de Nettoyage des Images Originales

Ce script supprime les fichiers PNG/JPG originaux après vérification que les versions WebP fonctionnent correctement.

## Fichiers à Supprimer

### Dans `apps/web/public/`
- email-logo.png
- Logo LokRoom application.png
- illustration final.png
- illustration final 2.png
- interface admin support utilsateurs.png
- exemple airbnb style.jpeg
- exemple taille et emplacement point blanc.png
- map-marker-lokroom.png
- map-marker-lokroom-2.png
- map-marker-lokroom-creation.png
- map-marker-lokroom interieur-2.png
- location-pin.png
- toggle-switch-buttons-icon-on-260nw-2181295197.png

### Dans `apps/web/public/images/`
- lyon.jpg
- lyon_new.jpg
- marseille.jpg
- marseille_new.jpg

### À CONSERVER (fichiers système)
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png
- android-chrome-192x192.png
- android-chrome-512x512.png
- icon.png
- google/*.png (boutons Google)
- apple/*.png (boutons Apple)

## Commandes de Nettoyage

### Windows (PowerShell)
```powershell
cd "C:\Users\bairr\Downloads\lokroom-starter\apps\web\public"

# Supprimer les images converties
Remove-Item "email-logo.png"
Remove-Item "Logo LokRoom application.png"
Remove-Item "illustration final.png"
Remove-Item "illustration final 2.png"
Remove-Item "interface admin support utilsateurs.png"
Remove-Item "exemple airbnb style.jpeg"
Remove-Item "exemple taille et emplacement point blanc.png"
Remove-Item "map-marker-lokroom.png"
Remove-Item "map-marker-lokroom-2.png"
Remove-Item "map-marker-lokroom-creation.png"
Remove-Item "map-marker-lokroom interieur-2.png"
Remove-Item "location-pin.png"
Remove-Item "toggle-switch-buttons-icon-on-260nw-2181295197.png"

# Supprimer les images dans le dossier images/
Remove-Item "images\lyon.jpg"
Remove-Item "images\lyon_new.jpg"
Remove-Item "images\marseille.jpg"
Remove-Item "images\marseille_new.jpg"
```

### Windows (CMD)
```cmd
cd "C:\Users\bairr\Downloads\lokroom-starter\apps\web\public"

del "email-logo.png"
del "Logo LokRoom application.png"
del "illustration final.png"
del "illustration final 2.png"
del "interface admin support utilsateurs.png"
del "exemple airbnb style.jpeg"
del "exemple taille et emplacement point blanc.png"
del "map-marker-lokroom.png"
del "map-marker-lokroom-2.png"
del "map-marker-lokroom-creation.png"
del "map-marker-lokroom interieur-2.png"
del "location-pin.png"
del "toggle-switch-buttons-icon-on-260nw-2181295197.png"

del "images\lyon.jpg"
del "images\lyon_new.jpg"
del "images\marseille.jpg"
del "images\marseille_new.jpg"
```

## Vérification Avant Nettoyage

Avant de supprimer les fichiers originaux, vérifiez que:

1. ✅ Le site fonctionne correctement avec les images WebP
2. ✅ Les emails affichent le logo WebP
3. ✅ Les marqueurs de carte s'affichent correctement
4. ✅ La création/édition d'annonces fonctionne
5. ✅ Toutes les pages chargent les images WebP

## Backups

Les fichiers originaux sont sauvegardés dans:
- `apps/web/public/images-backup/` (backup existant)
- `apps/web/public/images/originals/` (backup du script)

Vous pouvez restaurer les originaux à tout moment depuis ces dossiers.

## Gain d'Espace

Après nettoyage, vous économiserez:
- **2.02 MB** d'espace disque
- Les fichiers WebP sont 70% plus petits
- Les backups restent disponibles pour restauration

## Note

Ne supprimez PAS les fichiers suivants (nécessaires pour le fonctionnement):
- Tous les fichiers dans `images-backup/` (backups)
- Tous les fichiers dans `images/originals/` (backups)
- Les favicons et icônes système
- Les boutons Google/Apple
