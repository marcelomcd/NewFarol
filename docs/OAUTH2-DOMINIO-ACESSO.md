# OAuth2 e Controle de Acesso por Domínio

Instruções para configurar OAuth2 e o padrão de reconhecimento de domínio para controle de acesso no Farol Operacional.

---

## 1. Visão Geral do Acesso

| Domínio | Acesso |
|---------|--------|
| **@qualiit.com.br** (domínio Quali IT) | Acesso total: todas as páginas, performance, filtros, exportações e dados de todos os clientes |
| **Outros domínios** (ex.: @consigaz.com.br, @combio.com.br) | Acesso restrito: **apenas Dashboard simplificada** com dados do seu cliente; sem Performance, sem outras páginas (Projetos, Task's, Relatórios, etc.) |

> **Nota:** O código usa `@qualiit.com.br`. Se seu domínio for diferente (ex.: @qualiti.com.br), altere em `backend/routes/auth.js` e `backend/utils/auth.js`.

---

## 2. Configuração OAuth2 (Microsoft Entra ID)

### 2.1 Variáveis de ambiente (backend)

Crie ou edite `backend/.env` com:

```env
# OAuth2 - Microsoft Entra ID
AZURE_AD_TENANT_ID=<seu-tenant-id>
AZURE_AD_CLIENT_ID=<seu-client-id>
AZURE_AD_CLIENT_SECRET=<seu-client-secret>
AZURE_AD_REDIRECT_URI=http://localhost:8000/api/auth/callback
AZURE_AD_IS_PUBLIC_CLIENT=false

# Frontend (onde redirecionar após login)
FRONTEND_URL=http://localhost:5173

# JWT
SECRET_KEY=<chave-secreta-mínimo-32-caracteres>
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Produção:** ajuste `AZURE_AD_REDIRECT_URI` e `FRONTEND_URL` para a URL pública (ex.: `https://newfarol.qualiit.com.br` e `https://newfarol.qualiit.com.br/api/auth/callback`).

### 2.2 Microsoft Entra ID – App Registration

1. **Portal Azure** → **Microsoft Entra ID** → **Registros de aplicativo** → **Novo registro**
2. Nome: `Farol Operacional`
3. **Tipos de conta**: "Contas apenas neste diretório organizacional (apenas [sua org] - tenant único)" → `AzureADMyOrg`
4. **URIs de redirecionamento**: Tipo **Web**:
   - Dev: `http://localhost:8000/api/auth/callback`
   - Prod: `https://<seu-dominio>/api/auth/callback`

5. **Certificados e segredos** → Novo segredo de cliente → copiar o valor para `AZURE_AD_CLIENT_SECRET`
6. **Permissões de API** (Microsoft Graph, delegado):
   - `openid`, `profile`, `email`

### 2.3 optionalClaims (id_token)

No **Manifesto** do app no Entra ID, inclua:

```json
"optionalClaims": {
  "idToken": [
    { "name": "email", "essential": false },
    { "name": "preferred_username", "essential": false },
    { "name": "name", "essential": false }
  ]
}
```

Assim o backend recebe `email` e `name` para regras de domínio.

### 2.4 Usuários B2B (clientes externos)

Para e-mails de outros domínios (ex.: @consigaz.com.br):

1. **Entra ID** → **Usuários** → **Convidar usuário externo**
2. Ou usar fluxo de convite por e-mail
3. O usuário convidado fará login com o tenant da Quali IT e o `id_token` trará o e-mail do domínio dele

---

## 3. Padrão de Reconhecimento de Domínio no Código

### 3.1 Backend – Regras atuais

**Arquivo:** `backend/utils/auth.js`

```javascript
// Domínio Quali IT = admin total (sem filtro de cliente)
function isQualiItAdmin(email) {
  return email.toLowerCase().endsWith('@qualiit.com.br');
}
```

- `@qualiit.com.br` → `is_admin: true` (definido no callback)
- Demais domínios → `is_admin: false` e `getUserClientFromEmail()` retorna o cliente (ex.: "Consigaz" para @consigaz.com.br)

**Arquivo:** `backend/routes/auth.js` (callback OAuth)

```javascript
const isAdmin = email.endsWith('@qualiit.com.br');
```

**Mapeamento domínio → cliente:** `backend/utils/auth.js` – objeto `DOMINIO_PARA_CLIENTE`. Para incluir novos clientes, adicione:

```javascript
"consigaz.com.br": "Consigaz",
"combio.com.br": "Combio",
// ... outros
```

### 3.2 Frontend – Regras atuais

**Arquivo:** `frontend/src/contexts/AuthContext.tsx`

O usuário possui:
- `is_admin`: boolean
- `can_access_serviceup`: boolean (Quali IT ou Combio)

**Arquivo:** `frontend/src/components/Navbar/Navbar.tsx`

Links filtrados por:
- `adminOnly` → visível apenas se `user?.is_admin`
- `serviceUpOnly` → visível se `user?.can_access_serviceup`

---

## 4. Implementar Acesso Restrito (clientes externos)

Hoje usuários não admin já têm dados filtrados no backend. Falta:

1. Esconder navegação de páginas admin para usuários restritos
2. Mostrar apenas Dashboard simplificada
3. Ocultar seção de Performance no Dashboard
4. Restringir rotas no frontend

### 4.1 Convenção

- `is_admin === true` → Acesso total (Quali IT)
- `is_admin === false` → Usuário de cliente: **Dashboard simplificada** e dados só do seu cliente

### 4.2 Alterações no frontend

#### A) Interface `User`

Em `AuthContext`, o objeto `User` já tem `is_admin`. Opcionalmente inclua `client?: string` (nome do cliente) para exibir na UI.

#### B) Navbar

Usuários restritos (`!user?.is_admin`):
- Mostrar apenas: **Dashboard**
- Ocultar: Painel Service UP (se não tiver `can_access_serviceup`), Projetos Ativos, Projetos Concluídos, Task's Ativas, Task's Concluídas, Relatórios

Exemplo de ajuste em `navLinks`:

```javascript
// Se usuário restrito (não admin), mostrar apenas Dashboard
const navLinks = [
  { path: '/', label: 'Dashboard' },
  { path: '/serviceup', label: 'Painel Service UP', serviceUpOnly: true },
  { path: '/projects/active', label: 'Projetos Ativos', adminOnly: true },
  // ...
].filter(link => {
  if (link.adminOnly) return isAuthenticated && user?.is_admin
  if (link.serviceUpOnly) return isAuthenticated && user?.can_access_serviceup
  return true
})
```

Isso já está implementado: `adminOnly` esconde as páginas para não admin.

#### C) Rotas protegidas (`App.tsx`)

Garantir que rotas admin (`/projects/*`, `/tasks/*`, `/reports`, etc.) redirecionem não admin para `/` (Dashboard). O componente `AdminOnlyRoute` já faz esse papel.

#### D) Dashboard simplificada

Criar uma variante do `InteractiveDashboard` para usuários restritos:

- Ocultar KPIs de Performance (ou área específica)
- Ocultar filtros avançados ou exportação
- Usar apenas dados do cliente (já filtrados pelo backend via token)

Exemplo de condição:

```javascript
const isRestrictedUser = !user?.is_admin
// Se isRestrictedUser: renderizar SimplifiedDashboard
// Senão: renderizar InteractiveDashboard completo
```

#### E) Dados da Dashboard simplificada

O que exibir será definido depois. Sugestões iniciais:

- Cards resumidos (features em andamento, tarefas abertas) só do cliente
- Sem gráficos de performance
- Sem exportação Excel
- Sem drill-down em KPIs sensíveis

O backend já aplica `getUserClientFilter(token)` nos endpoints de features/tasks, então a API retorna apenas dados do cliente quando o usuário não é admin.

---

## 5. Configuração do OAuth no Entra ID – Resumo

| Item | Valor |
|------|-------|
| Tipo de app | Web (não SPA, não público) |
| `signInAudience` | `AzureADMyOrg` |
| Reply URLs | Web, ex.: `http://localhost:8000/api/auth/callback` |
| Scopes | `openid profile email` |
| optionalClaims | `email`, `preferred_username`, `name` no id_token |
| Client secret | Configurar e usar em `AZURE_AD_CLIENT_SECRET` |

---

## 6. Checklist de Implementação

- [ ] Configurar `backend/.env` com variáveis OAuth2
- [ ] Registrar app no Entra ID e configurar Reply URLs, scopes, optionalClaims
- [ ] Incluir novos domínios em `DOMINIO_PARA_CLIENTE` em `backend/utils/auth.js` (se necessário)
- [ ] Confirmar que `AdminOnlyRoute` e `adminOnly` na Navbar restringem acesso
- [ ] Criar `SimplifiedDashboard` ou variante do Dashboard para usuários restritos
- [ ] Ocultar Performance/KPIs sensíveis para usuários restritos
- [ ] Definir e implementar os dados exibidos na Dashboard simplificada
- [ ] Testar com usuário @qualiit.com.br (acesso total) e com usuário de outro domínio (acesso restrito)

---

## 7. Referências

- [ENTRA-ID-MANIFEST.md](./ENTRA-ID-MANIFEST.md) – Detalhes do manifesto e B2B
- [README.md](../README.md) – Autenticação e variáveis de ambiente
- [DEPLOY.md](../DEPLOY.md) – Configuração de produção
