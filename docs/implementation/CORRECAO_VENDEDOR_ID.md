# 🔧 CORREÇÃO: Auto-Atribuição de Vendedor
**Data**: 09/12/2025  
**Status**: ⚠️ Requer execução manual de migration SQL

---

## 🐛 Problemas Identificados

### 1. ❌ Coluna `vendedor_responsavel_id` não existe
```
ERROR: column "vendedor_responsavel_id" does not exist
Hint: Perhaps you meant to reference the column "clientes.vendedor_responsavel"
```

**Causa**: A coluna `vendedor_responsavel_id` foi referenciada no código mas nunca foi criada no banco de dados.

### 2. ⚠️ `req.user` está undefined
```
👤 Usuário autenticado: undefined
```

**Causa**: O middleware de autenticação (`middleaware/auth.js`) usa `req.usuario`, mas o controller buscava `req.user`.

---

## ✅ Correções Implementadas

### 1. **Controller de Tarefas** (`controller/tarefasController.js`)
- ✅ Corrigido `req.user` → `req.usuario`
- ✅ Removido `vendedor_responsavel_id` do UPDATE query (até migration ser executada)
- ✅ Mantida lógica de auto-atribuição com validação de perfil

### 2. **Frontend** (`vanilla-version/script.js`)
- ✅ Removido código que busca `vendedor_responsavel_id` (campo ainda não existe)
- ✅ Mantido update de `vendedor_responsavel` (nome do vendedor)
- ✅ Toast notification funcionando

### 3. **Migration SQL Criada**
- 📄 Arquivo: `MIGRATION_VENDEDOR_ID.sql`
- ✅ Adiciona coluna `vendedor_responsavel_id INTEGER`
- ✅ Cria constraint de chave estrangeira para `usuarios(id)`
- ✅ Cria índice para performance
- ✅ Mapeia nomes existentes para IDs

---

## 🚀 Passos para Resolver (ORDEM OBRIGATÓRIA)

### **PASSO 1**: Executar Migration SQL ⚠️ **CRÍTICO**

1. Abra **pgAdmin** ou **psql**
2. Conecte no banco `etica_vendas`
3. Abra o arquivo `MIGRATION_VENDEDOR_ID.sql`
4. Execute o script SQL completo
5. Verifique a última query SELECT:
   ```
   total_clientes | com_vendedor_nome | com_vendedor_id | inconsistencias
   ```

**Exemplo de saída esperada**:
```
 total_clientes | com_vendedor_nome | com_vendedor_id | inconsistencias
----------------+-------------------+-----------------+----------------
             47 |                 3 |               3 |              0
```

---

### **PASSO 2**: Atualizar Controller para usar o novo campo

Depois da migration, você poderá **opcionalmente** atualizar o código para usar `vendedor_responsavel_id` ao invés de só o nome.

**Arquivo**: `controller/tarefasController.js`  
**Linha ~160**: Descomentar código que usa `vendedor_responsavel_id`

---

### **PASSO 3**: Reiniciar Servidor

```powershell
# Parar o servidor (Ctrl+C)
# Reiniciar
node server.js
```

---

### **PASSO 4**: Testar Auto-Atribuição

1. **Login**: `joao.vendedor@etica.com` / `123456`
2. **Filtrar** por clientes **SEM vendedor** (badge vermelho "Sem Vendedor")
3. **Abrir** qualquer cliente (ex: Centro Educacional Beta)
4. **Marcar** qualquer tarefa na esteira (ex: "Apresentar projeto - email")

**Resultado Esperado**:
- ✅ Console backend mostra:
  ```
  👤 Usuário que marcou tarefa: { id: 11, nome: 'João Vendedor', perfil_id: 2 }
  ✅ AUTO-ATRIBUINDO vendedor: João Vendedor
  ```
- ✅ Badge muda de "Sem Vendedor" (vermelho) para "João Vendedor" (azul)
- ✅ Toast aparece: "✅ Você foi atribuído como vendedor responsável de [Nome Cliente]!"

---

## 📊 Estado Atual dos Arquivos

| Arquivo | Status | Observação |
|---------|--------|------------|
| `controller/tarefasController.js` | ✅ Corrigido | Usa `req.usuario` + somente `vendedor_responsavel` |
| `vanilla-version/script.js` | ✅ Corrigido | Remove referências a `vendedor_responsavel_id` |
| `MIGRATION_VENDEDOR_ID.sql` | ✅ Criado | Pronto para executar no banco |
| `run-add-vendedor-id.js` | ⚠️ Não usado | Erro de autenticação - usar SQL direto |

---

## 🔍 Logs Esperados Após Correção

### Backend (Console do Node.js):
```
📥 Recebido PUT /api/clientes/:id/tarefas
📋 Cliente ID: 61
📦 Tarefas: { "prospeccao": [0, 1, 2], "aumentar_conexao": [0, 1] }
👤 Usuário autenticado: { id: 11, nome: 'João Vendedor', email: 'joao.vendedor@etica.com', perfil_id: 2, ... }
📊 Cliente atual: { id: 61, nome: 'Centro Educacional Beta', vendedor_responsavel: null }
🔄 Cliente sem vendedor. Verificando se usuário pode ser atribuído...
👤 Usuário que marcou tarefa: { id: 11, nome: 'João Vendedor', perfil_id: 2 }
✅ AUTO-ATRIBUINDO vendedor: João Vendedor
🎯 Novo status calculado: aumentar_conexao (Aumentar Conexão)
✅ Cliente atualizado - Status: aumentar_conexao
✅ Vendedor atribuído: João Vendedor
```

### Frontend (Console do Browser):
```
✅ Tarefas salvas com sucesso!
✅ Vendedor atribuído: João Vendedor
UI atualizada - Status: aumentar_conexao - Vendedor: João Vendedor
```

---

## ⚠️ Importante

### NÃO reiniciar o servidor antes de executar a migration SQL!

O código atual está configurado para funcionar **SEM** o campo `vendedor_responsavel_id`. Se você executar a migration e quiser usar o campo ID, será necessário uma segunda rodada de alterações no controller.

**Opção Recomendada**: 
1. Executar migration agora
2. Testar com `vendedor_responsavel` (nome)
3. Mais tarde, se quiser, migrar para usar `vendedor_responsavel_id` (ID)

---

## 📋 Checklist de Verificação

- [ ] Migration SQL executada com sucesso
- [ ] Coluna `vendedor_responsavel_id` existe no banco
- [ ] Servidor reiniciado
- [ ] Login como João Vendedor funcionando
- [ ] Badge "Sem Vendedor" visível em alguns clientes
- [ ] Ao marcar tarefa, vendedor é auto-atribuído
- [ ] Badge muda para "João Vendedor"
- [ ] Toast de sucesso aparece
- [ ] Console backend mostra logs de auto-atribuição

---

## 🆘 Se Ainda Houver Erro

1. **Verifique a migration**: `SELECT column_name FROM information_schema.columns WHERE table_name='clientes';`
2. **Verifique req.usuario**: Adicione `console.log('req.usuario:', req.usuario);` no inicio do controller
3. **Verifique token JWT**: Certifique-se que o login está retornando o token
4. **Verifique header Authorization**: No browser console, verifique se o header está sendo enviado

---

**Próximo Passo**: Executar `MIGRATION_VENDEDOR_ID.sql` no banco de dados! 🚀
