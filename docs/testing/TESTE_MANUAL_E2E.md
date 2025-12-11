# 📋 Teste Manual E2E - Auto-atribuição de Vendedor

## 🎯 Objetivo
Validar a consistência entre backend e frontend no fluxo completo:
1. Pesquisa de CNPJ no Gemini Search
2. Adição de novo cliente
3. Login como vendedor
4. Marcação de tarefa na esteira
5. **Validação de auto-atribuição do vendedor**

---

## 🔧 Pré-requisitos

### 1. Servidor Rodando
```powershell
node server.js
```
✅ Servidor deve estar em: `http://localhost:3000`

### 2. Credenciais de Teste
- **Admin**: `novo@admin.com` / `senha123`
- **Vendedor**: `joao.vendedor@etica.com` / `senha123`

### 3. API Key do Gemini
```
AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs
```

---

## 📝 PASSO 1: Pesquisar CNPJ no Gemini Search (Opcional)

### Ações:
1. Acesse: `http://localhost:3000/gemini-search/`
2. Cole a API Key do Gemini no campo apropriado
3. Digite um CNPJ válido: `07876452000194`
4. Clique em **"Buscar"** ou **"Pesquisar"**
5. Aguarde os resultados da busca

### ✅ Resultado Esperado:
- Dados do CNPJ devem aparecer na tela
- Informações como razão social, endereço, etc.

### ⚠️ Nota:
Este passo é opcional - você pode pular e ir direto para adicionar o cliente manualmente.

---

## 📝 PASSO 2: Login como Admin

### Ações:
1. Acesse: `http://localhost:3000/login.html`
2. Preencha:
   - **Email**: `novo@admin.com`
   - **Senha**: `senha123`
3. Clique em **"Entrar"**

### ✅ Resultado Esperado:
- Redirecionamento para `http://localhost:3000/index.html`
- Tabela de clientes visível
- Nome do usuário admin no canto superior direito

---

## 📝 PASSO 3: Adicionar Novo Cliente

### Ações:
1. Na página principal (`index.html`), clique no botão **"+ Adicionar Cliente"** ou **"Novo"**
2. Preencha o formulário:
   - **Nome**: `E2E Test Cliente` (ou qualquer nome)
   - **CNPJ**: `07876452000194` (ou outro válido)
   - **Tipo**: `PJ`
   - **Telefone**: `(11) 98765-4321`
   - **Email**: `teste@example.com`
   - **Cidade**: `São Paulo`
   - **UF**: `SP`
3. Clique em **"Salvar"**

### ✅ Resultado Esperado:
- Modal fecha automaticamente
- Cliente aparece na tabela
- Badge do vendedor mostra: **"Sem Vendedor"** (cinza)
- Cliente está no estágio inicial (ex: `aumentar_conexao`)

### 📸 Checkpoint 1:
**Antes de continuar, anote:**
- ✏️ Nome do cliente criado: `_______________________`
- ✏️ Status inicial: `_______________________`
- ✏️ Badge vendedor: `Sem Vendedor` ✅

---

## 📝 PASSO 4: Logout do Admin

### Ações:
1. Clique no botão **"Sair"** ou **"Logout"** (canto superior direito)
2. Aguarde redirecionamento para tela de login

### ✅ Resultado Esperado:
- Volta para `http://localhost:3000/login.html`
- Não consegue acessar `index.html` sem login

---

## 📝 PASSO 5: Login como Vendedor (João)

### Ações:
1. Na tela de login (`http://localhost:3000/login.html`), preencha:
   - **Email**: `joao.vendedor@etica.com`
   - **Senha**: `senha123`
2. Clique em **"Entrar"**

### ✅ Resultado Esperado:
- Redirecionamento para `index.html`
- Nome "João Vendedor" visível no header
- Tabela com os clientes (incluindo o que você criou)

---

## 📝 PASSO 6: Localizar o Cliente Criado

### Ações:
1. Na tabela de clientes, procure pelo cliente que você criou no **PASSO 3**
2. Verifique a coluna **"Vendedor Responsável"**

### ✅ Resultado Esperado (Antes de marcar tarefa):
- ⚪ Badge cinza com texto: **"Sem Vendedor"**
- Status do cliente: `aumentar_conexao` (ou outro inicial)

### 📸 Checkpoint 2 - ANTES:
```
┌─────────────────────────────────────────────────┐
│ Cliente: E2E Test Cliente                       │
│ Status: aumentar_conexao (verde)                │
│ Vendedor: 🔘 Sem Vendedor (cinza)               │
└─────────────────────────────────────────────────┘
```

---

## 📝 PASSO 7: Abrir Esteira do Cliente

### Ações:
1. Na linha do cliente criado, clique no botão **"Esteira"** ou ícone de funil
2. Aguarde o modal/dashboard da esteira abrir

### ✅ Resultado Esperado:
- Modal da esteira abre com tabela de tarefas
- Primeira coluna mostra tarefas do estágio `aumentar_conexao`
- Células não marcadas (vazias ou com checkbox desmarcado)

---

## 📝 PASSO 8: Marcar PRIMEIRA Tarefa na Esteira 🎯

### Ações:
1. **Localize a PRIMEIRA tarefa** do primeiro estágio (`aumentar_conexao`)
2. **Clique na célula/checkbox** para marcar como concluída
3. Aguarde 1-2 segundos

### ✅ Resultado Esperado:
- ✅ Célula fica marcada (mudança visual)
- 🎉 Toast notification aparece: **"✅ Você foi atribuído como vendedor responsável!"**
- Tarefa salva automaticamente

### 📸 Checkpoint 3 - MOMENTO CRÍTICO:
**O que deve acontecer instantaneamente:**
- Backend salva: `vendedor_responsavel = "João Vendedor"`
- Toast confirma atribuição
- (Frontend deve atualizar o badge - vamos validar no próximo passo)

---

## 📝 PASSO 9: Fechar Esteira e Recarregar Página

### Ações:
1. Feche o modal da esteira (botão X, ESC, ou botão "Fechar")
2. **RECARREGUE A PÁGINA** com **Ctrl + F5** (hard refresh)
3. Aguarde a tabela carregar completamente

### ✅ Resultado Esperado - VALIDAÇÃO PRINCIPAL:
- 🔵 Badge do vendedor mudou de cinza para **AZUL**
- 📛 Texto do badge: **"João Vendedor"**
- Status do cliente pode ter mudado (ex: `aumentar_conexao` → `envio_consultor`)

### 📸 Checkpoint 4 - DEPOIS:
```
┌─────────────────────────────────────────────────┐
│ Cliente: E2E Test Cliente                       │
│ Status: envio_consultor (laranja)               │
│ Vendedor: 🔵 João Vendedor (azul)  ✅✅✅       │
└─────────────────────────────────────────────────┘
```

---

## 🎯 VALIDAÇÃO FINAL - Checklist Completo

### ✅ Validações de Sucesso:

- [ ] **Badge mudou de cor**: Cinza → Azul
- [ ] **Badge mudou de texto**: "Sem Vendedor" → "João Vendedor"
- [ ] **Toast notification** apareceu ao marcar tarefa
- [ ] **Status do cliente** progrediu na esteira
- [ ] **Badge persiste** após recarregar página (Ctrl+F5)

### 🔍 Validações Técnicas (Console do Navegador):

1. Abra **DevTools** (F12) → Aba **Console**
2. Procure por logs:
   ```
   🔄 Antes de renderTable - Vendedor do cliente: João Vendedor
   ```

3. Abra **DevTools** (F12) → Aba **Network**
4. Procure pela requisição de salvar tarefa (POST `/clientes/{id}/tarefas`)
5. Verifique a resposta:
   ```json
   {
     "vendedor_responsavel": "João Vendedor"
   }
   ```

---

## ❌ TESTE NEGATIVO: Admin NÃO deve ser auto-atribuído

### Objetivo:
Validar que apenas perfis de **vendedor** são auto-atribuídos.

### Ações:
1. Faça logout do vendedor
2. Login como admin: `novo@admin.com` / `senha123`
3. Crie um novo cliente
4. Abra a esteira e marque uma tarefa
5. Recarregue a página

### ✅ Resultado Esperado:
- ⚪ Badge continua **CINZA** com "Sem Vendedor"
- ❌ Admin **NÃO** é atribuído como vendedor responsável
- Apenas vendedores (perfil_id 2, 3, 4) são auto-atribuídos

---

## 🐛 Troubleshooting

### Problema: Badge não atualiza após marcar tarefa

**Soluções:**
1. **Recarregue com Ctrl+F5** (hard refresh - limpa cache)
2. Abra console (F12) e procure erros JavaScript
3. Verifique se apareceu o log: `🔄 Antes de renderTable - Vendedor do cliente:`
4. Verifique Network tab: Response da API deve ter `vendedor_responsavel`

### Problema: Toast não aparece

**Possíveis causas:**
- Variável `selectedClient` não foi atualizada
- Erro no salvamento da tarefa
- Problema no código do toast notification

**Solução:**
- Verifique console do navegador por erros
- Confirme que tarefa foi salva (ícone de loading desaparece)

### Problema: Badge fica cinza mesmo após reload

**Possíveis causas:**
- Backend não salvou `vendedor_responsavel`
- Usuário não é vendedor (perfil_id diferente de 2, 3, 4)
- Bug no código de renderização do badge

**Solução:**
1. Verifique no terminal do servidor se há logs de erro
2. Abra DevTools → Network → Veja resposta da API GET `/clientes`
3. Confirme que `vendedor_responsavel` contém "João Vendedor"

---

## 📊 Resumo das Mudanças Implementadas

### Backend (100% Funcional ✅)
- ✅ Coluna `vendedor_responsavel` salva o nome do vendedor
- ✅ Auto-atribuição ao marcar primeira tarefa
- ✅ Valida perfil do usuário (apenas perfis 2, 3, 4)
- ✅ JWT contém `nome` e `perfil_id`

### Frontend (Corrigido ✅)
- ✅ Badge verifica `vendedor_responsavel` (nome) em vez de `vendedor_responsavel_id` (ID)
- ✅ Renderização do badge atualiza após salvar tarefa
- ✅ Toast notification usa variável correta (`selectedClient`)
- ✅ Event listeners apenas em badges clicáveis

### Testes
- ✅ Backend: `node test-vendor-auto-assign.js` → 100% sucesso
- 🧪 E2E Manual: Este guia de teste

---

## 🎉 Critério de Sucesso

O teste E2E é considerado **SUCESSO** quando:

1. ✅ Cliente criado aparece com badge "Sem Vendedor" (cinza)
2. ✅ Vendedor marca tarefa na esteira
3. ✅ Toast aparece: "Você foi atribuído como vendedor responsável"
4. ✅ Badge muda para "João Vendedor" (azul)
5. ✅ Badge persiste após Ctrl+F5
6. ✅ Admin NÃO é auto-atribuído ao marcar tarefas

---

## 📸 Screenshots Esperados

### ANTES (Admin cria cliente):
![Badge Cinza](badge-sem-vendedor-cinza.png)

### DEPOIS (Vendedor marca tarefa):
![Badge Azul](badge-joao-vendedor-azul.png)

---

## 🔗 Links Úteis

- **Login**: http://localhost:3000/login.html
- **Dashboard**: http://localhost:3000/index.html
- **Gemini Search**: http://localhost:3000/gemini-search/
- **Servidor**: `node server.js` (Porta 3000)

---

## 📝 Template de Relatório

**Data do Teste**: ___/___/___  
**Testador**: ________________  
**Versão**: 1.0

| Passo | Status | Observações |
|-------|--------|-------------|
| 1. Gemini Search | ⬜ PASS ⬜ FAIL | |
| 2. Login Admin | ⬜ PASS ⬜ FAIL | |
| 3. Adicionar Cliente | ⬜ PASS ⬜ FAIL | |
| 4. Logout Admin | ⬜ PASS ⬜ FAIL | |
| 5. Login Vendedor | ⬜ PASS ⬜ FAIL | |
| 6. Localizar Cliente | ⬜ PASS ⬜ FAIL | |
| 7. Abrir Esteira | ⬜ PASS ⬜ FAIL | |
| 8. Marcar Tarefa | ⬜ PASS ⬜ FAIL | |
| 9. Validar Badge Azul | ⬜ PASS ⬜ FAIL | |
| 10. Teste Negativo (Admin) | ⬜ PASS ⬜ FAIL | |

**Resultado Final**: ⬜ APROVADO ⬜ REPROVADO

**Bugs Encontrados**:
- [ ] Nenhum
- [ ] Badge não atualiza: _______________________
- [ ] Toast não aparece: _______________________
- [ ] Outro: _______________________

---

**Última Atualização**: Dezembro 2025  
**Versão do Guia**: 1.0
