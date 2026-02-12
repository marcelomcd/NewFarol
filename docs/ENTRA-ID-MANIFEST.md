# Farol Operacional – Análise e ajustes do manifesto (Microsoft Entra ID)

Este documento analisa o manifesto do app **Farol Operacional** no Microsoft Entra ID e indica o que ajustar para o New Farol funcionar com OAuth2, domínios para acesso, nome/sobrenome no topo da página, etc.

---

## 1. O que o New Farol espera do Entra ID

| Necessidade | Como o app usa |
|-------------|-----------------|
| **OAuth2 (authorization code)** | Backend troca `code` por token em `/api/auth/callback`; usa `client_id` + `client_secret` (não é cliente público). |
| **Identificação por domínio** | Backend lê `email` / `preferred_username` do `id_token` e define `is_admin` (@qualiit.com.br), `can_access_serviceup` (Quali IT ou @combio) e filtro por cliente (ex.: @consigaz.com.br). |
| **Nome no topo da página** | Backend envia `name` no JWT próprio; frontend exibe `user?.name || user?.email` na Navbar. O `name` vem do `id_token` do Entra (fallback: `preferred_username`, `email`, `sub`). |

Ou seja: o **id_token** deve trazer **name**, **email** (ou **preferred_username**) para tudo funcionar como desejado.

---

## 2. Análise do manifesto atual

### 2.1 O que está correto

- **allowPublicClient**: `false` — Correto. O backend usa `client_secret` na troca do código por token; cliente público seria `true` e poderia causar erro (ex.: AADSTS700025).
- **requiredResourceAccess** (Microsoft Graph, delegado):
  - `e1fe6dd8-ba31-4d61-89e7-88639da4683d` = **User.Read**
  - `37f7f235-527c-4136-accd-4a02d197296e` = **openid**
  - `14dad69e-099b-42c9-810b-d002981feec1` = **profile**
  - `64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0` = **email**
- **passwordCredentials**: client secrets presentes (valor não vem no manifesto por segurança).
- **replyUrlsWithType**: existe `http://localhost:8000/api/auth/callback` (tipo **Web**), que é o que o backend usa em desenvolvimento.

### 2.2 O que ajustar

1. **Reply URLs (produção)**  
   Só há callback de localhost. Para produção (CloudFront e/ou domínio próprio), é preciso adicionar as URLs de redirecionamento onde o backend realmente recebe o callback.

2. **optionalClaims**  
   Hoje só há `saml2Token` com `email`. O fluxo do New Farol é OAuth2/OIDC e usa o **id_token**. Incluir em **idToken** as claims `email`, `preferred_username` e `name` garante que o backend sempre receba nome e e-mail para exibir na navbar e para regras de domínio.

3. **signInAudience**  
   Está como `AzureADMultipleOrgs` (multitenant: qualquer org do Azure AD). Para “apenas Quali IT + convidados B2B”, o ideal é **AzureADMyOrg** (single tenant). Assim só o tenant Quali IT e os convidados que vocês convidarem conseguem entrar.

---

## 3. Manifesto sugerido (trechos a alterar)

Não é necessário reenviar o manifesto inteiro. No **Portal do Azure** → **Microsoft Entra ID** → **Registros de aplicativo** → **Farol Operacional** → **Manifesto**, altere apenas os blocos abaixo.

### 3.1 Adicionar Reply URLs de produção

Em **replyUrlsWithType**, além do localhost, inclua as URLs onde o backend New Farol está em produção (ex.: CloudFront e domínio Quali IT):

```json
"replyUrlsWithType": [
  {
    "url": "http://localhost:8000/api/auth/callback",
    "type": "Web"
  },
  {
    "url": "https://d2k6golik0z21l.cloudfront.net/api/auth/callback",
    "type": "Web"
  },
  {
    "url": "https://newfarol.qualiit.com.br/api/auth/callback",
    "type": "Web"
  }
]
```

- Use só as que forem realmente usadas (ex.: só CloudFront, ou só newfarol.qualiit.com.br).
- Todas devem ser **Web** (não SPA), pois o callback é no backend.

### 3.2 optionalClaims – garantir name e email no id_token

Substitua o bloco **optionalClaims** por:

```json
"optionalClaims": {
  "idToken": [
    { "name": "email", "essential": false },
    { "name": "preferred_username", "essential": false },
    { "name": "name", "essential": false }
  ],
  "accessToken": [],
  "saml2Token": [
    { "name": "email", "source": null, "essential": false, "additionalProperties": [] }
  ]
}
```

Assim o **id_token** passará a incluir **name**, **email** e **preferred_username**, e o backend continuará preenchendo corretamente o usuário (nome no topo, domínio para admin e filtro por cliente).

### 3.3 signInAudience (recomendado: só seu tenant + convidados)

Para limitar o login ao tenant Quali IT e convidados B2B:

```json
"signInAudience": "AzureADMyOrg"
```

- **AzureADMyOrg**: apenas contas do diretório Quali IT + usuários convidados (B2B).  
- Manter **AzureADMultipleOrgs** permitiria qualquer organização Azure AD; só use se for requisito explícito.

---

## 4. Resumo do que fazer no portal

| Onde no portal | Ação |
|----------------|------|
| **Autenticação** → URIs de redirecionamento | Adicionar `https://d2k6golik0z21l.cloudfront.net/api/auth/callback` (e, se usar, `https://newfarol.qualiit.com.br/api/auth/callback`) como tipo **Web**. |
| **Manifesto** → **optionalClaims** | Incluir em **idToken** as claims `email`, `preferred_username` e `name` (conforme JSON acima). |
| **Manifesto** → **signInAudience** | Alterar para `AzureADMyOrg` se quiser restringir a Quali IT + convidados. |
| **Permissões de API** | Manter **User.Read**, **openid**, **profile** e **email** (já estão no manifesto). Conceder consentimento do administrador se ainda não estiver concedido. |

---

## 5. Conferência no backend

Garanta no `backend/.env` de **produção**:

- `FRONTEND_URL` = URL pública do frontend (ex.: `https://d2k6golik0z21l.cloudfront.net`).
- `AZURE_AD_REDIRECT_URI` = exatamente uma das Reply URLs configuradas (ex.: `https://d2k6golik0z21l.cloudfront.net/api/auth/callback`).

O backend já usa `name`, `preferred_username` e `email` do id_token e já aplica as regras por domínio (@qualiit.com.br, @combio, etc.); com o manifesto ajustado, OAuth2, identificação por domínio e nome/sobrenome no topo da página passam a funcionar conforme desejado.
