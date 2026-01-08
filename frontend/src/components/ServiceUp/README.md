# ⚠️ COMPONENTES LEGADOS - NÃO USAR

## ⚠️ ATENÇÃO: ESTES COMPONENTES NÃO SÃO MAIS USADOS

Esta pasta contém componentes **legados** que foram usados na implementação anterior do Service UP.

### ❌ NÃO USE ESTES COMPONENTES

**Estes componentes quebram a independência entre New Farol e Service UP.**

### ✅ Implementação Atual

O Service UP agora é exibido via **iframe** na página `frontend/src/pages/ServiceUp.tsx`.

A implementação atual usa apenas:
```tsx
<iframe src="http://localhost:5174" />
```

### 🔒 Garantia de Independência

Com a implementação via iframe:
- ✅ Qualquer alteração no "Painel Service UP" **NÃO requer** alterações no New Farol
- ✅ Os sistemas são **totalmente independentes**
- ✅ Cada desenvolvedor mantém apenas seu próprio código

### 📁 Estrutura Correta

```
NewFarol/
├── frontend/src/pages/ServiceUp.tsx  ← Usa apenas iframe
└── Painel Service UP/                ← Sistema independente completo
    ├── frontend/                      ← Frontend próprio
    └── backend/                       ← Backend próprio
```

### 🗑️ Remoção Futura

Estes componentes podem ser removidos em uma limpeza futura do código, pois não são mais necessários.

**Data de depreciação**: Dezembro 2024
