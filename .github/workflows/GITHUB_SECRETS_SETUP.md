# Configuration des Secrets GitHub pour Android Build

Ce document explique comment configurer les secrets GitHub nécessaires pour le build automatique de l'application Android.

## Secrets Requis

### 1. KEYSTORE_BASE64
Le keystore encodé en base64 pour signer l'application.

**Génération**:
```bash
# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android/app/release.keystore"))

# Linux/Mac
base64 -i android/app/release.keystore | tr -d '\n'
```

**Configuration**:
1. Aller sur GitHub: `Settings` > `Secrets and variables` > `Actions`
2. Cliquer sur `New repository secret`
3. Name: `KEYSTORE_BASE64`
4. Value: Coller la chaîne base64 générée

### 2. KEYSTORE_PASSWORD
Le mot de passe du keystore.

**Configuration**:
- Name: `KEYSTORE_PASSWORD`
- Value: Le mot de passe que vous avez défini lors de la création du keystore

### 3. KEY_ALIAS
L'alias de la clé dans le keystore.

**Configuration**:
- Name: `KEY_ALIAS`
- Value: `lokroom` (ou l'alias que vous avez utilisé)

### 4. KEY_PASSWORD
Le mot de passe de la clé.

**Configuration**:
- Name: `KEY_PASSWORD`
- Value: Le mot de passe de la clé (souvent identique à KEYSTORE_PASSWORD)

### 5. DATABASE_URL
L'URL de connexion à la base de données.

**Configuration**:
- Name: `DATABASE_URL`
- Value: Votre URL de base de données PostgreSQL

### 6. NEXTAUTH_SECRET
Le secret pour NextAuth.

**Configuration**:
- Name: `NEXTAUTH_SECRET`
- Value: Votre secret NextAuth (déjà configuré)

### 7. NEXTAUTH_URL
L'URL de l'application.

**Configuration**:
- Name: `NEXTAUTH_URL`
- Value: `https://www.lokroom.com`

## Vérification des Secrets

Pour vérifier que tous les secrets sont configurés:

1. Aller sur GitHub: `Settings` > `Secrets and variables` > `Actions`
2. Vérifier que tous les secrets suivants sont présents:
   - ✅ KEYSTORE_BASE64
   - ✅ KEYSTORE_PASSWORD
   - ✅ KEY_ALIAS
   - ✅ KEY_PASSWORD
   - ✅ DATABASE_URL
   - ✅ NEXTAUTH_SECRET
   - ✅ NEXTAUTH_URL

## Déclenchement du Build

### Build Automatique
Le workflow se déclenche automatiquement sur:
- Push sur la branche `main`
- Création d'un tag `v*` (ex: `v1.0.0`)

### Build Manuel
1. Aller sur GitHub: `Actions` > `Build Android APK`
2. Cliquer sur `Run workflow`
3. Sélectionner la branche
4. Cliquer sur `Run workflow`

## Téléchargement des Artifacts

Après un build réussi:

1. Aller sur GitHub: `Actions`
2. Cliquer sur le workflow terminé
3. Télécharger les artifacts:
   - `app-release-apk`: APK signé
   - `app-release-aab`: Android App Bundle signé

## Création d'une Release

Pour créer une release avec les fichiers Android:

```bash
# Créer un tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Le workflow créera automatiquement une release GitHub avec:
- APK signé
- AAB signé
- Notes de version

## Troubleshooting

### Erreur: "Keystore not found"
- Vérifier que `KEYSTORE_BASE64` est correctement encodé
- Vérifier qu'il n'y a pas de retours à la ligne dans le secret

### Erreur: "Invalid keystore format"
- Régénérer le keystore
- Réencoder en base64 sans retours à la ligne

### Erreur: "Wrong password"
- Vérifier `KEYSTORE_PASSWORD` et `KEY_PASSWORD`
- S'assurer qu'ils correspondent au keystore

### Build échoue à l'étape "Build Next.js"
- Vérifier que `DATABASE_URL` est correct
- Vérifier que tous les secrets NextAuth sont configurés

## Sécurité

**IMPORTANT**:
- Ne JAMAIS commiter le keystore dans Git
- Ne JAMAIS partager les mots de passe du keystore
- Sauvegarder le keystore dans un endroit sécurisé
- Utiliser des secrets GitHub pour les informations sensibles

## Support

Pour toute question:
- Consulter la [documentation GitHub Actions](https://docs.github.com/en/actions)
- Ouvrir une issue sur le repository
