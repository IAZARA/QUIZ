# 🚀 Scripts de Deploy Automatizado - Aplicación Quiz

Este repositorio contiene scripts automatizados para el deploy y mantenimiento de la aplicación Quiz en Digital Ocean con el dominio `https://iazarate.com/`.

## 📋 Archivos Incluidos

- **`deploy-automated.sh`** - Script principal de deploy completo desde cero
- **`update-app.sh`** - Script para actualizaciones de la aplicación
- **`DEPLOY_README.md`** - Este archivo con instrucciones

## 🎯 Script Principal: deploy-automated.sh

### ¿Qué hace?

Este script configura completamente un servidor Ubuntu desde cero con:

- ✅ **Sistema base**: Ubuntu actualizado con dependencias
- ✅ **Node.js 18+**: Runtime para la aplicación
- ✅ **MongoDB 6.0**: Base de datos optimizada para producción
- ✅ **PM2**: Gestor de procesos con clustering
- ✅ **Nginx**: Reverse proxy optimizado con SSL
- ✅ **Firewall**: Configuración de seguridad UFW
- ✅ **SSL/HTTPS**: Certificados automáticos con Let's Encrypt
- ✅ **Monitoreo**: Scripts de health check y logs
- ✅ **Variables de entorno**: Configuración segura de APIs

### 🔧 Configuración Previa

Antes de ejecutar el script, asegúrate de:

1. **Tener acceso SSH al servidor**:
   ```bash
   ssh root@143.244.155.115
   ```

2. **Configurar las claves API** en el script:
   - ✅ `ANTHROPIC_API_KEY` - Ya configurada
   - ⚠️ `GOOGLE_API_KEY` - Agregar tu clave de Google Gemini
   - ⚠️ `OPENAI_API_KEY` - Agregar tu clave de OpenAI
   - ⚠️ `SUPABASE_URL` - Agregar tu URL de Supabase
   - ⚠️ `SUPABASE_ANON_KEY` - Agregar tu clave anónima de Supabase

3. **Verificar que el dominio apunte al servidor**:
   ```bash
   nslookup iazarate.com
   ```

### 🚀 Ejecución del Deploy

1. **Subir el script al servidor**:
   ```bash
   scp deploy-automated.sh root@143.244.155.115:/root/
   ```

2. **Conectarse al servidor**:
   ```bash
   ssh root@143.244.155.115
   ```

3. **Ejecutar el script**:
   ```bash
   chmod +x deploy-automated.sh
   ./deploy-automated.sh
   ```

### ⏱️ Tiempo Estimado

- **Deploy completo**: 15-20 minutos
- **Configuración SSL**: 2-3 minutos adicionales

## 🔄 Script de Actualización: update-app.sh

### ¿Qué hace?

Script para actualizar la aplicación sin reconfigurar todo el servidor:

- 📦 **Backup automático** antes de actualizar
- 📥 **Pull del código** más reciente desde GitHub
- 🏗️ **Build** de la nueva versión
- 🔄 **Restart** inteligente de la aplicación
- ✅ **Verificación** de que todo funciona
- 🧹 **Limpieza** de backups antiguos

### 🔧 Comandos Disponibles

```bash
# Actualizar aplicación (comando por defecto)
./update-app.sh
./update-app.sh update

# Restaurar último backup
./update-app.sh restore

# Ver estado de la aplicación
./update-app.sh status

# Ver logs de la aplicación
./update-app.sh logs

# Mostrar ayuda
./update-app.sh help
```

### 🚀 Uso Típico

1. **Subir script al servidor** (solo la primera vez):
   ```bash
   scp update-app.sh root@143.244.155.115:/root/
   ```

2. **Ejecutar actualización**:
   ```bash
   ssh root@143.244.155.115
   ./update-app.sh
   ```

## 📊 Monitoreo y Mantenimiento

### Comandos Útiles en el Servidor

```bash
# Ver estado de la aplicación
pm2 status
pm2 monit

# Ver logs en tiempo real
pm2 logs quiz-app

# Reiniciar aplicación
pm2 restart quiz-app

# Ver estado de servicios del sistema
systemctl status nginx
systemctl status mongod

# Script de health check personalizado
quiz-app-health

# Ver certificados SSL
certbot certificates
```

### Estructura de Archivos en el Servidor

```
/var/www/quiz-app/          # Aplicación principal
├── dist/                   # Frontend construido
├── server/                 # Backend Node.js
├── uploads/                # Archivos subidos
├── ecosystem.config.js     # Configuración PM2
└── .env                    # Variables de entorno

/var/log/pm2/               # Logs de PM2
/var/log/nginx/             # Logs de Nginx
/var/backups/quiz-app/      # Backups automáticos
```

## 🔒 Seguridad

### Variables de Entorno Configuradas

El script configura automáticamente:

```bash
MONGODB_URI=mongodb://localhost:27017/quiz_app
NODE_ENV=production
PORT=3000
ANTHROPIC_API_KEY=tu_clave_anthropic
GOOGLE_API_KEY=tu_clave_google
OPENAI_API_KEY=tu_clave_openai
SUPABASE_URL=tu_url_supabase
SUPABASE_ANON_KEY=tu_clave_supabase
```

### Configuración de Firewall

```bash
# Puertos abiertos
22/tcp    # SSH
80/tcp    # HTTP (redirige a HTTPS)
443/tcp   # HTTPS

# Todo lo demás está bloqueado por defecto
```

## 🆘 Solución de Problemas

### Si la aplicación no inicia:

```bash
# Ver logs detallados
pm2 logs quiz-app --lines 50

# Verificar configuración
pm2 describe quiz-app

# Reiniciar desde cero
pm2 delete quiz-app
pm2 start ecosystem.config.js
```

### Si Nginx no funciona:

```bash
# Verificar configuración
nginx -t

# Ver logs de error
tail -f /var/log/nginx/error.log

# Reiniciar servicio
systemctl restart nginx
```

### Si MongoDB no funciona:

```bash
# Ver estado
systemctl status mongod

# Ver logs
tail -f /var/log/mongodb/mongod.log

# Reiniciar servicio
systemctl restart mongod
```

### Si SSL no funciona:

```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew --dry-run

# Reconfigurar SSL
certbot --nginx -d iazarate.com -d www.iazarate.com
```

## 📈 Características Avanzadas

### Optimizaciones Incluidas

- **PM2 Clustering**: Usa todos los cores del CPU
- **Nginx Caching**: Cache de assets estáticos
- **Gzip Compression**: Compresión automática
- **SSL Optimization**: HSTS, OCSP Stapling
- **Log Rotation**: Rotación automática de logs
- **Health Checks**: Monitoreo automático

### Configuración de Nginx Optimizada

- ✅ **WebSocket Support**: Para Socket.io
- ✅ **Static File Serving**: Assets y uploads optimizados
- ✅ **Security Headers**: Protección XSS, CSRF, etc.
- ✅ **Rate Limiting**: Protección contra ataques
- ✅ **SSL/TLS**: Configuración A+ en SSL Labs

## 🔄 Flujo de Trabajo Recomendado

### Deploy Inicial
1. Configurar claves API en `deploy-automated.sh`
2. Ejecutar deploy completo
3. Verificar que todo funciona
4. Cambiar contraseña de admin

### Actualizaciones Regulares
1. Hacer cambios en el código local
2. Push a GitHub
3. Ejecutar `./update-app.sh` en el servidor
4. Verificar que la actualización fue exitosa

### Mantenimiento
- Ejecutar `quiz-app-health` semanalmente
- Revisar logs con `pm2 logs` regularmente
- Verificar espacio en disco mensualmente
- Los certificados SSL se renuevan automáticamente

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs**: `pm2 logs quiz-app`
2. **Verifica el estado**: `./update-app.sh status`
3. **Ejecuta health check**: `quiz-app-health`
4. **Restaura backup si es necesario**: `./update-app.sh restore`

---

**¡Tu aplicación Quiz está lista para producción! 🎉**

Accede a: **https://iazarate.com**