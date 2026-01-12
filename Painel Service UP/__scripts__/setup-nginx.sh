#!/bin/bash

# Script para configurar Nginx como proxy reverso
# Uso: ./setup-nginx.sh

set -e

echo "========================================="
echo "Configurando Nginx..."
echo "========================================="

# Verificar se o Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "Instalando Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
    echo "✓ Nginx instalado"
else
    echo "✓ Nginx já está instalado"
fi

# Obter o diretório do projeto
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NGINX_CONFIG="/etc/nginx/sites-available/qualit-portal"

echo ""
echo "Criando configuração do Nginx..."

# Criar arquivo de configuração
sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
server {
    listen 80;
    server_name 3.89.33.181;

    client_max_body_size 10M;

    location / {
        root $PROJECT_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $PROJECT_DIR/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Criar link simbólico
if [ ! -L "/etc/nginx/sites-enabled/qualit-portal" ]; then
    sudo ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/qualit-portal
    echo "✓ Link simbólico criado"
fi

# Remover configuração padrão se existir
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    echo "✓ Configuração padrão removida"
fi

# Testar configuração
echo ""
echo "Testando configuração do Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Configuração válida"
    echo ""
    echo "Reiniciando Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    echo "✓ Nginx configurado e reiniciado"
    echo ""
    echo "========================================="
    echo "✓ Nginx configurado com sucesso!"
    echo "========================================="
    echo ""
    echo "Agora você pode acessar:"
    echo "  - Frontend: http://3.89.33.181"
    echo "  - API: http://3.89.33.181/api"
    echo ""
else
    echo "✗ Erro na configuração do Nginx"
    exit 1
fi
