#!/bin/bash

# Script para iniciar MongoDB para la aplicación Quiz
# Este script verifica si MongoDB está instalado y lo inicia

# Colores para mejor visibilidad
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
AZUL='\033[0;34m'
SIN_COLOR='\033[0m'

echo -e "${VERDE}=======================================${SIN_COLOR}"
echo -e "${VERDE}   Iniciando MongoDB para Quiz        ${SIN_COLOR}"
echo -e "${VERDE}=======================================${SIN_COLOR}"

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

# Verificar si MongoDB está ejecutándose
if pgrep mongod > /dev/null; then
    echo -e "${VERDE}MongoDB ya está en ejecución.${SIN_COLOR}"
    echo -e "${VERDE}Puedes iniciar ahora la aplicación con ./start.sh${SIN_COLOR}"
else
    # Crear directorio de datos si no existe
    if [ ! -d "data/db" ]; then
        echo -e "${AZUL}Creando directorio de datos para MongoDB...${SIN_COLOR}"
        mkdir -p data/db
    fi
    
    echo -e "${AZUL}Iniciando MongoDB...${SIN_COLOR}"
    # Iniciar MongoDB en segundo plano
    mongod --dbpath=data/db --fork --logpath=data/mongod.log
    
    if [ $? -eq 0 ]; then
        echo -e "${VERDE}MongoDB iniciado correctamente en segundo plano.${SIN_COLOR}"
        echo -e "${VERDE}Los logs se guardan en data/mongod.log${SIN_COLOR}"
        echo -e "${VERDE}=======================================${SIN_COLOR}"
        echo -e "${VERDE}Ahora puedes iniciar la aplicación con:${SIN_COLOR}"
        echo -e "${VERDE}./start.sh${SIN_COLOR}"
        echo -e "${VERDE}=======================================${SIN_COLOR}"
    else
        echo -e "${ROJO}Error al iniciar MongoDB.${SIN_COLOR}"
        echo -e "${AMARILLO}Verifica los permisos y que el puerto 27017 esté disponible.${SIN_COLOR}"
        exit 1
    fi
fi 