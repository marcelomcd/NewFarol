# Problemas Conhecidos e Soluções

## 1. Backend New Farol - Arquivos de Rotas Ausentes

**Problema**: `ImportError: cannot import name 'features' from 'app.api.routes'`

**Status**: ✅ **CORRIGIDO TEMPORARIAMENTE**

**Solução Aplicada**: 
- Comentadas as importações e rotas que não existem
- O servidor agora pode iniciar, mas os endpoints não estarão disponíveis até que os arquivos de rotas sejam recriados

**Próximos Passos**:
- Recriar os arquivos de rotas necessários em `backend/app/api/routes/`
- Ou restaurar os arquivos do histórico do Git se foram removidos acidentalmente

---

## 2. Backend ServiceUp - Permissões MySQL

**Problema**: `SELECT command denied to user 'Combio.biomassa'@'172.16.0.1' for table 'chamados'`

**Status**: ⚠️ **PROBLEMA DE PERMISSÕES DO BANCO DE DADOS**

**Causa**: 
O usuário MySQL `Combio.biomassa` conecta com sucesso ao banco de dados `dw_combio`, mas **não tem permissão SELECT** na tabela `chamados`.

**Solução**:
Este é um problema de **configuração do banco de dados MySQL**, não do código. É necessário:

1. **Conectar ao MySQL como administrador** (root ou usuário com privilégios GRANT)
2. **Conceder permissões ao usuário**:

```sql
-- Conceder permissão SELECT na tabela chamados
GRANT SELECT ON dw_combio.chamados TO 'Combio.biomassa'@'%';

-- Ou conceder todas as permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE ON dw_combio.chamados TO 'Combio.biomassa'@'%';

-- Aplicar as mudanças
FLUSH PRIVILEGES;
```

**Nota**: 
- O IP `172.16.0.1` indica que a conexão está vindo de uma rede interna
- Pode ser necessário ajustar o host na permissão (`'%'` permite de qualquer host, ou especifique o IP específico)
- Verifique se o usuário tem permissão para acessar outras tabelas necessárias também

**Verificação**:
Após conceder as permissões, teste a conexão:

```sql
-- Conectar como o usuário
mysql -h 179.191.91.6 -u 'Combio.biomassa' -p'Biomassa@Dw.2023' dw_combio

-- Testar SELECT
SELECT COUNT(*) FROM chamados LIMIT 1;
```

---

## 3. Estrutura do Projeto

**Observação**: 
Os arquivos de rotas do backend New Farol parecem ter sido removidos ou não foram commitados. É necessário verificar o histórico do Git ou recriar esses arquivos para que a API funcione completamente.
