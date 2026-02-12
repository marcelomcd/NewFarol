# Deploy e troca de produção (Portal Clientes → New Farol)

## Objetivo

Substituir a **aplicação antiga** ([Portal Clientes](https://dev.azure.com/qualiit/ALM/_git/Qualiit.Portal.Clientes)) pela **New Farol** ([Qualiit.Portal.New.Farol](https://dev.azure.com/qualiit/ALM/_git/Qualiit.Portal.New.Farol)) **no mesmo link de produção**, sem conflito: desativar a antiga e ativar a nova na mesma URL.

---

## 1. Link de produção

- **URL atual (portal antigo):** a mesma que hoje serve o Portal Clientes — por exemplo **https://d2k6golik0z21l.cloudfront.net** (CloudFront) ou `https://newfarol.qualiit.com.br`.
- **Após a troca:** essa mesma URL passará a servir a **New Farol**. Os usuários continuam acessando o mesmo endereço.
- **Substituição no CloudFront:** se o link de produção for o CloudFront acima, use o guia da [§6](#6-substituição-no-cloudfront-httpsd2k6golik0z21lcloudfrontnet).

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

---

## 6. Substituição no CloudFront (https://d2k6golik0z21l.cloudfront.net)

O **projeto antigo** (Qualiit.Portal.Clientes) está hoje atrelado à URL **https://d2k6golik0z21l.cloudfront.net**. Para o **projeto atual** (Qualiit.AzureProjects.ProjectIntegration / New Farol) passar a responder nessa mesma URL, é necessário:

### 6.1 O que você precisa ter

| Item | Descrição |
|------|-----------|
| **Acesso AWS** | Console (ou CLI) com permissão para editar a **distribuição CloudFront** e, se aplicável, a **origem** (EC2, ALB, S3). |
| **Build da aplicação** | Frontend (React) + Backend (Node) — o `docker-compose` do repositório já entrega os dois (nginx na porta 80 + proxy `/api` e `/webhooks` para o backend). |

### 6.2 Cenários de deploy

**Cenário A – Um único servidor (recomendado)**  
Igual ao [§3](#3-subir-a-new-farol-no-mesmo-link-docker): um servidor (EC2, ECS, VM, etc.) roda `docker compose up -d --build`. Esse servidor passa a ser a **única origem** do CloudFront.

- **CloudFront** → origem = `http://<ip-ou-dominio-do-servidor>:80` (ou apenas `http://...` se for porta 80).
- Comportamento padrão: todas as requisições (`/`, `/api/*`, `/webhooks/*`) vão para essa origem; o nginx do container serve o SPA e faz proxy de `/api` e `/webhooks` para o backend.

**Cenário B – S3 (frontend) + origem separada (API)**  
Frontend: build estático no S3. API: outro origin (ex.: ALB apontando para o backend Node).

- Criar **dois origins** no CloudFront: um para S3 (frontend), outro para o backend.
- **Behaviors**: path pattern `/api/*` e `/webhooks/*` → origin do backend; default → S3.
- Exige build do frontend publicado no S3 e backend exposto em uma URL; mais passos de configuração.

Para alinhar com o que já está no DEPLOY.md e com o `docker-compose`, o **Cenário A** é o mais direto.

### 6.3 Checklist para o link CloudFront

1. **Deploy da aplicação atual**
   - No servidor que será a nova origem: clonar/atualizar o repositório **Qualiit.AzureProjects.ProjectIntegration** (ou o nome atual do repo New Farol).
   - Configurar `backend/.env` com valores de **produção** (ver [§4](#4-variáveis-de-ambiente-em-produção-backendenv)).
   - Usar a URL do CloudFront como URL pública:
     - `FRONTEND_URL=https://d2k6golik0z21l.cloudfront.net`
     - `AZURE_AD_REDIRECT_URI=https://d2k6golik0z21l.cloudfront.net/api/auth/callback`
   - Rodar: `docker compose up -d --build` e garantir que o frontend (porta 80) e o backend respondem.

2. **Microsoft Entra ID (Azure AD)**
   - No app **Farol Operacional**: **Autenticação** → **URIs de redirecionamento**.
   - Adicionar: `https://d2k6golik0z21l.cloudfront.net/api/auth/callback`.
   - Salvar.

3. **CloudFront**
   - Na distribuição que hoje serve **d2k6golik0z21l.cloudfront.net**, editar a **origem**:
     - Trocar o origin atual (do projeto antigo) pela URL do **novo** servidor (ex.: `http://<novo-servidor>` ou o ALB/domínio que aponta para o `docker compose`).
   - Opcional: criar **invalidation** (`/*`) após o corte para não servir cache da aplicação antiga.

4. **Desativar o projeto antigo**
   - Parar a aplicação/serviço do **Portal Clientes** (Qualiit.Portal.Clientes) na origem antiga, ou removê-la da origem do CloudFront (já feito no passo 3 se você trocou a origem).

5. **Testes**
   - Acessar `https://d2k6golik0z21l.cloudfront.net`, fazer login (Microsoft), validar dashboard e chamadas à API.

### 6.4 Resumo

| Passo | Ação |
|-------|------|
| 1 | Deploy da New Farol (docker compose) no servidor que será a nova origem. |
| 2 | `backend/.env`: `FRONTEND_URL` e `AZURE_AD_REDIRECT_URI` = `https://d2k6golik0z21l.cloudfront.net` (e `/api/auth/callback`). |
| 3 | Entra ID: adicionar redirect URI do CloudFront. |
| 4 | CloudFront: apontar a origem da distribuição para o novo servidor. |
| 5 | Desativar aplicação antiga (Portal Clientes) na origem antiga. |
| 6 | (Opcional) Invalidar cache CloudFront; testar a URL. |

Com isso, o **projeto atual** substitui o antigo e passa a funcionar no link **https://d2k6golik0z21l.cloudfront.net**.
