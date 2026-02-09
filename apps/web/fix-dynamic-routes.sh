#!/bin/bash
# Script pour ajouter export const dynamic = "force-dynamic" aux routes API

routes=(
  "src/app/api/admin/system-logs/route.ts"
  "src/app/api/auth/2fa/status/route.ts"
  "src/app/api/auth/mobile/me/route.ts"
  "src/app/api/host/stripe/status/route.ts"
  "src/app/api/notifications/preferences/route.ts"
)

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    # Vérifier si la ligne n'existe pas déjà
    if ! grep -q "export const dynamic" "$route"; then
      # Ajouter après les imports
      sed -i '1a export const dynamic = "force-dynamic";' "$route"
      echo "✓ Fixed: $route"
    else
      echo "○ Already fixed: $route"
    fi
  else
    echo "✗ Not found: $route"
  fi
done
