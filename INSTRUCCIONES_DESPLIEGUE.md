# Instrucciones para desplegar la aplicación Quiz en DigitalOcean desde GitHub

Este documento contiene instrucciones paso a paso para desplegar la aplicación Quiz en un droplet de DigitalOcean desde GitHub y configurarla con el dominio iazarate.com.

## Requisitos previos

- Un droplet de DigitalOcean (ya tienes: 143.244.155.115)
- Acceso SSH al droplet como usuario root
- Dominio configurado (iazarate.com)
- Repositorio GitHub configurado (https://github.com/IAZARA/QUIZ.git)

## Opción 1: Despliegue automático (recomendado)

Esta opción utiliza el script de configuración del servidor para automatizar todo el proceso de despliegue.

1. Conéctate al servidor:

```bash
ssh root@143.244.155.115
```

2. Descarga el script de configuración del servidor directamente desde GitHub:

```bash
curl -O https://raw.githubusercontent.com/IAZARA/QUIZ/main/server-setup.sh
chmod +x server-setup.sh
```

3. Ejecuta el script de configuración del servidor:

```bash
./server-setup.sh
```

Este script realizará automáticamente todas las siguientes acciones:
- Actualizar el sistema
- Instalar Git, Node.js y npm
- Instalar MongoDB
- Instalar PM2 (gestor de procesos para Node.js)
- Instalar y configurar Nginx
- Configurar HTTPS con Let's Encrypt
- Configurar el firewall
- Clonar el repositorio desde GitHub
- Configurar y construir la aplicación
- Iniciar la aplicación con PM2

## Opción 2: Despliegue manual paso a paso

Si prefieres tener más control sobre el proceso de despliegue, puedes seguir estos pasos manualmente.

### Paso 1: Configurar el servidor

1. Conéctate al servidor:

```bash
ssh root@143.244.155.115
```

2. Actualiza el sistema e instala las dependencias necesarias:

```bash
apt update && apt upgrade -y
apt install -y git curl
```

3. Instala Node.js y npm:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

4. Instala MongoDB:

```bash
apt install -y gnupg
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

5. Instala PM2 globalmente:

```bash
npm install -g pm2
```

6. Instala y configura Nginx:

```bash
apt install -y nginx
```

### Paso 2: Desplegar la aplicación desde GitHub

1. Clona el repositorio:

```bash
mkdir -p /var/www
git clone https://github.com/IAZARA/QUIZ.git /var/www/quiz-app
```

2. Configura la aplicación:

```bash
cd /var/www/quiz-app
cp .env.example .env
npm install
```

3. Construye la aplicación:

```bash
npm run build
```

4. Crea la carpeta de uploads si no existe:

```bash
mkdir -p /var/www/quiz-app/uploads
```

5. Inicia la aplicación con PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Paso 3: Configurar Nginx y HTTPS

1. Crea la configuración de Nginx para la aplicación:

```bash
cat > /etc/nginx/sites-available/quiz-app << EOL
server {
    listen 80;
    server_name iazarate.com www.iazarate.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
```

2. Habilita el sitio y reinicia Nginx:

```bash
ln -s /etc/nginx/sites-available/quiz-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

3. Configura HTTPS con Let's Encrypt:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d iazarate.com -d www.iazarate.com --non-interactive --agree-tos --email admin@iazarate.com
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
