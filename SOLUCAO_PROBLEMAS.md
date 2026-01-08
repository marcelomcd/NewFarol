# Solução dos Problemas de Carregamento

## ✅ Problema 1: ServiceUp sem dados (porta 5174)

**Status**: ✅ Funcionando (carrega corretamente)

**Problema**: Sem dados exibidos

**Solução**: Configurar arquivo `.env` no backend ServiceUp

1. Crie o arquivo `.env` em `Painel Service UP/backend/`
2. Copie o conteúdo de `Painel Service UP/backend/.env.example`
3. Preencha a senha do MySQL:

```env
DB_PASSWORD=sua_senha_aqui  # ← Preencha com a senha real
```

**Após configurar**: Reinicie o backend ServiceUp e os dados devem aparecer.

---

## ✅ Problema 2: New Farol sem dados (porta 5173)

**Status**: ✅ CORRIGIDO

**Problema**: Dashboard mostrava "Nenhum dado disponível" e valores zerados

**Causa**: Frontend não conseguia se comunicar com o backend (sem proxy configurado)

**Solução Aplicada**:

1. **Configurado proxy no Vite** (`frontend/vite.config.ts`):
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:8000',
       changeOrigin: true,
       secure: false,
     },
   }
   ```

2. **Ajustado baseURL da API** (`frontend/src/services/api.ts`):
   - Agora usa `/api` (relativo) que é proxyado para `http://localhost:8000/api`
   - Ou usa `VITE_API_URL` se configurado via variável de ambiente

**Como funciona agora**:
- Frontend faz requisição para: `/api/azdo/consolidated`
- Vite proxy redireciona para: `http://localhost:8000/api/azdo/consolidated`
- Backend responde com os dados
- Frontend exibe os dados no dashboard

---

## 🔄 Próximos Passos

### 1. Reiniciar o Frontend New Farol

**IMPORTANTE**: Após as alterações no `vite.config.ts`, você precisa **reiniciar o servidor Vite**:

1. Pare o servidor do frontend (Ctrl+C)
2. Inicie novamente: `cd frontend && npm run dev`

O proxy só funciona quando o Vite é reiniciado após mudanças no `vite.config.ts`.

### 2. Verificar se o Backend está respondendo

Teste manualmente:
```bash
curl http://localhost:8000/api/health
# ou
curl http://localhost:8000/api/azdo/consolidated
```

### 3. Verificar Console do Navegador

Abra o DevTools (F12) e verifique:
- **Network tab**: Veja se as requisições para `/api/*` estão sendo feitas
- **Console tab**: Veja se há erros de CORS ou conexão

### 4. Verificar Variáveis de Ambiente do Backend

Certifique-se de que o arquivo `.env` do backend New Farol está configurado:
- `AZDO_PAT`: Personal Access Token do Azure DevOps
- `SECRET_KEY`: Chave secreta para JWT

---

## 📋 Checklist de Verificação

- [ ] Backend New Farol rodando na porta 8000
- [ ] Frontend New Farol reiniciado após mudanças no vite.config.ts
- [ ] Arquivo `.env` do backend New Farol configurado (AZDO_PAT, SECRET_KEY)
- [ ] Console do navegador sem erros de CORS
- [ ] Network tab mostrando requisições para `/api/*` com status 200
- [ ] Backend ServiceUp com `.env` configurado (DB_PASSWORD)

---

## 🐛 Troubleshooting

### "Network Error" ou "Failed to fetch"

**Causa**: Backend não está rodando ou proxy não está funcionando

**Solução**:
1. Verifique se o backend está rodando: `http://localhost:8000/health`
2. Reinicie o frontend após mudanças no `vite.config.ts`
3. Verifique se o proxy está configurado corretamente

### "401 Unauthorized" ou "403 Forbidden"

**Causa**: Problema de autenticação

**Solução**:
1. Verifique se está logado no sistema
2. Verifique se o token está sendo enviado nas requisições
3. Verifique as configurações de autenticação no backend

### Dados ainda aparecem como "0" ou "Nenhum dado"

**Causa**: Backend não está retornando dados ou Azure DevOps não está configurado

**Solução**:
1. Verifique se `AZDO_PAT` está configurado corretamente
2. Verifique se o backend consegue se conectar ao Azure DevOps
3. Verifique os logs do backend para erros

---

## 📝 Notas Importantes

1. **Proxy do Vite**: Só funciona em desenvolvimento. Em produção, use `VITE_API_URL` com URL absoluta
2. **Reinício necessário**: Sempre reinicie o Vite após mudanças no `vite.config.ts`
3. **CORS**: O backend já está configurado para aceitar requisições de `http://localhost:5173`

---

**Última atualização**: Dezembro 2024
