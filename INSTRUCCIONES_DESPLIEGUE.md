# Instrucciones para desplegar la aplicación Quiz en DigitalOcean

Este documento contiene instrucciones paso a paso para desplegar la aplicación Quiz en un droplet de DigitalOcean y configurarla con el dominio iazarate.com.

## Requisitos previos

- Un droplet de DigitalOcean (ya tienes: 143.244.155.115)
- Acceso SSH al droplet como usuario root
- Dominio configurado (iazarate.com)

## Paso 1: Preparar la aplicación para despliegue

1. Ejecuta el script de despliegue en tu máquina local:

```bash
cd /Users/macbook/Documents/QUIZ
./deploy.sh
```

2. Sube el archivo comprimido al servidor:

```bash
scp quiz-app.tar.gz root@143.244.155.115:/root/
```

## Paso 2: Configurar el servidor

1. Conéctate al servidor:

```bash
ssh root@143.244.155.115
```

2. Sube el script de configuración del servidor:

```bash
scp server-setup.sh root@143.244.155.115:/root/
```

3. Ejecuta el script de configuración del servidor:

```bash
chmod +x server-setup.sh
./server-setup.sh
```

Este script realizará las siguientes acciones:
- Actualizar el sistema
- Instalar Node.js y npm
- Instalar MongoDB
- Instalar PM2 (gestor de procesos para Node.js)
- Instalar y configurar Nginx
- Configurar HTTPS con Let's Encrypt
- Configurar el firewall

## Paso 3: Desplegar la aplicación

1. Crea el directorio para la aplicación:

```bash
mkdir -p /var/www/quiz-app
```

2. Extrae el archivo comprimido:

```bash
tar -xzf quiz-app.tar.gz -C /var/www/quiz-app
```

3. Instala las dependencias:

```bash
cd /var/www/quiz-app
npm install --production
```

4. Inicia la aplicación con PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Paso 4: Verificar la instalación

1. Verifica que la aplicación esté funcionando:

```bash
pm2 status
```

2. Verifica que Nginx esté funcionando:

```bash
systemctl status nginx
```

3. Verifica que MongoDB esté funcionando:

```bash
systemctl status mongod
```

4. Accede a la aplicación en tu navegador:

```
https://iazarate.com
```

## Solución de problemas

### Si la aplicación no se inicia:

Verifica los logs de PM2:

```bash
pm2 logs
```

### Si Nginx no funciona:

Verifica los logs de Nginx:

```bash
tail -f /var/log/nginx/error.log
```

### Si MongoDB no funciona:

Verifica los logs de MongoDB:

```bash
tail -f /var/log/mongodb/mongod.log
```

## Comandos útiles

### Reiniciar la aplicación:

```bash
pm2 restart quiz-app
```

### Detener la aplicación:

```bash
pm2 stop quiz-app
```

### Ver los logs en tiempo real:

```bash
pm2 logs quiz-app
```

### Reiniciar Nginx:

```bash
systemctl restart nginx
```

### Reiniciar MongoDB:

```bash
systemctl restart mongod
```

## Notas importantes

1. La aplicación se ejecutará en el puerto 3000, pero Nginx la redirigirá desde el puerto 80/443.
2. Los certificados SSL se renovarán automáticamente gracias a Certbot.
3. La base de datos MongoDB se ejecutará localmente en el servidor.
4. PM2 se asegurará de que la aplicación se reinicie automáticamente si se produce algún error.
5. Asegúrate de cambiar la contraseña de administrador en el archivo .env después de la instalación.

## Actualización de la aplicación

Para actualizar la aplicación en el futuro, sigue estos pasos:

1. Construye la nueva versión en tu máquina local:

```bash
cd /Users/macbook/Documents/QUIZ
npm run build
```

2. Comprime los archivos actualizados:

```bash
tar -czf quiz-app-update.tar.gz dist server package.json package-lock.json ecosystem.config.js .env
```

3. Sube el archivo comprimido al servidor:

```bash
scp quiz-app-update.tar.gz root@143.244.155.115:/root/
```

4. Conéctate al servidor:

```bash
ssh root@143.244.155.115
```

5. Haz una copia de seguridad de la versión actual:

```bash
cp -r /var/www/quiz-app /var/www/quiz-app-backup
```

6. Extrae la nueva versión:

```bash
tar -xzf quiz-app-update.tar.gz -C /var/www/quiz-app
```

7. Instala las dependencias si hay cambios:

```bash
cd /var/www/quiz-app
npm install --production
```

8. Reinicia la aplicación:

```bash
pm2 restart quiz-app
```
