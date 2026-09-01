#!/bin/bash

# ==========================================
# CONFIGURACIÓN
# ==========================================

TFG_DIR="$HOME/Documentos/TFG"
BACKEND_DIR="$TFG_DIR/backend"
FRONTEND_DIR="$TFG_DIR/frontend"

ENV_FILE_FRONTEND="$FRONTEND_DIR/.env"
ENV_FILE_BACKEND="$BACKEND_DIR/.env"

BACKEND_LOG_FILE="/tmp/cloudflared-backend-tfg.log"
FRONTEND_LOG_FILE="/tmp/cloudflared-frontend-tfg.log"

# ==========================================
# COMPROBAR DIRECTORIOS
# ==========================================

if [ ! -d "$BACKEND_DIR" ]; then
    echo "No existe el directorio del backend:"
    echo "$BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "No existe el directorio del frontend:"
    echo "$FRONTEND_DIR"
    exit 1
fi


echo "=========================================="
echo "       INICIANDO TFG AGROTASK"
echo "=========================================="


# ==========================================
# 1. COMPROBAR PUERTOS
# ==========================================

echo ""
echo "Comprobando puertos..."

if nc -z localhost 3000 2>/dev/null; then
    echo ""
    echo "El puerto 3000 ya está en uso."
    echo ""
    echo "Probablemente ya hay un backend ejecutándose."
    echo "Cierra el backend existente y vuelve a ejecutar el script."
    exit 1
fi

if nc -z localhost 5173 2>/dev/null; then
    echo ""
    echo "El puerto 5173 ya está en uso."
    echo ""
    echo "Probablemente ya hay un frontend ejecutándose."
    echo "Cierra el frontend existente y vuelve a ejecutar el script."
    exit 1
fi

echo "Los puertos 3000 y 5173 están libres."


# ==========================================
# 2. LIMPIAR DIST
# ==========================================

echo ""
echo "Eliminando dist..."

rm -rf "$FRONTEND_DIR/dist"


# ==========================================
# 3. INICIAR BACKEND
# ==========================================

echo ""
echo "Iniciando backend..."

gnome-terminal -- bash -c "
    cd '$BACKEND_DIR'
    echo '===== BACKEND ====='
    pnpm run dev
    exec bash
"


# ==========================================
# 4. ESPERAR BACKEND
# ==========================================

echo ""
echo "Esperando a que el backend esté disponible en el puerto 3000..."

BACKEND_READY=false

for i in {1..30}; do

    if nc -z localhost 3000 2>/dev/null; then
        BACKEND_READY=true
        echo "Backend disponible."
        break
    fi

    sleep 1

done


if [ "$BACKEND_READY" = false ]; then

    echo ""
    echo "El backend no está disponible en el puerto 3000."
    echo ""
    echo "Comprueba la terminal del backend."
    exit 1

fi


# ==========================================
# 5. INICIAR CLOUDFLARE BACKEND
# ==========================================

echo ""
echo "Iniciando Cloudflare Tunnel para BACKEND..."

rm -f "$BACKEND_LOG_FILE"

gnome-terminal -- bash -c "
    cloudflared tunnel --url http://localhost:3000 2>&1 | tee '$BACKEND_LOG_FILE'
"


# ==========================================
# 6. OBTENER URL BACKEND
# ==========================================

echo ""
echo "Obteniendo URL HTTPS del backend..."

BACKEND_URL=""

for i in {1..30}; do

    if [ -f "$BACKEND_LOG_FILE" ]; then

        BACKEND_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$BACKEND_LOG_FILE" | head -n 1)

        if [ -n "$BACKEND_URL" ]; then
            break
        fi

    fi

    sleep 1

done


# ==========================================
# 7. COMPROBAR URL BACKEND
# ==========================================

if [ -z "$BACKEND_URL" ]; then

    echo ""
    echo "No se ha podido obtener la URL HTTPS del backend."
    echo ""
    echo "Comprueba la terminal de cloudflared."
    exit 1

fi


echo ""
echo "=========================================="
echo "       URL HTTPS DEL BACKEND"
echo "=========================================="
echo "$BACKEND_URL"
echo "=========================================="


# ==========================================
# 8. ACTUALIZAR .env FRONTEND
# ==========================================

echo ""
echo "Actualizando .env del frontend..."

if grep -q "^VITE_API_URL=" "$ENV_FILE_FRONTEND"; then

    sed -i "s|^VITE_API_URL=.*|VITE_API_URL=$BACKEND_URL|" "$ENV_FILE_FRONTEND"

else

    echo "VITE_API_URL=$BACKEND_URL" >> "$ENV_FILE_FRONTEND"

fi


# ==========================================
# 9. BUILD FRONTEND
# ==========================================

echo ""
echo "Compilando frontend..."

cd "$FRONTEND_DIR"

pnpm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "Error durante pnpm run build"
    exit 1
fi

echo ""
echo "Build completado."


# ==========================================
# 10. INICIAR FRONTEND
# ==========================================

echo ""
echo "Iniciando servidor Vite..."

gnome-terminal -- bash -c "
    cd '$FRONTEND_DIR'
    pnpm run dev
    exec bash
"


# ==========================================
# 11. ESPERAR FRONTEND
# ==========================================

echo ""
echo "Esperando a que el frontend esté disponible en el puerto 5173..."

FRONTEND_READY=false

for i in {1..30}; do

    if nc -z localhost 5173 2>/dev/null; then
        FRONTEND_READY=true
        echo "Frontend disponible."
        break
    fi

    sleep 1

done


if [ "$FRONTEND_READY" = false ]; then

    echo ""
    echo "El frontend no está disponible en el puerto 5173."
    echo ""
    echo "Comprueba la terminal del frontend."
    exit 1

fi


# ==========================================
# 12. INICIAR CLOUDFLARE FRONTEND
# ==========================================

echo ""
echo "Iniciando Cloudflare Tunnel para FRONTEND..."

rm -f "$FRONTEND_LOG_FILE"

gnome-terminal -- bash -c "
    cloudflared tunnel --url http://localhost:5173 2>&1 | tee '$FRONTEND_LOG_FILE'
"


# ==========================================
# 13. OBTENER URL FRONTEND
# ==========================================

echo ""
echo "Obteniendo URL HTTPS del frontend..."

FRONTEND_URL=""

for i in {1..30}; do

    if [ -f "$FRONTEND_LOG_FILE" ]; then

        FRONTEND_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$FRONTEND_LOG_FILE" | head -n 1)

        if [ -n "$FRONTEND_URL" ]; then
            break
        fi

    fi

    sleep 1

done


# ==========================================
# 14. COMPROBAR URL FRONTEND
# ==========================================

if [ -z "$FRONTEND_URL" ]; then

    echo ""
    echo "No se ha podido obtener la URL HTTPS del frontend."
    echo ""
    echo "Comprueba la terminal de cloudflared."
    exit 1

fi


echo ""
echo "=========================================="
echo "       URL HTTPS DEL FRONTEND"
echo "=========================================="
echo "$FRONTEND_URL"
echo "=========================================="


# ==========================================
# 15. ACTUALIZAR .env BACKEND
# ==========================================

echo ""
echo "Actualizando .env del backend..."

if grep -q "^FRONTEND_URL=" "$ENV_FILE_BACKEND"; then

    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|" "$ENV_FILE_BACKEND"

else

    echo "FRONTEND_URL=$FRONTEND_URL" >> "$ENV_FILE_BACKEND"

fi


# ==========================================
# 16. REINICIAR BACKEND CON NOD​​EMON
# ==========================================

echo ""
echo "Reiniciando backend para aplicar FRONTEND_URL..."

# Modificamos index.js para provocar
# el reinicio automático de nodemon.

touch "$BACKEND_DIR/index.js"

sleep 5


# ==========================================
# 17. COPIAR A CAPACITOR
# ==========================================

echo ""
echo "Copiando frontend a Android..."

cd "$FRONTEND_DIR"

npx cap copy

if [ $? -ne 0 ]; then
    echo ""
    echo "Error durante npx cap copy"
    exit 1
fi


# ==========================================
# FINAL
# ==========================================

echo ""
echo "=========================================="
echo "     TFG INICIADO CORRECTAMENTE"
echo "=========================================="
echo ""

echo "Frontend HTTPS:"
echo "$FRONTEND_URL"

echo ""

echo "Backend HTTPS:"
echo "$BACKEND_URL"

echo ""
echo "=========================================="
echo ""

echo "Para probar la aplicación móvil debes"
echo "conectar el móvil y ejecutar/exportar"
echo "la aplicación desde Android Studio."

echo ""
echo "IMPORTANTE:"
echo "No cierres las terminales de:"
echo "- Frontend"
echo "- Backend"
echo "- Cloudflare Backend"
echo "- Cloudflare Frontend"

echo ""
echo "=========================================="
