#!/bin/bash

# Script para configurar el servidor en DigitalOcean y desplegar desde GitHub
echo "Configurando el servidor para la aplicación Quiz..."

# Actualizar el sistema
echo "Actualizando el sistema..."
apt update && apt upgrade -y

# Instalar Git
echo "Instalando Git..."
apt install -y git

# Instalar Node.js y npm
echo "Instalando Node.js y npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar la instalación
node -v
npm -v

# Instalar MongoDB
echo "Instalando MongoDB..."
apt install -y gnupg
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Iniciar y habilitar MongoDB
echo "Iniciando MongoDB..."
systemctl start mongod
systemctl enable mongod

# Instalar PM2 globalmente
echo "Instalando PM2..."
npm install -g pm2

# Instalar Nginx
echo "Instalando Nginx..."
apt install -y nginx

# Configurar Nginx para la aplicación Quiz
echo "Configurando Nginx..."
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

# Habilitar el sitio
ln -s /etc/nginx/sites-available/quiz-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar la configuración de Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# Instalar Certbot para HTTPS
echo "Instalando Certbot para HTTPS..."
apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
echo "Obteniendo certificado SSL para iazarate.com..."
certbot --nginx -d iazarate.com -d www.iazarate.com --non-interactive --agree-tos --email admin@iazarate.com

# Configurar firewall
echo "Configurando firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable

# Clonar el repositorio desde GitHub
echo "Clonando el repositorio desde GitHub..."
mkdir -p /var/www
git clone https://github.com/IAZARA/QUIZ.git /var/www/quiz-app

# Configurar la aplicación
echo "Configurando la aplicación..."
cd /var/www/quiz-app
cp .env.example .env
npm install

# Construir la aplicación
echo "Construyendo la aplicación..."
npm run build

# Crear carpeta de uploads si no existe
mkdir -p /var/www/quiz-app/uploads

# Iniciar la aplicación con PM2
echo "Iniciando la aplicación con PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "¡Configuración del servidor y despliegue completados!"
echo "La aplicación está disponible en: https://iazarate.com"

# Instrucciones para actualizar la aplicación
echo "
Para actualizar la aplicación en el futuro, ejecuta:

cd /var/www/quiz-app
git pull
npm install
npm run build
pm2 restart quiz-app
"
