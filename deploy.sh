#!/bin/bash

# Script para desplegar la aplicación Quiz en DigitalOcean usando GitHub
echo "Preparando instrucciones para despliegue desde GitHub..."

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
cat > .env.example << EOL
MONGODB_URI=mongodb://localhost:27017/quiz
ADMIN_PASSWORD=admin123
NODE_ENV=production
PORT=3000
EOL

# Subir los cambios a GitHub
echo "Subiendo los archivos de configuración a GitHub..."
git add ecosystem.config.js .env.example
git commit -m "Agregar archivos de configuración para producción"
git push origin main

echo "Archivos de configuración subidos a GitHub."
echo "Para desplegar la aplicación, sigue estos pasos:"
echo "1. Conéctate al servidor:"
echo "   ssh root@143.244.155.115"
echo "2. Clona el repositorio:"
echo "   git clone https://github.com/IAZARA/QUIZ.git /var/www/quiz-app"
echo "3. Configura la aplicación:"
echo "   cd /var/www/quiz-app"
echo "   cp .env.example .env"
echo "   npm install"
echo "4. Construye la aplicación:"
echo "   npm run build"
echo "5. Inicia la aplicación:"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
