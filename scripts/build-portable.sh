#!/bin/bash
#
# build-portable.sh — Ejecutar en una Mac MODERNA (no en High Sierra).
#
# Compila la app y genera un paquete portable (iloc-portable.zip) que puedes
# copiar a la Mac con High Sierra. Allá solo se descomprime y se hace doble
# clic en "iniciar-iloc.command" — no requiere Node ni compilar nada.
#
set -euo pipefail

# Ubicarse en la raíz del proyecto (carpeta padre de este script).
cd "$(dirname "$0")/.."

echo "==> Instalando dependencias..."
npm install

echo "==> Compilando app (npm run build)..."
npm run build

echo "==> Empaquetando bundle portable..."
OUT="iloc-portable"
rm -rf "$OUT" "$OUT.zip"
mkdir -p "$OUT"
cp -R dist "$OUT/dist"
cp scripts/iniciar-iloc.command "$OUT/iniciar-iloc.command"
chmod +x "$OUT/iniciar-iloc.command"

# LÉEME con instrucciones dentro del paquete.
cat > "$OUT/LEEME.txt" <<'TXT'
iLoc Inventory — paquete portable
=================================

Requisito: Google Chrome versión 116 o inferior (la última compatible con
macOS High Sierra 10.13). Safari y Firefox de esa versión NO sirven.

Cómo usar:
  1. Descomprime esta carpeta donde quieras (ej. el Escritorio).
  2. Haz doble clic en "iniciar-iloc.command".
     - Si macOS bloquea el archivo: clic derecho > Abrir > Abrir.
  3. Se abrirá una terminal (déjala abierta) y Chrome con la app.
  4. Para cerrar la app, cierra esa ventana de terminal.

Los datos (inventario, ventas, etc.) se guardan en Chrome, en esta máquina.
Se conservan entre reinicios mientras uses siempre esta misma app en
http://localhost:8080 y no borres los datos de navegación de Chrome.

Para pasar datos desde otra máquina: en la app original ve a
Configuración > Exportar todo (JSON), copia el archivo aquí e impórtalo
en Configuración > Importar respaldo (JSON).
TXT

echo "==> Comprimiendo..."
zip -rq "$OUT.zip" "$OUT"

echo ""
echo "Listo ✅  Copia 'iloc-portable.zip' a la Mac con High Sierra."
echo "     Tamaño: $(du -h "$OUT.zip" | cut -f1)"
