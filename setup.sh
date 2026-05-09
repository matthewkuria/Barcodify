#!/bin/bash

# ==========================================
# Advanced QR & Barcode Generator Setup
# ==========================================

echo "Creating project structure..."

# Root folders
mkdir -p project
cd project || exit

# Main folders
mkdir -p templates
mkdir -p static
mkdir -p uploads
mkdir -p exports
mkdir -p icons

# Main files
touch app.py
touch requirements.txt
touch database.db

# Template files
touch templates/index.html

# Static files
touch static/style.css
touch static/script.js
touch static/scanner.js

# Optional README
touch README.md

echo "Project structure created successfully."

echo ""
echo "Structure:"
echo ""

tree . 2>/dev/null || find .

echo ""
echo "Done."