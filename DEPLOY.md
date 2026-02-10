# Deploy e troca de produção (Portal Clientes → New Farol)

## Objetivo

Substituir a **aplicação antiga** ([Portal Clientes](https://dev.azure.com/qualiit/ALM/_git/Qualiit.Portal.Clientes)) pela **New Farol** ([Qualiit.Portal.New.Farol](https://dev.azure.com/qualiit/ALM/_git/Qualiit.Portal.New.Farol)) **no mesmo link de produção**, sem conflito: desativar a antiga e ativar a nova na mesma URL.

---

## 1. Link de produção

- **URL atual (portal antigo):** a mesma que hoje serve o Portal Clientes (ex.: `https://newfarol.qualiit.com.br` ou o domínio que a Quali IT usar hoje).
- **Após a troca:** essa mesma URL passará a servir a **New Farol**. Os usuários continuam acessando o mesmo endereço.

Nenhuma alteração é feita no repositório do Portal Clientes; apenas se desativa a aplicação antiga no servidor e se sobe a New Farol no mesmo host/URL.

---

## 2. Desativar a aplicação antiga (Portal Clientes)

No servidor onde o Portal Clientes está em produção:

1. **Se usar Docker:** parar e remover os containers do portal antigo.
   ```bash
   cd /caminho/do/Qualiit.Portal.Clientes  # ou onde estiver o deploy
   docker compose down
   # ou: docker-compose down
   ```

2. **Se usar PM2 / Node direto:** parar o processo do portal antigo.
   ```bash
   pm2 stop all   # ou o nome do app antigo
   # ou encerrar o processo node que serve o portal antigo
   ```

3. **Se usar Nginx/Apache:** comentar ou remover o `server` / `VirtualHost` que aponta para o portal antigo (ou trocar o `proxy_pass`/DocumentRoot para a New Farol após o deploy).

Assim o link de produção deixa de servir a aplicação antiga e fica livre para a New Farol.

---

## 3. Subir a New Farol no mesmo link (Docker)

### 3.1 Pré-requisitos

- Docker e Docker Compose instalados no servidor.
- Arquivo `backend/.env` preenchido (copiar de `backend/.env.example` e ajustar para produção: `FRONTEND_URL`, `AZURE_AD_*`, etc.).

### 3.2 Deploy com Docker Compose

```bash
# No servidor, clonar ou atualizar o repositório New Farol
git clone https://dev.azure.com/qualiit/ALM/_git/Qualiit.Portal.New.Farol
cd Qualiit.Portal.New.Farol

# Criar backend/.env a partir do exemplo (se ainda não existir)
cp backend/.env.example backend/.env
# Editar backend/.env com valores de produção (FRONTEND_URL = URL pública, ex. https://newfarol.qualiit.com.br)

# Build e subir
docker compose up -d --build
```

- **Frontend (nginx)** escuta na porta **80** e serve o build do React.
- **Backend (Node)** roda internamente; `/api` e `/webhooks` são repassados do nginx para o backend.

### 3.3 Apontar o link de produção para este servidor

Se houver Nginx ou balanceador na frente:

- Apontar o domínio (ex.: `https://newfarol.qualiit.com.br`) para este host.
- Ou configurar um `server` (Nginx) com `proxy_pass http://localhost:80` para o container do frontend (porta 80 do docker compose).

Se o acesso for direto ao host na porta 80, o próprio `docker compose` já expõe a porta 80; basta garantir que firewall/DNS apontem para este servidor.

---

## 4. Variáveis de ambiente em produção (backend/.env)

Além das variáveis de desenvolvimento, ajustar para produção:

- `FRONTEND_URL` = URL pública do frontend (ex.: `https://newfarol.qualiit.com.br`).
- `AZURE_AD_REDIRECT_URI` = `https://newfarol.qualiit.com.br/api/auth/callback` (ou a URL pública + `/api/auth/callback`).
- No **Microsoft Entra ID** (Farol Operacional): em **Autenticação** > **URIs de redirecionamento**, adicionar a URL de produção (ex.: `https://newfarol.qualiit.com.br/api/auth/callback`).

---

## 5. Resumo do fluxo

| Passo | Ação |
|-------|------|
| 1 | Definir o link de produção (mesmo do portal antigo). |
| 2 | No servidor, desativar Portal Clientes (Docker/PM2/Nginx). |
| 3 | Clonar/atualizar Qualiit.Portal.New.Farol e configurar `backend/.env`. |
| 4 | `docker compose up -d --build` para subir a New Farol. |
| 5 | Apontar o domínio para este servidor (se ainda não estiver). |
| 6 | Configurar Entra ID com a URI de callback de produção. |

Assim a **página antiga** (Portal Clientes) é inativada e a **nova página** (New Farol) passa a responder no **mesmo link de produção**, sem conflito.
