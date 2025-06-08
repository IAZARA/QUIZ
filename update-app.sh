#!/bin/bash

# =============================================================================
# Script de Actualización para Aplicación Quiz
# Actualiza la aplicación sin reconfigurar el servidor completo
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
APP_NAME="quiz-app"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/IAZARA/QUIZ.git"
BACKUP_DIR="/var/backups/quiz-app"

# Funciones de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Función para crear backup
create_backup() {
    log "📦 Creando backup de la aplicación actual..."
    
    mkdir -p "$BACKUP_DIR"
    backup_name="quiz-app-backup-$(date +%Y%m%d-%H%M%S)"
    
    # Backup de la aplicación
    cp -r "$APP_DIR" "$BACKUP_DIR/$backup_name"
    
    # Backup de la base de datos
    mongodump --db quiz_app --out "$BACKUP_DIR/$backup_name/db-backup" 2>/dev/null || warning "No se pudo hacer backup de la base de datos"
    
    log "✓ Backup creado en: $BACKUP_DIR/$backup_name"
    echo "$BACKUP_DIR/$backup_name" > /tmp/last_backup_path
}

# Función para restaurar backup
restore_backup() {
    if [ -f /tmp/last_backup_path ]; then
        backup_path=$(cat /tmp/last_backup_path)
        if [ -d "$backup_path" ]; then
            log "🔄 Restaurando backup desde: $backup_path"
            
            # Detener aplicación
            pm2 stop quiz-app || true
            
            # Restaurar archivos
            rm -rf "$APP_DIR"
            cp -r "$backup_path" "$APP_DIR"
            
            # Restaurar base de datos si existe
            if [ -d "$backup_path/db-backup" ]; then
                mongorestore --db quiz_app --drop "$backup_path/db-backup/quiz_app" || warning "No se pudo restaurar la base de datos"
            fi
            
            # Reiniciar aplicación
            cd "$APP_DIR"
            pm2 start ecosystem.config.js
            
            log "✓ Backup restaurado exitosamente"
        else
            error "No se encontró el backup en: $backup_path"
        fi
    else
        error "No se encontró información del último backup"
    fi
}

# Función principal de actualización
update_app() {
    log "🚀 Iniciando actualización de la aplicación Quiz"
    
    # Verificar que estamos ejecutando como root
    if [ "$EUID" -ne 0 ]; then
        error "Este script debe ejecutarse como root. Usa: sudo $0"
    fi
    
    # Verificar que la aplicación existe
    if [ ! -d "$APP_DIR" ]; then
        error "La aplicación no está instalada en $APP_DIR"
    fi
    
    # Crear backup
    create_backup
    
    # Obtener la rama actual
    cd "$APP_DIR"
    current_branch=$(git branch --show-current 2>/dev/null || echo "main")
    
    log "📥 Actualizando código desde GitHub (rama: $current_branch)..."
    
    # Guardar archivos de configuración
    cp .env /tmp/quiz-app-env-backup 2>/dev/null || true
    
    # Actualizar código
    git fetch origin
    git reset --hard "origin/$current_branch"
    
    # Restaurar configuración
    if [ -f /tmp/quiz-app-env-backup ]; then
        cp /tmp/quiz-app-env-backup .env
        rm /tmp/quiz-app-env-backup
    fi
    
    # Verificar si hay cambios en package.json
    if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
        log "📦 Detectados cambios en dependencias, reinstalando..."
        npm ci --production=false
    else
        log "📦 No hay cambios en dependencias"
    fi
    
    # Construir aplicación
    log "🏗️ Construyendo aplicación..."
    npm run build
    
    # Verificar si hay cambios en la configuración de PM2
    if git diff HEAD~1 HEAD --name-only | grep -q "ecosystem.config.js"; then
        log "⚙️ Detectados cambios en configuración PM2, recargando..."
        pm2 delete quiz-app || true
        pm2 start ecosystem.config.js
    else
        log "🔄 Reiniciando aplicación..."
        pm2 restart quiz-app
    fi
    
    # Esperar a que la aplicación se estabilice
    log "⏳ Esperando a que la aplicación se estabilice..."
    sleep 10
    
    # Verificar que la aplicación está funcionando
    if pm2 list | grep -q "quiz-app.*online"; then
        log "✅ Aplicación actualizada y funcionando correctamente"
        
        # Verificar conectividad
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200\|302"; then
            log "✅ Aplicación responde correctamente"
        else
            warning "⚠️ La aplicación podría no estar respondiendo correctamente"
        fi
        
        # Limpiar backups antiguos (mantener solo los últimos 5)
        log "🧹 Limpiando backups antiguos..."
        find "$BACKUP_DIR" -name "quiz-app-backup-*" -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
        
        log "🎉 ¡Actualización completada exitosamente!"
        
    else
        error "❌ La aplicación no está funcionando después de la actualización"
    fi
}

# Función de limpieza en caso de error
cleanup() {
    error "❌ Error durante la actualización. Restaurando backup..."
    restore_backup
}

# Función para mostrar ayuda
show_help() {
    echo "Script de Actualización para Aplicación Quiz"
    echo
    echo "Uso: $0 [OPCIÓN]"
    echo
    echo "Opciones:"
    echo "  update, -u     Actualizar la aplicación (por defecto)"
    echo "  restore, -r    Restaurar el último backup"
    echo "  status, -s     Mostrar estado de la aplicación"
    echo "  logs, -l       Mostrar logs de la aplicación"
    echo "  help, -h       Mostrar esta ayuda"
    echo
    echo "Ejemplos:"
    echo "  $0                 # Actualizar aplicación"
    echo "  $0 update          # Actualizar aplicación"
    echo "  $0 restore         # Restaurar último backup"
    echo "  $0 status          # Ver estado"
}

# Función para mostrar estado
show_status() {
    echo "=== Estado de la Aplicación Quiz ==="
    echo "Fecha: $(date)"
    echo
    
    # Estado de servicios
    echo "🔍 Estado de servicios:"
    systemctl is-active --quiet nginx && echo "✓ Nginx: Funcionando" || echo "✗ Nginx: Detenido"
    systemctl is-active --quiet mongod && echo "✓ MongoDB: Funcionando" || echo "✗ MongoDB: Detenido"
    
    # Estado de PM2
    if pm2 list | grep -q "quiz-app"; then
        if pm2 list | grep -q "quiz-app.*online"; then
            echo "✓ Quiz App: Funcionando"
        else
            echo "✗ Quiz App: Detenido o con errores"
        fi
    else
        echo "✗ Quiz App: No configurado"
    fi
    
    echo
    echo "📊 Uso de recursos:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
    echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
    echo "Disco: $(df -h / | awk 'NR==2 {print $5}')"
    
    echo
    echo "🌐 Conectividad:"
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200\|302"; then
        echo "✓ Aplicación local: Funcionando"
    else
        echo "✗ Aplicación local: No responde"
    fi
    
    # Verificar HTTPS si está configurado
    if command -v certbot >/dev/null 2>&1; then
        if curl -s -o /dev/null -w "%{http_code}" "https://iazarate.com" | grep -q "200\|302"; then
            echo "✓ HTTPS: Funcionando"
        else
            echo "✗ HTTPS: No responde"
        fi
    fi
    
    echo
    echo "📝 Información de la aplicación:"
    if [ -d "$APP_DIR" ]; then
        cd "$APP_DIR"
        echo "Directorio: $APP_DIR"
        echo "Rama actual: $(git branch --show-current 2>/dev/null || echo 'Desconocida')"
        echo "Último commit: $(git log -1 --format='%h - %s (%cr)' 2>/dev/null || echo 'Desconocido')"
    else
        echo "✗ Aplicación no encontrada en $APP_DIR"
    fi
}

# Función para mostrar logs
show_logs() {
    echo "=== Logs de la Aplicación Quiz ==="
    echo
    
    if pm2 list | grep -q "quiz-app"; then
        echo "📝 Últimos logs de PM2:"
        pm2 logs quiz-app --lines 20 --nostream
    else
        echo "✗ La aplicación no está configurada en PM2"
    fi
    
    echo
    echo "📝 Últimos logs de Nginx:"
    if [ -f "/var/log/nginx/quiz-app-error.log" ]; then
        tail -n 10 /var/log/nginx/quiz-app-error.log
    else
        echo "No se encontraron logs de error de Nginx"
    fi
}

# Configurar trap para limpieza en caso de error
trap cleanup ERR

# Procesar argumentos
case "${1:-update}" in
    "update"|"-u")
        update_app
        ;;
    "restore"|"-r")
        restore_backup
        ;;
    "status"|"-s")
        show_status
        ;;
    "logs"|"-l")
        show_logs
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "Opción no válida: $1"
        echo "Usa '$0 help' para ver las opciones disponibles"
        exit 1
        ;;
esac