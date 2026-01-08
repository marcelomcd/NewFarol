# Configuração de Variáveis de Ambiente

Este documento descreve como configurar as variáveis de ambiente para ambos os sistemas.

## 📋 New Farol - Backend

Crie um arquivo `.env` na pasta `backend/` com o seguinte conteúdo:

```env
# ============================================
# NEW FAROL - Backend (Python/FastAPI)
# ===========================================

# ============================================
# Azure DevOps - OBRIGATÓRIO
# ============================================
# Personal Access Token do Azure DevOps
# Gere em: https://dev.azure.com/qualiit/_usersSettings/tokens
AZDO_PAT=seu_personal_access_token_aqui

# Organização do Azure DevOps (padrão: qualiit)
AZDO_ORG=qualiit

# URL base do Azure DevOps (padrão: https://dev.azure.com/qualiit/)
AZDO_BASE_URL=https://dev.azure.com/qualiit/

# Projeto raiz do Azure DevOps
AZDO_ROOT_PROJECT=Quali IT - Inovação e Tecnologia

# Versão da API do Azure DevOps (padrão: 7.0)
AZDO_API_VERSION=7.0

# ============================================
# Database
# ============================================
# SQLite para desenvolvimento local (padrão)
DATABASE_URL=sqlite:///./newfarol.db

# PostgreSQL para produção (exemplo)
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/newfarol

# MySQL para produção (exemplo)
# DATABASE_URL=mysql://usuario:senha@localhost:3306/newfarol

# ============================================
# Security - OBRIGATÓRIO
# ============================================
# Chave secreta para assinatura JWT
# Gere uma chave forte: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=change-me-in-production-minimum-32-characters-long

# Algoritmo de assinatura JWT (padrão: HS256)
ALGORITHM=HS256

# Tempo de expiração do token de acesso em minutos (padrão: 30)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ============================================
# Azure AD OIDC (Opcional - para autenticação)
# ============================================
# Tenant ID do Azure AD
# AZURE_AD_TENANT_ID=seu-tenant-id

# Client ID da aplicação Azure AD
# AZURE_AD_CLIENT_ID=seu-client-id

# Client Secret da aplicação Azure AD
# AZURE_AD_CLIENT_SECRET=seu-client-secret

# URI de redirecionamento OAuth2
# AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# Se a aplicação é um cliente público (padrão: true)
# AZURE_AD_IS_PUBLIC_CLIENT=true

# ============================================
# Application
# ============================================
# Nome da aplicação (padrão: NewFarol)
APP_NAME=NewFarol

# Modo debug (padrão: false)
DEBUG=false

# Origins permitidas para CORS (separadas por vírgula)
# Em produção, especifique apenas os domínios necessários
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

# ============================================
# Monitoring (Opcional)
# ============================================
# Habilitar métricas (padrão: true)
ENABLE_METRICS=true

# Porta para métricas (padrão: 9090)
METRICS_PORT=9090
```

### Como gerar SECRET_KEY

Execute no terminal:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copie o resultado e cole no campo `SECRET_KEY` do arquivo `.env`.

---

## 📋 Painel Service UP - Backend

Crie um arquivo `.env` na pasta `Painel Service UP/backend/` com o seguinte conteúdo:

```env
# ============================================
# PAINEL SERVICE UP - Backend (Node.js/Express)
# ===========================================

# ============================================
# Database MySQL - OBRIGATÓRIO
# ============================================
# Host do banco de dados MySQL
DB_HOST=179.191.91.6

# Porta do banco de dados MySQL (padrão: 3306)
DB_PORT=3306

# Usuário do banco de dados MySQL
DB_USER=Combio.biomassa

# Senha do banco de dados MySQL
# IMPORTANTE: Não commite este arquivo com a senha real!
DB_PASSWORD=sua_senha_aqui

# ============================================
# Server
# ============================================
# Porta do servidor Express (padrão: 3000)
PORT=3000

# ============================================
# CORS Configuration
# ============================================
# URL do frontend New Farol (para CORS)
FRONTEND_URL=http://localhost:5173

# URL do frontend ServiceUp standalone (para CORS)
SERVICEUP_FRONTEND_URL=http://localhost:5174

# ============================================
# Environment
# ============================================
# Ambiente de execução (development, production)
NODE_ENV=development
```

---

## 📋 Frontend New Farol (Opcional)

Crie um arquivo `.env` na pasta `frontend/` se necessário:

```env
# URL do backend New Farol
VITE_API_URL=http://localhost:8000

# URL do frontend ServiceUp (para o iframe)
VITE_SERVICEUP_FRONTEND_URL=http://localhost:5174
```

---

## 📋 Frontend Service UP (Opcional)

Crie um arquivo `.env` na pasta `Painel Service UP/frontend/` se necessário:

```env
# URL do backend ServiceUp
VITE_API_URL=http://localhost:3000/api
```

---

## ⚠️ Importante

1. **Nunca commite arquivos `.env`** com credenciais reais no Git
2. **Use sempre valores de exemplo** nos commits
3. **Mantenha as credenciais seguras** e compartilhe apenas com pessoas autorizadas
4. **Em produção**, use variáveis de ambiente do sistema ou um gerenciador de segredos

---

## 🔍 Verificação

Após criar os arquivos `.env`, verifique se estão corretos:

### Backend New Farol
```bash
cd backend
python -c "from app.config import get_settings; s = get_settings(); print('✅ Config OK' if s.azdo_pat and s.secret_key else '❌ Config incompleta')"
```

### Backend Service UP
```bash
cd "Painel Service UP/backend"
node -e "require('dotenv').config(); console.log(process.env.DB_HOST ? '✅ Config OK' : '❌ Config incompleta')"
```
