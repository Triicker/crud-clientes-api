# AI Assistant Prompts & Coding Standards

Este documento contém prompts pré-definidos e diretrizes de estilo para padronizar o desenvolvimento neste projeto (Node.js + Express + Vanilla JS + PostgreSQL).

## 🤖 Master Prompt (Para Configuração de Contexto)

Copie e cole este prompt ao iniciar uma nova sessão com seu assistente de IA para garantir que ele siga os padrões do projeto.

```markdown
Você é um especialista em desenvolvimento web Fullstack utilizando a stack: Node.js (Express v5), Vanilla JavaScript (Frontend), e PostgreSQL.

Siga estritamente estas diretrizes de estilo e arquitetura:

### 1. Backend (Node.js/Express)
- **Arquitetura**: Mantenha a separação clara entre Rotas -> Controllers -> Services (Lógica de Negócio) -> Repository/Model (Acesso a Dados).
- **Async/Await**: Use sempre `async/await` com blocos `try/catch` ou middleware de tratamento de erros (express-async-errors).
- **Segurança**: Nunca concatene strings em queries SQL. Use sempre queries parametrizadas ($1, $2) com `pg`.
- **Respostas**: Padronize as respostas da API em JSON: `{ success: boolean, data: any, message: string }`.
- **Logs**: Use logs estruturados. Evite `console.log` em produção; prefira bibliotecas de log ou `console.error` para erros críticos.

### 2. Frontend (Vanilla JS)
- **DOM**: Cacheie seletores do DOM em variáveis (ex: `const btn = document.getElementById(...)`).
- **Eventos**: Use `addEventListener`. Para listas dinâmicas, use delegação de eventos (adicione o listener no pai e verifique `e.target`).
- **Contexto**: Ao usar classes ou funções construtoras, capture o contexto com `const self = this;` antes de callbacks ou use Arrow Functions para preservar o `this`.
- **Segurança**: Evite `innerHTML` para dados de usuário (risco de XSS). Use `textContent` ou `createElement`.
- **Estado**: Mantenha o estado da UI centralizado quando possível, evitando depender apenas do DOM como fonte de verdade.

### 3. Banco de Dados (PostgreSQL)
- **Nomenclatura**: Use `snake_case` para tabelas e colunas (ex: `vendedor_responsavel`).
- **Consistência**: No código JS, converta para `camelCase` (ex: `vendedorResponsavel`) ao processar dados do banco.
- **Performance**: Evite `SELECT *`. Selecione apenas as colunas necessárias.

### 4. Geral
- **Código Limpo**: Nomes de variáveis descritivos (`isVendedorActive` vs `active`).
- **Comentários**: Comente o "porquê" e não o "como", exceto em lógicas complexas.
- **JSDoc**: Use JSDoc para documentar funções complexas e assinaturas de métodos.
```

---

## 📏 Regras de Ouro (Coding Standards)

### Backend (Node.js)

**❌ Ruim:**
```javascript
app.get('/users/:id', (req, res) => {
    const query = "SELECT * FROM users WHERE id = " + req.params.id; // SQL Injection!
    client.query(query, (err, result) => {
        if(err) console.log(err);
        res.send(result.rows);
    });
});
```

**✅ Bom:**
```javascript
// Controller
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await userService.findById(id);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error); // Passa para middleware de erro
    }
};

// Service/Repository
const findById = async (id) => {
    const query = 'SELECT id, nome, email FROM users WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
};
```

### Frontend (Vanilla JS)

**❌ Ruim:**
```javascript
// Perda de contexto e uso inseguro de HTML
function renderUsers(users) {
    users.forEach(function(u) {
        document.getElementById('list').innerHTML += '<div onclick="this.handleClick()">' + u.name + '</div>';
    });
}
```

**✅ Bom:**
```javascript
// Contexto preservado e DOM seguro
renderUsers(users) {
    const list = document.getElementById('list');
    const self = this; // Preserva contexto se necessário, ou use arrow function

    users.forEach(user => {
        const div = document.createElement('div');
        div.textContent = user.name;
        div.className = 'user-item';
        div.addEventListener('click', (e) => self.handleClick(user.id));
        list.appendChild(div);
    });
}
```

### Banco de Dados

- **Tabelas**: Plural, snake_case (`clientes`, `historico_vendas`).
- **Chaves Primárias**: `id` (SERIAL/UUID).
- **Chaves Estrangeiras**: `tabela_singular_id` (ex: `cliente_id`).
- **Datas**: Use `TIMESTAMPTZ` (Timestamp with time zone).

---

## 🛠️ Prompts para Tarefas Específicas

### Para Refatoração
> "Analise o arquivo [NOME_DO_ARQUIVO] e sugira refatorações focando em: 1. Segurança (SQL Injection/XSS), 2. Tratamento de Erros (try/catch faltantes), 3. Legibilidade (nomes de variáveis). Mantenha a lógica atual, apenas melhore a estrutura."

### Para Criar Novas Features
> "Crie uma nova funcionalidade de [NOME_DA_FEATURE]. Preciso de: 1. Script de Migração SQL, 2. Rota e Controller no Backend, 3. Funções de UI no Frontend (Vanilla JS). Siga o padrão de arquitetura existente no projeto."

### Para Debugging
> "Estou recebendo o erro [ERRO] ao tentar [AÇÃO]. Analise o fluxo entre o arquivo [ARQUIVO_FRONT] e [ARQUIVO_BACK]. Verifique se os nomes das variáveis batem com as colunas do banco de dados."
