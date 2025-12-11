# 🔧 CORREÇÕES CRÍTICAS: Auto-Atribuição de Vendedor
**Data**: 09/12/2025  
**Status**: ✅ CORRIGIDO - Pronto para teste

---

## 🐛 Problemas Identificados

### 1. ❌ JWT não continha `perfil_id` e `nome`
**Arquivo**: `controller/authController.js` (linha 43)

**Antes**:
```javascript
const token = jwt.sign({ 
    id: usuario.id, 
    email: usuario.email, 
    perfil: usuario.perfil_nome 
}, JWT_SECRET, { expiresIn: '8h' });
```

**Depois**:
```javascript
const token = jwt.sign({ 
    id: usuario.id, 
    nome: usuario.nome,           // ✅ ADICIONADO
    email: usuario.email, 
    perfil_id: usuario.perfil_id, // ✅ ADICIONADO
    perfil: usuario.perfil_nome 
}, JWT_SECRET, { expiresIn: '8h' });
```

**Impacto**: Sem `perfil_id`, o backend não conseguia verificar se o usuário era vendedor (perfil 2, 3 ou 4).

---

### 2. ⚠️ JWT_SECRET não tinha fallback
**Arquivo**: `middleaware/auth.js` (linha 3)

**Antes**:
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
```

**Depois**:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_super_secreto_aqui';

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET não definido! Usando valor padrão (INSEGURO em produção)');
}
```

**Impacto**: Se JWT_SECRET não estivesse no `.env`, o servidor falharia silenciosamente.

---

### 3. 🔍 Falta de logs detalhados
**Arquivo**: `controller/tarefasController.js`

**Adicionado**:
- ✅ Log de `req.usuario` completo
- ✅ Verificação de `Authorization` header
- ✅ Validação de entrada (`tarefas_concluidas`)
- ✅ Logs detalhados de erro (tipo, mensagem, stack, código SQL)

**Arquivo**: `middleaware/auth.js`

**Adicionado**:
- ✅ Log de verificação de token
- ✅ Log de token ausente/mal formatado
- ✅ Log de token válido com dados do usuário

---

## ✅ Arquivos Modificados

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `controller/authController.js` | JWT agora inclui `nome` e `perfil_id` | ✅ Corrigido |
| `middleaware/auth.js` | Fallback para JWT_SECRET + logs detalhados | ✅ Corrigido |
| `controller/tarefasController.js` | Validação + logs + tratamento de erros | ✅ Melhorado |
| `tests/test-auto-atribuicao-vendedor.js` | Teste E2E com Playwright | ✅ Criado |
| `tests/test-quick-vendedor.js` | Teste rápido de API | ✅ Criado |

---

## 🚀 Como Testar

### Opção 1: Teste Rápido (API direta)
```powershell
# 1. Reiniciar servidor
node server.js

# 2. Em outro terminal:
node tests/test-quick-vendedor.js
```

**Resultado esperado**:
```
✅ Login bem-sucedido!
📦 Payload do JWT:
   id: 11
   nome: João Vendedor
   perfil_id: 2
✅ JWT contém todos os campos necessários!
✅✅✅ SUCESSO! Vendedor foi auto-atribuído! ✅✅✅
```

---

### Opção 2: Teste E2E (Playwright)
```powershell
# 1. Reiniciar servidor
node server.js

# 2. Em outro terminal:
node tests/test-auto-atribuicao-vendedor.js
```

**O que o teste faz**:
1. Abre navegador (Chrome)
2. Faz login como `joao.vendedor@etica.com`
3. Busca cliente "Colégio Amadeus" ou outro sem vendedor
4. Abre esteira
5. Marca primeira tarefa não concluída
6. Verifica se badge mudou para "João Vendedor"

**Resultado esperado**:
- ✅ Badge muda de "Sem Vendedor" (vermelho) para "João Vendedor" (azul)
- ✅ Console mostra logs de auto-atribuição
- ✅ Navegador fica aberto para inspeção

---

### Opção 3: Teste Manual (Browser)
```powershell
# 1. Reiniciar servidor
node server.js

# 2. Abrir browser em http://localhost:5000/login.html

# 3. Login:
#    Email: joao.vendedor@etica.com
#    Senha: senha123

# 4. Procurar cliente com badge "Sem Vendedor"

# 5. Clicar no ícone de calendário (Histórico/Esteira)

# 6. Clicar em "Esteira"

# 7. Marcar qualquer tarefa não concluída

# 8. Fechar modal

# 9. Badge deve mudar para "João Vendedor" (azul)
```

---

## 🔍 Logs Esperados (Console do Servidor)

### ✅ Sucesso:
```
📍 PUT /api/clientes/61/tarefas
📥 Recebido PUT /api/clientes/:id/tarefas
📋 Cliente ID: 61
📦 Tarefas: { "prospeccao": [0, 1], ... }
🔐 Middleware Auth - Verificando token...
✅ Auth: Token válido para usuário: 11 João Vendedor perfil_id: 2
👤 req.usuario: { id: 11, nome: 'João Vendedor', email: '...', perfil_id: 2, ... }
🔑 req.headers.authorization: Presente
📊 Cliente atual: { id: 61, nome: 'Colégio Amadeus', vendedor_responsavel: null }
🔄 Cliente sem vendedor. Verificando se usuário pode ser atribuído...
👤 Usuário que marcou tarefa: { id: 11, nome: 'João Vendedor', perfil_id: 2 }
✅ AUTO-ATRIBUINDO vendedor: João Vendedor
🎯 Novo status calculado: prospeccao (Prospecção)
✅ Cliente atualizado - Status: prospeccao
✅ Vendedor atribuído: João Vendedor
📤 Retornando resposta para o frontend
```

### ❌ Falha (JWT sem perfil_id):
```
📍 PUT /api/clientes/61/tarefas
🔐 Middleware Auth - Verificando token...
✅ Auth: Token válido para usuário: 11 João Vendedor perfil_id: undefined
👤 req.usuario: { id: 11, email: '...', perfil: 'Vendedor' }
⚠️  Usuário não é vendedor (perfil_id: undefined )
```

### ❌ Falha (Token ausente):
```
📍 PUT /api/clientes/61/tarefas
🔐 Middleware Auth - Verificando token...
❌ Auth: Token não fornecido
```

---

## 🔄 Próximos Passos

1. **REINICIAR SERVIDOR** ⚠️ **OBRIGATÓRIO**
   ```powershell
   # Parar (Ctrl+C) e reiniciar:
   node server.js
   ```

2. **FAZER NOVO LOGIN** ⚠️ **OBRIGATÓRIO**
   - O token JWT antigo não contém `nome` e `perfil_id`
   - Fazer logout + login novamente para gerar novo token

3. **TESTAR AUTO-ATRIBUIÇÃO**
   - Usar um dos 3 métodos acima
   - Verificar logs do servidor
   - Confirmar badge mudou

---

## 📋 Checklist de Validação

### Antes de testar:
- [ ] Servidor reiniciado
- [ ] Logout realizado (limpar token antigo)
- [ ] Novo login com `joao.vendedor@etica.com`

### Durante teste:
- [ ] Console do servidor mostra "✅ Auth: Token válido para usuário: 11 João Vendedor perfil_id: 2"
- [ ] Console mostra "✅ AUTO-ATRIBUINDO vendedor: João Vendedor"
- [ ] Requisição retorna status 200 (não 500)

### Após teste:
- [ ] Badge mudou de "Sem Vendedor" para "João Vendedor"
- [ ] Cor do badge mudou de vermelho para azul
- [ ] Banco de dados atualizado: `SELECT vendedor_responsavel FROM clientes WHERE id=61;`

---

## 🆘 Troubleshooting

### Problema: Ainda erro 500
**Verificar**:
1. `SELECT * FROM clientes WHERE id=61;` - Cliente existe?
2. `SELECT * FROM usuarios WHERE id=11;` - Usuário existe?
3. Console do servidor - Qual erro exato?

### Problema: Token inválido
**Solução**: Limpar localStorage e fazer novo login
```javascript
// No console do browser:
localStorage.clear();
location.reload();
```

### Problema: req.usuario ainda undefined
**Verificar**:
1. Header `Authorization` está sendo enviado?
   - Abrir DevTools → Network → clientes/61/tarefas → Headers
   - Procurar por `Authorization: Bearer ...`
2. JWT_SECRET está correto?
   - Verificar `.env` ou usar fallback

---

## 📊 Estrutura do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND: Usuário marca tarefa na esteira               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REQUISIÇÃO: PUT /api/clientes/:id/tarefas               │
│    Headers: Authorization: Bearer [JWT_TOKEN]               │
│    Body: { tarefas_concluidas: {...} }                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MIDDLEWARE: auth.js                                      │
│    - Valida JWT                                             │
│    - Decodifica payload (id, nome, perfil_id)               │
│    - Popula req.usuario                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CONTROLLER: tarefasController.updateTarefas              │
│    - Busca cliente (vendedor_responsavel)                   │
│    - Se vendedor_responsavel = null:                        │
│      → Busca req.usuario.id na tabela usuarios              │
│      → Verifica perfil_id in [2, 3, 4]                      │
│      → Atribui vendedor_responsavel = req.usuario.nome      │
│    - Calcula novo status                                    │
│    - UPDATE clientes SET ... WHERE id=...                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RESPOSTA: { id, nome, vendedor_responsavel, ... }        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. FRONTEND: Atualiza badge + mostra toast                  │
│    Badge: "Sem Vendedor" → "João Vendedor"                  │
│    Cor: vermelho → azul                                     │
└─────────────────────────────────────────────────────────────┘
```

---

**Próximo Passo**: Reiniciar servidor + Fazer novo login + Testar! 🚀
