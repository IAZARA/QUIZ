#!/bin/bash

# Script para iniciar toda la aplicación Quiz incluyendo MongoDB
# Este script inicia MongoDB y luego el servidor backend y frontend

# Colores para mejor visibilidad
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
AZUL='\033[0;34m'
SIN_COLOR='\033[0m'

echo -e "${VERDE}=======================================${SIN_COLOR}"
echo -e "${VERDE}   Iniciando aplicación Quiz completa ${SIN_COLOR}"
echo -e "${VERDE}=======================================${SIN_COLOR}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${ROJO}Node.js no está instalado. Por favor, instálalo antes de continuar.${SIN_COLOR}"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${ROJO}npm no está instalado. Por favor, instálalo antes de continuar.${SIN_COLOR}"
    exit 1
fi

# Verificar si MongoDB está instalado
if ! command -v mongod &> /dev/null; then
    echo -e "${ROJO}MongoDB no está instalado.${SIN_COLOR}"
    echo -e "${AMARILLO}Por favor, sigue las siguientes instrucciones para instalarlo:${SIN_COLOR}"
    echo ""
    echo -e "${AZUL}Para macOS (usando Homebrew):${SIN_COLOR}"
    echo "  brew tap mongodb/brew"
    echo "  brew install mongodb-community"
    echo ""
    echo -e "${AZUL}Para Linux (Ubuntu/Debian):${SIN_COLOR}"
    echo "  sudo apt update"
    echo "  sudo apt install -y mongodb"
    echo ""
    echo -e "${AZUL}Para Windows:${SIN_COLOR}"
    echo "  Descarga el instalador desde: https://www.mongodb.com/try/download/community"
    echo ""
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${AZUL}Instalando dependencias...${SIN_COLOR}"
    npm install
    
    if [ $? -ne 0 ]; then
        echo -e "${ROJO}Error al instalar dependencias. Saliendo...${SIN_COLOR}"
        exit 1
    fi
fi

# Verificar si MongoDB está ejecutándose
if ! pgrep mongod > /dev/null; then
    echo -e "${AZUL}MongoDB no está en ejecución. Iniciando MongoDB...${SIN_COLOR}"
    
    # Crear directorio de datos si no existe
    if [ ! -d "data/db" ]; then
        echo -e "${AZUL}Creando directorio de datos para MongoDB...${SIN_COLOR}"
        mkdir -p data/db
    fi
    
    # Iniciar MongoDB en segundo plano
    mongod --dbpath=data/db --fork --logpath=data/mongod.log
    
    if [ $? -ne 0 ]; then
        echo -e "${ROJO}Error al iniciar MongoDB.${SIN_COLOR}"
        echo -e "${AMARILLO}Verifica los permisos y que el puerto 27017 esté disponible.${SIN_COLOR}"
        exit 1
    fi
    
    echo -e "${VERDE}MongoDB iniciado correctamente en segundo plano.${SIN_COLOR}"
    echo -e "${VERDE}Los logs se guardan en data/mongod.log${SIN_COLOR}"
else
    echo -e "${VERDE}MongoDB ya está en ejecución.${SIN_COLOR}"
fi

# Iniciar la aplicación
echo -e "${AZUL}Iniciando servidor backend y frontend...${SIN_COLOR}"
echo -e "${VERDE}=======================================${SIN_COLOR}"
echo -e "${VERDE} ✓ Frontend: http://localhost:5173    ${SIN_COLOR}"
echo -e "${VERDE} ✓ Backend: http://localhost:3000     ${SIN_COLOR}"
echo -e "${VERDE} ✓ MongoDB: ejecutándose en puerto 27017 ${SIN_COLOR}"
echo -e "${VERDE}=======================================${SIN_COLOR}"
echo -e "${AMARILLO}Presiona Ctrl+C para detener la aplicación${SIN_COLOR}"
echo ""

# Usar el script dev:all que ya está definido en package.json
npm run dev:all

# Al detener con Ctrl+C (trap), preguntar si desea detener MongoDB también
trap 'echo -e "${AMARILLO}¿Deseas detener MongoDB también? (s/n): ${SIN_COLOR}"; read resp; if [ "$resp" = "s" ] || [ "$resp" = "S" ]; then pkill mongod && echo -e "${VERDE}MongoDB detenido.${SIN_COLOR}"; else echo -e "${VERDE}MongoDB sigue ejecutándose en segundo plano.${SIN_COLOR}"; fi; exit' SIGINT 