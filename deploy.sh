#!/bin/bash

# Script para desplegar la aplicación Quiz en DigitalOcean
echo "Preparando la aplicación para despliegue..."

# Construir la aplicación para producción
echo "Construyendo la aplicación..."
npm run build

# Crear un archivo para el servicio PM2
echo "Creando archivo de configuración para PM2..."
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'quiz-app',
      script: 'server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOL

# Crear un archivo .env para producción
echo "Creando archivo .env para producción..."
cat > .env << EOL
MONGODB_URI=mongodb://localhost:27017/quiz
ADMIN_PASSWORD=admin123
NODE_ENV=production
PORT=3000
EOL

# Comprimir todo para subir al servidor
echo "Comprimiendo archivos para subir al servidor..."
tar -czf quiz-app.tar.gz dist server package.json package-lock.json ecosystem.config.js .env

echo "Archivo quiz-app.tar.gz listo para subir al servidor."
echo "Usa el siguiente comando para subir el archivo al servidor:"
echo "scp quiz-app.tar.gz root@143.244.155.115:/root/"

echo "Luego, conéctate al servidor y ejecuta los siguientes comandos:"
echo "ssh root@143.244.155.115"
echo "mkdir -p /var/www/quiz-app"
echo "tar -xzf quiz-app.tar.gz -C /var/www/quiz-app"
echo "cd /var/www/quiz-app"
echo "npm install --production"
echo "npm install -g pm2"
echo "pm2 start ecosystem.config.js"
echo "pm2 save"
echo "pm2 startup"
