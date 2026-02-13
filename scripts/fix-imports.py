#!/usr/bin/env python3
"""
Script pour corriger tous les imports cassés après l'ajout du logger
"""

import os
import re
from pathlib import Path

def fix_broken_imports(file_path):
    """Corrige les imports cassés dans un fichier"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Pattern: import {\nimport { logger } from "@/lib/logger";\n\n  SomeIcon,
    # Remplacer par: import { logger } from "@/lib/logger";\nimport {\n  SomeIcon,
    pattern = r'import \{\nimport \{ logger \} from "@/lib/logger";\n\n'
    replacement = 'import { logger } from "@/lib/logger";\nimport {\n'
    content = re.sub(pattern, replacement, content)

    # Si le contenu a changé, écrire le fichier
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path(__file__).parent.parent / 'apps' / 'web' / 'src'

    fixed_count = 0

    # Parcourir tous les fichiers .ts et .tsx
    for file_path in src_dir.rglob('*.tsx'):
        if fix_broken_imports(file_path):
            print(f"Fixed: {file_path.relative_to(src_dir)}")
            fixed_count += 1

    for file_path in src_dir.rglob('*.ts'):
        if fix_broken_imports(file_path):
            print(f"Fixed: {file_path.relative_to(src_dir)}")
            fixed_count += 1

    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
