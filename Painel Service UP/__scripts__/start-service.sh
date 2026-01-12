#!/bin/bash

# Script para iniciar o serviço na EC2 Ubuntu
# Uso: ./start-service.sh

set -e  # Parar em caso de erro

echo "========================================="
echo "Iniciando serviço - Verificando dependências..."
echo "========================================="

# Função para verificar se um comando existe
check_command() {
    if command -v "$1" &> /dev/null; then
        echo "✓ $1 está instalado ($($1 --version 2>/dev/null | head -n1))"
        return 0
    else
        echo "✗ $1 não está instalado"
        return 1
    fi
}

# Atualizar lista de pacotes
echo ""
echo "Atualizando lista de pacotes..."
sudo apt-get update -qq

# Verificar e instalar Node.js
echo ""
echo "Verificando Node.js..."
if ! check_command node; then
    echo "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✓ Node.js instalado com sucesso"
else
    NODE_VERSION=$(node --version)
    echo "  Versão: $NODE_VERSION"
fi

# Verificar e instalar npm
echo ""
echo "Verificando npm..."
if ! check_command npm; then
    echo "Instalando npm..."
    sudo apt-get install -y npm
    echo "✓ npm instalado com sucesso"
else
    NPM_VERSION=$(npm --version)
    echo "  Versão: $NPM_VERSION"
fi

# Verificar e instalar PM2
echo ""
echo "Verificando PM2..."
# Encontrar o caminho completo do npm para determinar o diretório bin
NPM_PATH=$(which npm)
if [ -z "$NPM_PATH" ]; then
    echo "Erro: npm não encontrado no PATH"
    exit 1
fi

# Extrair o diretório bin do npm (pode ser NVM ou sistema)
NODE_BIN_DIR=$(dirname "$NPM_PATH")
# Adicionar o diretório bin ao PATH
export PATH="$NODE_BIN_DIR:$PATH"

# Verificar se PM2 já está instalado (verificando o arquivo diretamente)
PM2_PATH=""
if [ -f "$NODE_BIN_DIR/pm2" ]; then
    PM2_PATH="$NODE_BIN_DIR/pm2"
    echo "✓ PM2 já está instalado em $NODE_BIN_DIR"
elif command -v pm2 &> /dev/null; then
    PM2_PATH=$(command -v pm2)
    echo "✓ PM2 já está instalado e disponível no PATH"
fi

# Se não estiver instalado, instalar
if [ -z "$PM2_PATH" ]; then
    echo "Instalando PM2 globalmente..."
    # Instalar PM2 sem sudo (NVM gerencia permissões)
    "$NPM_PATH" install -g pm2 || {
        echo "Aviso: Erro ao instalar PM2. Verificando se já está instalado..."
        # Verificar novamente se o PM2 existe após o erro
        if [ -f "$NODE_BIN_DIR/pm2" ]; then
            PM2_PATH="$NODE_BIN_DIR/pm2"
            echo "✓ PM2 encontrado após tentativa de instalação"
        else
            echo "Erro: Não foi possível instalar o PM2"
            exit 1
        fi
    }
    # Aguardar um momento para o sistema registrar o novo comando
    sleep 1
    # Atualizar PM2_PATH após instalação
    if [ -f "$NODE_BIN_DIR/pm2" ]; then
        PM2_PATH="$NODE_BIN_DIR/pm2"
    fi
fi

# Garantir que o PM2 está acessível
if [ -z "$PM2_PATH" ]; then
    echo "Erro: PM2 não encontrado"
    exit 1
fi

# Garantir que o diretório do PM2 está no PATH
export PATH="$NODE_BIN_DIR:$PATH"

# Verificar se o PM2 funciona
# PM2 pode retornar versão em stderr ou stdout, então capturamos ambos
if [ -x "$PM2_PATH" ]; then
    # Tentar obter a versão do PM2 (pode estar em stdout ou stderr)
    PM2_VERSION_OUTPUT=$("$PM2_PATH" --version 2>&1)
    PM2_EXIT_CODE=$?
    
    if [ $PM2_EXIT_CODE -eq 0 ] || [ -n "$PM2_VERSION_OUTPUT" ]; then
        # Extrair a versão (pode estar em qualquer linha da saída)
        PM2_VERSION=$(echo "$PM2_VERSION_OUTPUT" | head -n1 | tr -d '[:space:]')
        if [ -n "$PM2_VERSION" ]; then
            echo "✓ PM2 está instalado (versão: $PM2_VERSION)"
        else
            echo "✓ PM2 está instalado e funcionando"
        fi
    else
        echo "Erro: PM2 encontrado mas não está funcionando corretamente"
        echo "Caminho: $PM2_PATH"
        echo "Saída do comando: $PM2_VERSION_OUTPUT"
        echo "Código de saída: $PM2_EXIT_CODE"
        exit 1
    fi
else
    echo "Erro: PM2 encontrado mas não é executável: $PM2_PATH"
    exit 1
fi

# Buildar o frontend antes de iniciar o backend
echo ""
echo "========================================="
echo "Buildando frontend..."
echo "========================================="
FRONTEND_DIR="$(dirname "$0")/../frontend"
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR" || {
        echo "Erro: Não foi possível acessar o diretório frontend"
        exit 1
    }
    
    # Garantir que o npm está no PATH (usar o mesmo npm do início do script)
    export PATH="$NODE_BIN_DIR:$PATH"
    
    # Verificar se node_modules existe no frontend
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependências do frontend..."
        "$NPM_PATH" install
        if [ $? -ne 0 ]; then
            echo "✗ Erro ao instalar dependências do frontend"
            exit 1
        fi
        echo "✓ Dependências do frontend instaladas"
    else
        echo "✓ Dependências do frontend já instaladas"
        # Verificar se precisa atualizar
        echo "Verificando se há atualizações necessárias..."
        "$NPM_PATH" install
    fi
    
    # Verificar se o vite está disponível
    if [ ! -f "node_modules/.bin/vite" ] && [ ! -f "node_modules/vite/bin/vite.js" ]; then
        echo "⚠ Vite não encontrado, reinstalando dependências..."
        "$NPM_PATH" install
    fi
    
    # Corrigir permissões dos binários do node_modules
    echo "Corrigindo permissões dos binários..."
    if [ -d "node_modules/.bin" ]; then
        chmod +x node_modules/.bin/* 2>/dev/null || true
    fi
    
    # Buildar o frontend com variável de ambiente para produção
    echo "Buildando frontend..."
    # Definir URL da API como relativa para produção
    export VITE_API_URL=/api
    
    # Tentar diferentes métodos para executar o build
    BUILD_EXIT_CODE=1
    
    # Método 1: Executar vite diretamente com node (mais confiável)
    echo "Tentando build com node e vite..."
    if [ -f "node_modules/vite/bin/vite.js" ]; then
        node node_modules/vite/bin/vite.js build
        BUILD_EXIT_CODE=$?
    elif [ -f "node_modules/.bin/vite" ]; then
        # Tentar executar o wrapper do vite
        node node_modules/.bin/vite build
        BUILD_EXIT_CODE=$?
    fi
    
    # Método 2: Se falhou, tentar com npm run build
    if [ $BUILD_EXIT_CODE -ne 0 ]; then
        echo "Tentando build com npm run build..."
        "$NPM_PATH" run build
        BUILD_EXIT_CODE=$?
    fi
    
    # Método 3: Se ainda falhou, tentar com npx
    if [ $BUILD_EXIT_CODE -ne 0 ]; then
        echo "Tentando build com npx vite..."
        NPX_PATH="$NODE_BIN_DIR/npx"
        if [ ! -f "$NPX_PATH" ]; then
            NPX_PATH=$(which npx 2>/dev/null || echo "")
        fi
        if [ -n "$NPX_PATH" ] && [ -f "$NPX_PATH" ]; then
            "$NPX_PATH" vite build
            BUILD_EXIT_CODE=$?
        fi
    fi
    
    unset VITE_API_URL
    
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        echo "✓ Frontend buildado com sucesso"
    else
        echo "✗ Erro crítico: Não foi possível buildar o frontend"
        echo "Verifique se as dependências estão instaladas corretamente"
        echo "Tente executar manualmente: cd frontend && npm install && npm run build"
        exit 1
    fi
else
    echo "⚠ Diretório frontend não encontrado, pulando build"
fi

# Navegar para o diretório do backend
echo ""
echo "Navegando para o diretório do backend..."
cd "$(dirname "$0")/../backend" || {
    echo "Erro: Não foi possível acessar o diretório backend"
    exit 1
}

# Verificar se node_modules existe
echo ""
echo "Verificando dependências do projeto..."
if [ ! -d "node_modules" ]; then
    echo "node_modules não encontrado. Instalando dependências..."
    npm install
    echo "✓ Dependências instaladas com sucesso"
else
    echo "✓ Dependências já instaladas"
    # Verificar se precisa atualizar
    echo "Verificando se há atualizações necessárias..."
    npm install
fi

# Verificar se o arquivo .env existe
echo ""
echo "Verificando arquivo de configuração..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠ Arquivo .env não encontrado. Copiando .env.example para .env"
        cp .env.example .env
        echo "⚠ ATENÇÃO: Arquivo .env foi criado a partir do .env.example"
        echo "⚠ Por favor, configure o arquivo .env com as credenciais corretas antes de continuar"
        echo ""
        echo "ERRO: O arquivo .env precisa ser configurado antes de iniciar o serviço."
        echo "Edite o arquivo .env e execute o script novamente."
        exit 1
    else
        echo ""
        echo "ERRO CRÍTICO: Arquivo .env não encontrado e .env.example também não existe!"
        echo "O serviço não pode iniciar sem o arquivo de configuração .env"
        echo "Por favor, crie o arquivo .env com as configurações necessárias:"
        echo "  - Credenciais do banco de dados"
        echo "  - Porta do servidor"
        echo "  - Outras variáveis de ambiente necessárias"
        exit 1
    fi
else
    echo "✓ Arquivo .env encontrado"
    # Verificar se o .env não está vazio
    if [ ! -s ".env" ]; then
        echo ""
        echo "ERRO: O arquivo .env existe mas está vazio!"
        echo "Por favor, configure o arquivo .env antes de continuar"
        exit 1
    fi
fi

# Iniciar o serviço com PM2
echo ""
echo "========================================="
echo "Iniciando serviço..."
echo "========================================="

# Garantir que o PM2 está acessível (já foi verificado anteriormente, mas garantir PATH)
export PATH="$NODE_BIN_DIR:$PATH"

# Usar PM2_PATH se definido, caso contrário usar pm2 do PATH
PM2_CMD="${PM2_PATH:-pm2}"

# Parar instância anterior se existir
"$PM2_CMD" stop qualit-portal 2>/dev/null || true
"$PM2_CMD" delete qualit-portal 2>/dev/null || true

# Iniciar o serviço
"$PM2_CMD" start server.js --name "qualit-portal"

# Salvar configuração do PM2 para iniciar no boot
"$PM2_CMD" save
"$PM2_CMD" startup | grep -v "PM2" | bash || true

echo ""
echo "========================================="
echo "✓ Serviço iniciado com sucesso!"
echo "========================================="
echo ""
echo "Comandos úteis:"
echo "  - Ver status: pm2 status"
echo "  - Ver logs: pm2 logs qualit-portal"
echo "  - Ver logs em tempo real: pm2 logs qualit-portal --lines 50"
echo "  - Reiniciar: pm2 restart qualit-portal"
echo "  - Parar: pm2 stop qualit-portal"
echo ""
