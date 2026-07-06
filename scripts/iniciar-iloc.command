#!/bin/bash
#
# iniciar-iloc.command — Ejecutar en la Mac con High Sierra.
#
# Sirve la app ya compilada (carpeta ./dist adyacente) en http://localhost:8080
# y la abre en Google Chrome. No requiere Node: usa el Python que ya trae macOS.
#
# El puerto es FIJO (8080) a propósito: IndexedDB guarda los datos por origen
# (URL + puerto), así que mantenerlo constante garantiza que el inventario y las
# ventas se conserven entre sesiones.
#
PORT=8080
URL="http://localhost:$PORT"

# Ubicarse en la carpeta de este script (donde está ./dist).
cd "$(dirname "$0")"

if [ ! -d "dist" ]; then
  echo "ERROR: no encuentro la carpeta 'dist' junto a este script."
  echo "Asegúrate de descomprimir el paquete completo antes de ejecutarlo."
  echo ""
  echo "Presiona Enter para cerrar."
  read -r _
  exit 1
fi

echo "==============================================="
echo "  iLoc Inventory"
echo "  Sirviendo en: $URL"
echo "  Para cerrar la app: cierra esta ventana."
echo "==============================================="
echo ""

# Elegir un servidor estático: Python 3 si existe, si no el Python 2 de macOS.
start_server() {
  if command -v python3 >/dev/null 2>&1; then
    exec python3 -m http.server "$PORT" --directory dist
  elif command -v python >/dev/null 2>&1; then
    # Python 2.7 (incluido en High Sierra): SimpleHTTPServer sirve el dir actual.
    cd dist
    exec python -m SimpleHTTPServer "$PORT"
  else
    echo "ERROR: no encontré Python para levantar el servidor."
    echo "Presiona Enter para cerrar."
    read -r _
    exit 1
  fi
}

# Abrir Chrome apuntando a la app un instante después de arrancar el servidor.
(
  sleep 1
  if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "$URL"
  else
    echo ""
    echo "AVISO: no encontré Google Chrome. Ábrelo manualmente en: $URL"
    echo "(Safari/Firefox de High Sierra NO mostrarán bien la app.)"
    open "$URL" 2>/dev/null || true
  fi
) &

start_server
