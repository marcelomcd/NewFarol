# Backend Node.js - New Farol

Backend Node.js/Express para o sistema New Farol, substituindo o backend Python/FastAPI anterior.

## Estrutura

```
backend-nodejs/
├── routes/           # Rotas da API
│   ├── auth.js      # Autenticação
│   ├── features.js  # Features (principais)
│   ├── projects.js  # Projetos
│   ├── clients.js   # Clientes
│   └── ...
├── utils/            # Utilitários
│   ├── azureDevOpsClient.js  # Cliente Azure DevOps
│   └── wiql.js      # Queries WIQL
├── server.js        # Servidor principal
├── package.json     # Dependências
└── .env            # Variáveis de ambiente (não versionado)
```

## Instalação

```bash
cd backend-nodejs
npm install
```

## Configuração

Copie `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Variáveis obrigatórias:
- `AZDO_PAT`: Personal Access Token do Azure DevOps
- `SECRET_KEY`: Chave secreta para JWT (mínimo 32 caracteres)

## Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor iniciará em `http://localhost:8000`.

## Endpoints

- `GET /health` - Health check
- `GET /api` - Lista de endpoints disponíveis
- `GET /api/features` - Lista features
- `GET /api/features/:id` - Detalhes de uma feature
- `GET /api/projects` - Lista projetos
- `GET /api/clients/valid` - Lista clientes válidos
- `GET /api/auth/me` - Valida token

## Notas

- Este backend está em desenvolvimento e ainda não implementa todas as funcionalidades do backend Python anterior
- As rotas principais (features, projects, auth, clients) já estão funcionais
- Outras rotas (reports, export, workItems, azdo/consolidated) estão como placeholders
