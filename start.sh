#!/bin/bash

# Script para iniciar la aplicación completa de Quiz
# Este script inicia tanto el servidor de backend como el frontend en desarrollo

# Colores para mejor visibilidad
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
SIN_COLOR='\033[0m'

echo -e "${VERDE}=======================================${SIN_COLOR}"
echo -e "${VERDE}   Iniciando la aplicación Quiz       ${SIN_COLOR}"
echo -e "${VERDE}=======================================${SIN_COLOR}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${AMARILLO}Node.js no está instalado. Por favor, instálalo antes de continuar.${SIN_COLOR}"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${AMARILLO}npm no está instalado. Por favor, instálalo antes de continuar.${SIN_COLOR}"
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${AZUL}Instalando dependencias...${SIN_COLOR}"
    npm install
    
    if [ $? -ne 0 ]; then
        echo -e "${AMARILLO}Error al instalar dependencias. Saliendo...${SIN_COLOR}"
        exit 1
    fi
fi

# Iniciar la aplicación con concurrently
echo -e "${AZUL}Iniciando servidor backend y frontend...${SIN_COLOR}"
echo -e "${VERDE}=======================================${SIN_COLOR}"
echo -e "${VERDE} ✓ Frontend: http://localhost:5173    ${SIN_COLOR}"
echo -e "${VERDE} ✓ Backend: http://localhost:3000     ${SIN_COLOR}"
echo -e "${VERDE}=======================================${SIN_COLOR}"
echo -e "${AMARILLO}Presiona Ctrl+C para detener la aplicación${SIN_COLOR}"
echo ""

# Usar el script dev:all que ya está definido en package.json
npm run dev:all 