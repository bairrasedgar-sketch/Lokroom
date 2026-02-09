#!/bin/bash
# Fixer toutes les routes qui ont dynamic mal placé

routes=(
  "src/app/api/auth/2fa/status/route.ts"
  "src/app/api/auth/mobile/me/route.ts"
  "src/app/api/host/stripe/status/route.ts"
  "src/app/api/notifications/preferences/route.ts"
)

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    # Créer un fichier temporaire
    temp_file=$(mktemp)
    
    # Extraire la ligne dynamic
    dynamic_line=$(grep "export const dynamic" "$route" || echo "")
    
    if [ -n "$dynamic_line" ]; then
      # Supprimer la ligne dynamic de sa position actuelle
      grep -v "export const dynamic" "$route" > "$temp_file"
      
      # Ajouter dynamic en première ligne
      echo 'export const dynamic = "force-dynamic";' > "$route"
      echo "" >> "$route"
      cat "$temp_file" >> "$route"
      
      echo "✓ Fixed: $route"
    else
      # Ajouter dynamic en première ligne si absent
      echo 'export const dynamic = "force-dynamic";' > "$temp_file"
      echo "" >> "$temp_file"
      cat "$route" >> "$temp_file"
      mv "$temp_file" "$route"
      
      echo "✓ Added dynamic to: $route"
    fi
    
    rm -f "$temp_file"
  fi
done
