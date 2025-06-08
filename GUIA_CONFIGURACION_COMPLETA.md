# 🚀 Guía Completa de Configuración - Deploy Quiz App

## 📋 Información del Servidor
- **IP del Droplet**: `167.172.128.72`
- **Usuario**: `root`
- **Dominio**: `iazarate.com`

---

## 🌐 PASO 1: Configurar el Dominio (CRÍTICO - HACER PRIMERO)

### En tu Panel de Hosting/DNS (donde tienes registrado iazarate.com):

1. **Accede al panel de control de tu proveedor de dominio** (GoDaddy, Namecheap, Cloudflare, etc.)

2. **Ve a la sección de DNS/Gestión de DNS**

3. **Configura los siguientes registros DNS**:

```
Tipo: A
Nombre: @
Valor: 167.172.128.72
TTL: 300 (o el mínimo disponible)

Tipo: A  
Nombre: www
Valor: 167.172.128.72
TTL: 300 (o el mínimo disponible)
```

4. **Elimina cualquier registro A existente** que apunte a otras IPs

5. **Guarda los cambios**

### ⏰ Tiempo de Propagación:
- **Mínimo**: 5-15 minutos
- **Máximo**: 24-48 horas (raro)
- **Típico**: 1-2 horas

### ✅ Verificar la Configuración DNS:
```bash
# En tu terminal local, ejecuta:
nslookup iazarate.com
nslookup www.iazarate.com

# Deberías ver la IP: 167.172.128.72
```

---

## 🔧 PASO 2: Preparar el Deploy Local

### 1. Configurar las Claves API:
```bash
cd /Users/macbook/Documents/QUIZ
./prepare-deploy.sh
```

**Claves que necesitas configurar**:
- ✅ **Anthropic**: Ya configurada
- ⚠️ **Google Gemini**: Tu clave de Google AI
- ⚠️ **OpenAI**: Tu clave de OpenAI (opcional)
- ⚠️ **Supabase URL**: Tu URL de Supabase
- ⚠️ **Supabase Key**: Tu clave anónima de Supabase

### 2. Verificar Conectividad SSH:
```bash
# Probar conexión SSH
ssh root@167.172.128.72

# Si es la primera vez, acepta la huella digital del servidor
# Deberías poder conectarte sin problemas
```

---

## 🚀 PASO 3: Ejecutar el Deploy

### Opción A: Deploy Rápido (Recomendado)
```bash
cd /Users/macbook/Documents/QUIZ
./prepare-deploy.sh
cd deploy-files
./quick-deploy.sh
```

### Opción B: Deploy Manual
```bash
# 1. Subir el script al servidor
scp deploy-automated.sh root@167.172.128.72:/root/

# 2. Conectarse al servidor
ssh root@167.172.128.72

# 3. Ejecutar el deploy
chmod +x deploy-automated.sh
./deploy-automated.sh
```

---

## ⏱️ PASO 4: Durante el Deploy (15-20 minutos)

El script hará automáticamente:

1. ✅ **Actualizar Ubuntu**
2. ✅ **Instalar Node.js 18**
3. ✅ **Instalar MongoDB 6.0**
4. ✅ **Instalar PM2**
5. ✅ **Instalar Nginx**
6. ✅ **Configurar Firewall**
7. ✅ **Clonar tu repositorio**
8. ✅ **Instalar dependencias**
9. ✅ **Construir la aplicación**
10. ✅ **Configurar PM2**
11. ✅ **Configurar Nginx**
12. ✅ **Instalar SSL (Let's Encrypt)**

### 🔍 Monitorear el Progreso:
El script mostrará mensajes como:
```
[INFO] 📦 Actualizando sistema Ubuntu...
[INFO] 🟢 Instalando Node.js 18...
[INFO] 🍃 Instalando MongoDB 6.0...
...
[INFO] 🎉 ¡Deploy completado exitosamente!
```

---

## ✅ PASO 5: Verificación Final

### 1. Verificar que los servicios están funcionando:
```bash
# En el servidor (ssh root@167.172.128.72)
pm2 status
systemctl status nginx
systemctl status mongod
```

### 2. Verificar conectividad local:
```bash
# En el servidor
curl http://localhost:3000
```

### 3. Verificar el dominio:
```bash
# En tu terminal local
curl -I http://iazarate.com
curl -I https://iazarate.com
```

### 4. Acceder desde el navegador:
- **HTTP**: http://iazarate.com (debería redirigir a HTTPS)
- **HTTPS**: https://iazarate.com ✅

---

## 🆘 Solución de Problemas Comunes

### ❌ Problema: "DNS no resuelve"
```bash
# Verificar DNS
nslookup iazarate.com

# Si no muestra 167.172.128.72:
# 1. Revisar configuración DNS en el hosting
# 2. Esperar más tiempo (hasta 24h)
# 3. Limpiar cache DNS local: sudo dscacheutil -flushcache
```

### ❌ Problema: "SSH Connection refused"
```bash
# Verificar que el droplet está encendido
# En Digital Ocean panel, verificar estado del droplet

# Probar conexión
ping 167.172.128.72
telnet 167.172.128.72 22
```

### ❌ Problema: "Let's Encrypt falla"
```bash
# Verificar que DNS está propagado ANTES de ejecutar el script
nslookup iazarate.com

# Si falla SSL, ejecutar manualmente después:
ssh root@167.172.128.72
certbot --nginx -d iazarate.com -d www.iazarate.com
```

### ❌ Problema: "Aplicación no responde"
```bash
# En el servidor
pm2 logs quiz-app
pm2 restart quiz-app

# Verificar logs de Nginx
tail -f /var/log/nginx/error.log
```

---

## 📋 Checklist de Verificación

### Antes del Deploy:
- [ ] DNS configurado (A records apuntando a 167.172.128.72)
- [ ] SSH funciona (ssh root@167.172.128.72)
- [ ] Claves API configuradas en el script
- [ ] Dominio resuelve correctamente (nslookup iazarate.com)

### Durante el Deploy:
- [ ] Script ejecutándose sin errores
- [ ] Servicios instalándose correctamente
- [ ] SSL configurándose automáticamente

### Después del Deploy:
- [ ] PM2 muestra quiz-app como "online"
- [ ] Nginx está funcionando
- [ ] MongoDB está funcionando
- [ ] https://iazarate.com carga correctamente
- [ ] Certificado SSL válido

---

## 🔄 Para Actualizaciones Futuras

Una vez que el deploy inicial esté completo:

```bash
# Subir script de actualización (solo la primera vez)
scp update-app.sh root@167.172.128.72:/root/

# Para futuras actualizaciones
ssh root@167.172.128.72
./update-app.sh
```

---

## 📞 Comandos de Emergencia

### Reiniciar todo:
```bash
ssh root@167.172.128.72
pm2 restart quiz-app
systemctl restart nginx
systemctl restart mongod
```

### Ver logs en tiempo real:
```bash
ssh root@167.172.128.72
pm2 logs quiz-app --lines 50
```

### Health check:
```bash
ssh root@167.172.128.72
quiz-app-health
```

---

## 🎯 Resultado Esperado

Al final tendrás:
- ✅ **https://iazarate.com** funcionando
- ✅ **SSL automático** con renovación
- ✅ **Aplicación optimizada** para producción
- ✅ **Monitoreo automático**
- ✅ **Backup automático**
- ✅ **Todas las APIs funcionando**

**¡Tu aplicación Quiz estará lista para producción! 🎉**