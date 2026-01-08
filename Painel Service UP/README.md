# Painel Service UP

Sistema independente para visualização de chamados do banco de dados Combio.

## Estrutura

```
Painel Service UP/
├── backend/          # Backend Node.js/Express
│   ├── db/          # Conexão MySQL
│   ├── routes/      # Rotas da API
│   └── server.js    # Servidor Express
└── frontend/        # Frontend React/JSX
    ├── src/
    │   ├── components/  # Componentes React
    │   ├── contexts/    # Contextos React
    │   ├── hooks/       # Hooks customizados
    │   └── services/    # Serviços API
    └── vite.config.js  # Configuração Vite
```

## Tecnologias

- **Backend**: Node.js, Express, MySQL2
- **Frontend**: React, Vite, Tailwind CSS, Chart.js, Framer Motion
- **Estado**: React Query, Context API

## Instalação

### Backend

```bash
cd "Painel Service UP/backend"
npm install
```

### Frontend

```bash
cd "Painel Service UP/frontend"
npm install
```

## Configuração

### Backend (.env)

```env
DB_HOST=179.191.91.6
DB_PORT=3306
DB_USER=Combio.biomassa
DB_PASSWORD=sua_senha_aqui
PORT=3000
FRONTEND_URL=http://localhost:5173
SERVICEUP_FRONTEND_URL=http://localhost:5174
```

## Execução

### Backend

```bash
cd "Painel Service UP/backend"
npm run dev
```

Servidor rodando em: `http://localhost:3000`

### Frontend

```bash
cd "Painel Service UP/frontend"
npm run dev
```

Frontend rodando em: `http://localhost:5174`

## Integração com New Farol

O Painel Service UP é exibido dentro do New Farol via iframe na rota `/serviceup`.

- **Independência Total**: O ServiceUp funciona completamente independente do New Farol
- **Porta Dedicada**: Frontend roda na porta 5174
- **Backend Próprio**: Backend Node.js na porta 3000
- **CORS Configurado**: Permite requisições do New Farol (porta 5173) e do próprio ServiceUp (porta 5174)

## Manutenção

**Desenvolvedor Responsável**: Davi Silva

Qualquer alteração feita na pasta `Painel Service UP/` não afeta o funcionamento do New Farol. O sistema foi projetado para total independência.
