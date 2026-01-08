# New Farol + Painel Service UP

Sistema unificado de visualização de projetos e chamados, composto por dois sistemas totalmente independentes que podem funcionar separadamente ou integrados via iframe.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Independência dos Sistemas](#independência-dos-sistemas)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [Uso](#uso)
- [Desenvolvimento](#desenvolvimento)
- [Equipe e Responsabilidades](#equipe-e-responsabilidades)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **New Farol** é um sistema desenvolvido em Python/FastAPI que exibe projetos do Azure DevOps da Quali IT. O **Painel Service UP** é um sistema desenvolvido em Node.js/Express que exibe chamados do banco de dados Combio. Ambos os sistemas são **totalmente independentes** e podem funcionar separadamente, mas o Painel Service UP pode ser exibido dentro do New Farol via iframe para uma experiência unificada.

### Características Principais

- ✅ **Total Independência**: Cada sistema funciona completamente sozinho
- ✅ **Integração Opcional**: Painel Service UP pode ser exibido dentro do New Farol via iframe
- ✅ **Manutenção Separada**: Cada desenvolvedor mantém seu próprio sistema
- ✅ **Tecnologias Diferentes**: Python/FastAPI (New Farol) e Node.js/Express (Service UP)
- ✅ **Bancos de Dados Separados**: PostgreSQL/SQLite (New Farol) e MySQL (Service UP)

---

## 🏗️ Arquitetura

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEW FAROL - Frontend (React/TypeScript)            │
│                         Porta: 5173                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Página Principal: /                                     │  │
│  │  - Lista de Features                                     │  │
│  │  - Dashboard                                             │  │
│  │  - Relatórios                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Página Service UP: /serviceup                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  <iframe src="http://localhost:5174">             │  │  │
│  │  │    ┌──────────────────────────────────────────┐   │  │  │
│  │  │    │  PAINEL SERVICE UP - Frontend            │   │  │  │
│  │  │    │  (React/JSX) - Porta: 5174               │   │  │  │
│  │  │    └──────────────────────────────────────────┘   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                          │
        ▼                                          ▼
┌───────────────────────┐              ┌───────────────────────┐
│ NEW FAROL - Backend   │              │ SERVICE UP - Backend │
│ (Python/FastAPI)      │              │ (Node.js/Express)    │
│ Porta: 8000           │              │ Porta: 3000          │
└───────────┬───────────┘              └───────────┬───────────┘
            │                                      │
            ▼                                      ▼
┌───────────────────────┐              ┌───────────────────────┐
│   Azure DevOps API    │              │   MySQL Database      │
│   (Quali IT)          │              │   (Combio)            │
└───────────────────────┘              └───────────────────────┘
```

### Fluxo de Dados

1. **New Farol**:
   - Frontend (React/TypeScript) → Backend (Python/FastAPI) → Azure DevOps API
   - Dados armazenados em PostgreSQL/SQLite

2. **Painel Service UP**:
   - Frontend (React/JSX) → Backend (Node.js/Express) → MySQL Database (Combio)
   - Funciona independentemente ou dentro do iframe do New Farol

3. **Integração via Iframe**:
   - New Farol exibe o Painel Service UP em `/serviceup`
   - O iframe carrega o frontend Service UP da porta 5174
   - Comunicação direta: Service UP Frontend → Service UP Backend (porta 3000)

---

## 🔒 Independência dos Sistemas

### Princípios de Independência

1. **Código Separado**: Cada sistema tem seu próprio código-fonte, sem dependências compartilhadas
2. **Backends Independentes**: Cada sistema tem seu próprio backend rodando em portas diferentes
3. **Bancos de Dados Separados**: Cada sistema acessa seu próprio banco de dados
4. **Deploy Independente**: Cada sistema pode ser deployado separadamente
5. **Manutenção Isolada**: Alterações em um sistema não afetam o outro

### ⚠️ GARANTIA DE INDEPENDÊNCIA

**IMPORTANTE**: Qualquer alteração de arquivos dentro da pasta `Painel Service UP/` **NÃO requer nenhuma alteração** nos arquivos do New Farol.

#### Como isso é garantido?

1. **Integração via Iframe**: O New Farol exibe o Service UP através de um simples `<iframe>` HTML
2. **Sem Imports Compartilhados**: O New Farol não importa nenhum componente ou código do Service UP
3. **URL Configurável**: A URL do Service UP é configurável via variável de ambiente (`VITE_SERVICEUP_FRONTEND_URL`)
4. **Sem Dependências de Código**: Não há dependências de código entre os sistemas

#### Exemplo Prático

```tsx
// frontend/src/pages/ServiceUp.tsx
// Este é o ÚNICO arquivo do New Farol que referencia o Service UP
// E ele usa apenas um iframe - sem imports, sem componentes compartilhados

const ServiceUp = () => {
  const serviceUpUrl = import.meta.env.VITE_SERVICEUP_FRONTEND_URL || 'http://localhost:5174';
  
  return (
    <iframe src={serviceUpUrl} title="Painel Service Up" />
  );
};
```

**Resultado**: 
- ✅ Davi pode alterar qualquer arquivo em `Painel Service UP/` sem afetar o New Farol
- ✅ Marcelo pode alterar qualquer arquivo em `backend/` ou `frontend/` sem afetar o Service UP
- ✅ Cada sistema funciona completamente sozinho

### O que acontece se um sistema falhar?

- ✅ **New Farol funciona sem Service UP**: Apenas a página `/serviceup` não funcionará
- ✅ **Service UP funciona sem New Farol**: Pode ser acessado diretamente em `http://localhost:5174`
- ✅ **Backend Service UP offline**: O iframe mostrará uma mensagem de erro, mas o New Farol continua funcionando
- ✅ **Backend New Farol offline**: O Service UP standalone continua funcionando normalmente

### Integração via Iframe

A integração é feita através de um `<iframe>` HTML simples:

```tsx
// frontend/src/pages/ServiceUp.tsx
// ÚNICO ponto de integração - apenas um iframe, sem imports ou dependências

const ServiceUp = () => {
  const serviceUpUrl = import.meta.env.VITE_SERVICEUP_FRONTEND_URL || 'http://localhost:5174';
  
  return (
    <iframe
      src={serviceUpUrl}
      title="Painel Service Up"
      className="w-full h-full border-0"
    />
  );
};
```

**Vantagens desta abordagem**:
- ✅ **Isolamento total**: JavaScript e CSS completamente separados
- ✅ **Sem conflitos**: Nenhuma dependência compartilhada
- ✅ **Atualização independente**: Cada sistema pode ser atualizado sem afetar o outro
- ✅ **Fácil depuração**: Cada sistema tem seu próprio console do navegador
- ✅ **Zero dependências de código**: O New Farol não importa nada do Service UP
- ✅ **Garantia de independência**: Alterações no Service UP nunca quebram o New Farol

---

## 🛠️ Tecnologias

### New Farol

**Frontend**:
- React 18+ (TypeScript)
- Vite
- Tailwind CSS
- React Router DOM
- React Query
- Axios

**Backend**:
- Python 3.11+
- FastAPI
- SQLAlchemy
- Pydantic
- Azure DevOps REST API

**Banco de Dados**:
- SQLite (desenvolvimento)
- PostgreSQL (produção)

### Painel Service UP

**Frontend**:
- React 19+ (JavaScript/JSX)
- Vite
- Tailwind CSS
- Chart.js
- Framer Motion
- React Query
- Axios

**Backend**:
- Node.js 18+
- Express
- MySQL2
- dotenv

**Banco de Dados**:
- MySQL (Combio)

---

## 📁 Estrutura do Projeto

```
NewFarol/
├── backend/                          # Backend New Farol (Python/FastAPI)
│   ├── app/
│   │   ├── api/                      # Rotas da API
│   │   ├── application/              # Casos de uso
│   │   ├── domain/                   # Entidades de domínio
│   │   ├── infrastructure/           # Implementações (Azure DevOps, DB)
│   │   ├── config.py                 # Configurações
│   │   └── main.py                   # Aplicação FastAPI
│   ├── .env                          # Variáveis de ambiente (criar a partir de .env.example)
│   ├── .env.example                  # Exemplo de variáveis de ambiente
│   ├── requirements.txt              # Dependências Python
│   └── venv/                         # Ambiente virtual Python
│
├── frontend/                         # Frontend New Farol (React/TypeScript)
│   ├── src/
│   │   ├── components/               # Componentes React
│   │   ├── pages/                    # Páginas (Features, Dashboard, ServiceUp)
│   │   ├── services/                 # Serviços API
│   │   ├── contexts/                 # Contextos React
│   │   └── utils/                    # Utilitários
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── Painel Service UP/                # Sistema Service UP (TOTALMENTE INDEPENDENTE)
│   ├── backend/                      # Backend Service UP (Node.js/Express)
│   │   ├── db/                       # Conexão MySQL
│   │   ├── routes/                   # Rotas da API
│   │   ├── server.js                 # Servidor Express
│   │   ├── .env                      # Variáveis de ambiente (criar a partir de .env.example)
│   │   ├── .env.example              # Exemplo de variáveis de ambiente
│   │   └── package.json
│   │
│   └── frontend/                     # Frontend Service UP (React/JSX)
│       ├── src/
│       │   ├── components/           # Componentes React
│       │   ├── contexts/             # Contextos React
│       │   ├── hooks/                 # Hooks customizados
│       │   └── services/             # Serviços API
│       ├── package.json
│       ├── vite.config.js
│       └── tailwind.config.js
│
├── start.bat                         # Script para iniciar todos os sistemas
├── README.md                         # Este arquivo
└── .gitignore                        # Arquivos ignorados pelo Git
```

---

## 📋 Pré-requisitos

### Software Necessário

1. **Python 3.11+**
   - Download: https://www.python.org/downloads/
   - Verificar instalação: `python --version`

2. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verificar instalação: `node --version`

3. **Git**
   - Download: https://git-scm.com/downloads
   - Verificar instalação: `git --version`

### Credenciais Necessárias

1. **Azure DevOps Personal Access Token (PAT)**
   - Acesse: https://dev.azure.com/qualiit/_usersSettings/tokens
   - Crie um token com permissões de leitura

2. **Credenciais MySQL (para Service UP)**
   - Host: 179.191.91.6
   - Porta: 3306
   - Usuário: Combio.biomassa
   - Senha: (fornecida separadamente)

---

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd NewFarol
```

### 2. Instalação Automática (Recomendado)

Execute o script `start.bat` que irá:
- Verificar dependências
- Instalar pacotes necessários
- Criar ambientes virtuais
- Iniciar todos os servidores

```bash
start.bat
```

### 3. Instalação Manual

#### Backend New Farol

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# ou: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

#### Frontend New Farol

```bash
cd frontend
npm install
```

#### Backend Service UP

```bash
cd "Painel Service UP/backend"
npm install
```

#### Frontend Service UP

```bash
cd "Painel Service UP/frontend"
npm install
```

---

## ⚙️ Configuração

### 1. Backend New Farol

Copie o arquivo de exemplo e configure:

```bash
cd backend
copy .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# OBRIGATÓRIO
AZDO_PAT=seu_personal_access_token_aqui
SECRET_KEY=uma-chave-secreta-com-pelo-menos-32-caracteres

# OPCIONAL (valores padrão funcionam para desenvolvimento)
AZDO_ORG=qualiit
DATABASE_URL=sqlite:///./newfarol.db
```

**Gerar SECRET_KEY**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Backend Service UP

Copie o arquivo de exemplo e configure:

```bash
cd "Painel Service UP/backend"
copy .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# OBRIGATÓRIO
DB_HOST=179.191.91.6
DB_PORT=3306
DB_USER=Combio.biomassa
DB_PASSWORD=sua_senha_aqui

# OPCIONAL
PORT=3000
FRONTEND_URL=http://localhost:5173
SERVICEUP_FRONTEND_URL=http://localhost:5174
```

### 3. Frontend New Farol (Opcional)

Crie um arquivo `.env` na pasta `frontend/` se necessário:

```env
VITE_API_URL=http://localhost:8000
VITE_SERVICEUP_FRONTEND_URL=http://localhost:5174
```

### 4. Frontend Service UP (Opcional)

Crie um arquivo `.env` na pasta `Painel Service UP/frontend/` se necessário:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## ▶️ Execução

### Método 1: Script Automático (Recomendado)

```bash
start.bat
```

Este script irá iniciar todos os servidores em janelas separadas:
- ✅ Backend New Farol (porta 8000)
- ✅ Backend Service UP (porta 3000)
- ✅ Frontend Service UP (porta 5174)
- ✅ Frontend New Farol (porta 5173)

### Método 2: Manual

#### Terminal 1 - Backend New Farol

```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Backend Service UP

```bash
cd "Painel Service UP/backend"
npm run dev
```

#### Terminal 3 - Frontend Service UP

```bash
cd "Painel Service UP/frontend"
npm run dev
```

#### Terminal 4 - Frontend New Farol

```bash
cd frontend
npm run dev
```

---

## 💻 Uso

### Acessar o Sistema

1. **New Farol (Principal)**
   - URL: http://localhost:5173
   - Páginas disponíveis:
     - `/` - Lista de Features
     - `/dashboard` - Dashboard de projetos
     - `/reports` - Relatórios
     - `/serviceup` - Painel Service UP (via iframe)

2. **Painel Service UP (Standalone)**
   - URL: http://localhost:5174
   - Acesso direto ao painel de chamados

### Funcionalidades

#### New Farol
- ✅ Visualização de Features do Azure DevOps
- ✅ Dashboard interativo
- ✅ Relatórios e métricas
- ✅ Detalhes de Features com campos normalizados
- ✅ Integração com Azure AD (opcional)

#### Painel Service UP
- ✅ Chamados atendidos (gráficos mensais)
- ✅ Status aberto/fechado
- ✅ Análise por domínio
- ✅ Análise por sistema (Datasul, Fluig)
- ✅ Performance de analistas
- ✅ Indicadores de SLA
- ✅ Satisfação do cliente
- ✅ Top 20 usuários

---

## 👥 Equipe e Responsabilidades

### New Farol
- **Desenvolvedor**: Marcelo Macedo
- **Linguagem**: Python (Backend) / TypeScript (Frontend)
- **Manutenção**: Responsável por todo o código em `backend/` e `frontend/`

### Painel Service UP
- **Desenvolvedor**: Davi Silva
- **Linguagem**: JavaScript/Node.js (Backend) / JavaScript/JSX (Frontend)
- **Manutenção**: Responsável por todo o código em `Painel Service UP/`

### Princípios de Manutenção

1. ✅ **Cada desenvolvedor mantém apenas seu sistema**
2. ✅ **Alterações em um sistema não afetam o outro**
3. ✅ **Comunicação entre sistemas apenas via iframe (sem dependências de código)**
4. ✅ **Deploy independente de cada sistema**

---

## 🔧 Desenvolvimento

### Estrutura de Desenvolvimento

```
Desenvolvedor New Farol (Marcelo)
├── Trabalha em: backend/ e frontend/
├── Não precisa conhecer: Painel Service UP/
└── Pode testar integração: Acessando /serviceup

Desenvolvedor Service UP (Davi)
├── Trabalha em: Painel Service UP/
├── Não precisa conhecer: backend/ e frontend/
└── Pode testar standalone: http://localhost:5174
```

### Adicionar Novas Funcionalidades

#### No New Farol
1. Adicione código em `backend/app/` ou `frontend/src/`
2. Teste localmente
3. Commit e push para o repositório
4. **Não altere nada em `Painel Service UP/`**

#### No Painel Service UP
1. Adicione código em `Painel Service UP/backend/` ou `Painel Service UP/frontend/`
2. Teste localmente (standalone)
3. Teste dentro do iframe do New Farol
4. Commit e push para o repositório
5. **Não altere nada em `backend/` ou `frontend/` (raiz)**

### Debugging

#### New Farol
- **Backend**: Logs no terminal onde o uvicorn está rodando
- **Frontend**: Console do navegador (F12) em http://localhost:5173

#### Painel Service UP
- **Backend**: Logs no terminal onde o Express está rodando
- **Frontend Standalone**: Console do navegador (F12) em http://localhost:5174
- **Frontend no Iframe**: Console do navegador (F12) na página `/serviceup` do New Farol

---

## 🐛 Troubleshooting

### Problema: "Painel Service UP não carrega no iframe"

**Solução**:
1. Verifique se o frontend Service UP está rodando na porta 5174
2. Acesse diretamente: http://localhost:5174
3. Verifique o console do navegador para erros de CORS
4. Verifique se o backend Service UP está rodando na porta 3000

### Problema: "Erro de CORS no Service UP"

**Solução**:
1. Verifique o arquivo `.env` do backend Service UP
2. Certifique-se de que `FRONTEND_URL` e `SERVICEUP_FRONTEND_URL` estão configurados
3. Reinicie o backend Service UP

### Problema: "Backend New Farol não inicia"

**Solução**:
1. Verifique se o arquivo `.env` existe em `backend/`
2. Verifique se `AZDO_PAT` e `SECRET_KEY` estão configurados
3. Verifique se o ambiente virtual está ativado
4. Verifique se todas as dependências estão instaladas: `pip install -r requirements.txt`

### Problema: "Erro de conexão com MySQL"

**Solução**:
1. Verifique o arquivo `.env` do backend Service UP
2. Verifique se `DB_PASSWORD` está correto
3. Verifique se o servidor MySQL está acessível
4. Teste a conexão manualmente

### Problema: "Dependências não instaladas"

**Solução**:
1. Delete as pastas `node_modules` e `package-lock.json`
2. Execute `npm install` novamente
3. Para Python, delete `venv/` e recrie: `python -m venv venv`

---

## 📝 Notas Importantes

1. **Nunca commite arquivos `.env`** com credenciais reais
2. **Use sempre `.env.example`** como template
3. **Teste ambos os sistemas separadamente** antes de testar a integração
4. **Mantenha a independência**: Não crie dependências de código entre os sistemas
5. **Documente alterações** que possam afetar a integração via iframe

---

## 📚 Recursos Adicionais

- [Documentação FastAPI](https://fastapi.tiangolo.com/)
- [Documentação React](https://react.dev/)
- [Documentação Express](https://expressjs.com/)
- [Documentação Azure DevOps REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/)

---

## 📄 Licença

Este projeto é propriedade da Quali IT.

---

**Última atualização**: Dezembro 2024
