#!/bin/sh

# Démarrer le backend Node.js en arrière-plan
cd /app/backend
node server.js &

# Démarrer nginx au premier plan
nginx -g 'daemon off;'