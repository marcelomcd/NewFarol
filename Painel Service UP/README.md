# Painel Service UP

Sistema independente para visualização e análise de dados de chamados do banco de dados Combio (`dw_combio`).

## 📋 Pré-requisitos

- Node.js 18+
- MySQL 8+
- Acesso ao banco de dados `dw_combio`

## 📂 Estrutura

```
Painel Service UP/
├── backend/                    # Backend Node.js/Express
│   ├── db/                     # Conexão MySQL
│   │   └── connection.js
│   ├── routes/                 # Rotas da API
│   │   └── chamados.js
│   ├── scripts/                # Scripts utilitários
│   │   └── check-tables.js
│   └── server.js               # Servidor Express
│
└── frontend/                   # Frontend React/JSX
    ├── src/
    │   ├── components/         # Componentes React
    │   │   └── ServiceUp/      # Componentes específicos do ServiceUp
    │   │       ├── slides/     # Slides de apresentação
    │   │       ├── DashboardCard.tsx
    │   │       ├── PresentationMode.tsx
    │   │       ├── QuickDateFilters.tsx
    │   │       └── ServiceUpAnalistaFilter.tsx
    │   ├── contexts/           # Contextos React
    │   │   ├── AbaControlContext.jsx
    │   │   ├── AnalistaFilterContext.jsx
    │   │   └── DateFilterContext.jsx
    │   ├── hooks/              # Hooks customizados
    │   │   └── useDateFilter.js
    │   └── services/           # Serviços API
    │       └── api.js
    ├── public/                 # Arquivos públicos
    │   ├── dados/              # Arquivos Excel (dados de exemplo)
    │   ├── qi_logo.png
    │   └── qi_logo_menor.png
    └── vite.config.js          # Configuração Vite
```

## 🛠️ Tecnologias

- **Backend**: Node.js, Express, MySQL2
- **Frontend**: React, Vite, Tailwind CSS, Chart.js, Framer Motion
- **Estado**: React Query, Context API
- **Banco de Dados**: MySQL (`dw_combio.bi_chamados_service_up`, `dw_combio.bi_chamados_satisfacao_service_up`)

## 📦 Instalação

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

## ⚙️ Configuração

### Backend (.env)

Crie o arquivo `.env` na pasta `backend/`:

```env
DB_HOST=179.191.91.6
DB_PORT=3306
DB_USER=Combio.biomassa
DB_PASSWORD=sua_senha_aqui
PORT=3000
FRONTEND_URL=http://localhost:5173
SERVICEUP_FRONTEND_URL=http://localhost:5174
```

### Frontend (.env) - Opcional

Crie o arquivo `.env` na pasta `frontend/` (opcional):

```env
VITE_API_URL=http://localhost:3000/api
```

## 🚀 Execução

### Backend

```bash
cd "Painel Service UP/backend"
npm run dev
```

Servidor rodando em: `http://localhost:3000`

**Scripts disponíveis:**
- `npm run dev` - Inicia servidor em modo desenvolvimento (watch mode)
- `npm start` - Inicia servidor em modo produção
- `npm run check-tables` - Verifica estrutura das tabelas no banco de dados

### Frontend

```bash
cd "Painel Service UP/frontend"
npm run dev
```

Frontend rodando em: `http://localhost:5174`

**Scripts disponíveis:**
- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza build de produção

## 🔗 Integração com New Farol

O Painel Service UP é **exibido dentro do New Farol** via iframe na rota `/serviceup`.

### 🤝 Independência Total

- **Porta Dedicada**: Frontend roda na porta **5174** (independente do New Farol que roda na porta 5173)
- **Backend Próprio**: Backend Node.js na porta **3000** (independente do backend New Farol que roda na porta 8000)
- **CORS Configurado**: Permite requisições do New Farol (porta 5173) e do próprio ServiceUp (porta 5174)
- **Nenhuma Dependência**: O ServiceUp funciona completamente independente do New Farol
- **Manutenção Isolada**: Qualquer alteração na pasta `Painel Service UP/` **não afeta** o funcionamento do New Farol

### 📊 Funcionamento

1. **Acesso Direto**: O ServiceUp pode ser acessado diretamente em `http://localhost:5174` sem necessidade do New Farol
2. **Acesso via New Farol**: O ServiceUp é exibido dentro do New Farol em `http://localhost:5173/serviceup` através de um `<iframe>` que carrega `http://localhost:5174`
3. **Comunicação**: O frontend ServiceUp (porta 5174) se comunica com o backend ServiceUp (porta 3000) via API REST

### ✅ Garantias de Isolamento

1. **Separação Física**: Cada sistema reside em sua própria pasta raiz (`Painel Service UP/` para ServiceUp)
2. **Processos Separados**: Cada backend e frontend roda em sua própria porta e processo
3. **Dependências Isoladas**: `node_modules` e `package.json` são independentes para cada frontend e backend
4. **Sem Compartilhamento de Código**: Não há importação direta de componentes ou módulos entre os sistemas
5. **Comunicação Unidirecional (Visual)**: A única "interação" é o New Farol renderizando o Service UP em um `<iframe>`
6. **Falha Isolada**: A falha de um sistema não afeta a funcionalidade do outro
7. **Manutenção Independente**: Desenvolvedores podem trabalhar em seus respectivos sistemas sem impactar o outro

### 💡 Exemplos Práticos

- ✅ Se você alterar um arquivo `.jsx` ou `.tsx` dentro de `Painel Service UP/frontend/src/`, apenas o frontend do ServiceUp será afetado. O New Farol continuará funcionando normalmente.
- ✅ Se você alterar um arquivo `.js` dentro de `Painel Service UP/backend/routes/`, apenas o backend do ServiceUp será afetado. O New Farol (frontend e backend) continuará funcionando sem interrupções.
- ✅ Se o servidor do ServiceUp (`http://localhost:5174`) estiver offline, a página `/serviceup` no New Farol exibirá uma mensagem de erro no iframe, mas o restante do New Farol (`/`, `/dashboard`, `/features`, etc.) funcionará perfeitamente.

Esta arquitetura garante que cada equipe possa desenvolver e manter seu sistema de forma autônoma, minimizando riscos e facilitando a colaboração.

## 📊 Endpoints da API

### Chamados

- `GET /api/chamados/atendidos` - Chamados atendidos (evolução mensal)
- `GET /api/chamados/aberto-fechado` - Chamados abertos vs fechados
- `GET /api/chamados/dominio` - Classificação por domínio
- `GET /api/chamados/datasul` - Análise Datasul (top 10)
- `GET /api/chamados/fluig` - Análise Fluig
- `GET /api/chamados/analistas` - Distribuição por analista
- `GET /api/chamados/sla` - SLA mensal
- `GET /api/chamados/sla-analista` - SLA por analista
- `GET /api/chamados/satisfacao` - Satisfação por analista
- `GET /api/chamados/satisfacao-classificacao` - Classificação de satisfação
- `GET /api/chamados/top-20-usuarios` - Top 20 usuários que mais abriram chamados
- `GET /api/chamados/lista-analistas` - Lista todos os analistas únicos

### Dashboard de Chamados

- `GET /api/chamados/dashboard/status` - Chamados por status
- `GET /api/chamados/dashboard/tempo-aberto` - Tempo de chamado aberto (semáforo)
- `GET /api/chamados/dashboard/ultima-atualizacao` - Última atualização (semáforo)
- `GET /api/chamados/dashboard/detalhes` - Tabela de detalhes (com filtros dinâmicos)
- `GET /api/chamados/dashboard/causa-raiz` - Chamados de causa raiz
- `GET /api/chamados/dashboard/em-andamento` - Chamados em andamento (causa raiz)

### Utilitários

- `GET /api/health` - Health check
- `GET /api` - Lista todos os endpoints disponíveis

## 🎯 Funcionalidades

### Filtros

- **Filtro de Data**: Por mês, ano ou intervalo personalizado (startDate/endDate)
- **Filtro de Analista**: Todos, QualiIT ou analistas selecionados
- **Filtro Rápido**: Botões para mês atual, mês anterior, ano atual, ano anterior

### Slides de Apresentação

O sistema inclui 16 slides de apresentação:

1. Chamados Atendidos - Evolução mensal
2. Top 20 Usuários - Usuários que mais abriram chamados
3. Aberto vs Fechado - Status dos chamados
4. Por Domínio - Distribuição por área
5. Datasul - Análise Datasul
6. Fluig - Análise Fluig
7. Analistas - Performance individual
8. SLA Mensal - Indicadores SLA
9. SLA Analista - SLA por analista
10. Satisfação - Classificação
11. Satisfação Detalhada - Por analista
12. Soluções de Causa Raiz e Melhorias – Resolvido – Setembro/2025
13. Soluções de Causa Raiz e Melhorias – Resolvido – Outubro/2025
14. Soluções de Causa Raiz e Melhorias – Resolvido – Novembro/2025
15. Soluções de Causa Raiz e Melhorias – Resolvido – Dezembro/2025
16. Dashboard de Chamados - Visão geral dos chamados

### Modo Apresentação

O sistema inclui um modo de apresentação em tela cheia que permite navegar entre os slides usando setas do teclado ou botões na tela.

## 📝 Notas Técnicas

### Normalização de Analistas

O sistema normaliza automaticamente os nomes de analistas removendo prefixos "Qualiit - ", "Qualiit - " e "Quallit - " antes de fazer comparações, garantindo que analistas sejam identificados corretamente mesmo com variações no nome.

### Dados Mockados

Alguns endpoints retornam dados mockados para períodos específicos (ex: novembro e dezembro de 2025 para SLA e Satisfação) quando os dados reais ainda não estão disponíveis no banco de dados.

## 👨‍💻 Manutenção

**Desenvolvedor Responsável**: Davi Silva

Qualquer alteração feita na pasta `Painel Service UP/` não afeta o funcionamento do New Farol. O sistema foi projetado para total independência.

## 📚 Estrutura de Dados

### Tabelas Utilizadas

- `dw_combio.bi_chamados_service_up` - Dados principais de chamados
- `dw_combio.bi_chamados_satisfacao_service_up` - Dados de satisfação

### Campos Principais

- `ticket_number`, `ticket_id` - Identificadores do chamado
- `created`, `closed`, `changed` - Datas importantes
- `owner_name`, `responsible_name` - Analistas responsáveis
- `state_name`, `state_type` - Status do chamado
- `service_name`, `queue_name` - Informações de serviço
- `customer_user` - Usuário que abriu o chamado
- `priority_id`, `solution_in_min` - Informações de SLA

## 🔧 Troubleshooting

### Erro de Conexão com Banco de Dados

Verifique:
1. As credenciais no arquivo `.env` do backend
2. Se o MySQL está rodando
3. Se a conexão de rede permite acesso ao servidor MySQL (179.191.91.6)

### Erro ao Carregar Dados no Frontend

Verifique:
1. Se o backend está rodando na porta 3000
2. Se o CORS está configurado corretamente
3. Se a URL da API está correta no arquivo `.env` do frontend (ou usando a padrão `http://localhost:3000/api`)

### Erro ao Exibir ServiceUp no New Farol

Verifique:
1. Se o frontend ServiceUp está rodando na porta 5174
2. Se o backend ServiceUp está rodando na porta 3000
3. Se o CORS está configurado para permitir requisições de `http://localhost:5173`

## 📄 Licença

ISC

## 👥 Autores

- **Davi Silva** - Desenvolvedor responsável pelo Painel Service UP
