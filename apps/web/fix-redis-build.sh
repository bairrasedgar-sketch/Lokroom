#!/bin/bash
# Désactiver Redis pendant le build en ajoutant des checks

files=(
  "src/app/api/amenities/route.ts"
  "src/app/api/bookings/route.ts"
  "src/app/api/cache/clear/route.ts"
  "src/app/api/cache/stats/route.ts"
  "src/app/api/health/redis/route.ts"
  "src/app/api/listings/[id]/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Remplacer import cache par cache-safe
    sed -i 's|from "@/lib/redis/cache"|from "@/lib/redis/cache-safe"|g' "$file"
    sed -i 's|from "@/lib/redis"|from "@/lib/redis/cache-safe"|g' "$file"
    echo "✓ Fixed: $file"
  fi
done
