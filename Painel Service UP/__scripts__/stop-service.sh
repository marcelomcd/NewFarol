#!/bin/bash

# Script para parar o serviço na EC2 Ubuntu
# Uso: ./stop-service.sh

echo "Parando serviço..."

# Verificar se o PM2 está instalado e parar o serviço
if command -v pm2 &> /dev/null; then
    pm2 stop qualit-portal 2>/dev/null || pm2 stop all
    pm2 delete qualit-portal 2>/dev/null || true
    echo "Serviço parado via PM2"
else
    # Se não usar PM2, tentar parar pelo processo Node.js
    echo "PM2 não encontrado. Tentando parar processos Node.js..."
    pkill -f "node.*server.js" || echo "Nenhum processo encontrado para parar"
fi

echo "Serviço parado com sucesso!"
