# 🔧 Guia Rápido do Desenvolvedor - Sistema de Esteira

## 📁 Arquivos Principais

```
crud-clientes-api/
├── routes/tarefas.js              # Endpoints da API
├── controller/tarefasController.js # Lógica de negócio
├── vanilla-version/script.js       # Frontend (ClientManager class)
└── config/db.js                    # Conexão PostgreSQL
```

---

## 🔌 API Endpoints

### GET `/api/clientes/:id/esteira`
Retorna status e tarefas concluídas do cliente.

**Request:**
```http
GET /api/clientes/123/esteira
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "PROSPECÇÃO",
  "tarefas_concluidas": {
    "prospeccao": [0, 1, 2],
    "aumentar_conexao": [],
    "envio_consultor": [4],
    "efetivacao": [0, 2],
    "registros_legais": [],
    "separacao": [0, 4],
    "entrega": [1],
    "recebimentos": [],
    "formacao": [3, 4],
    "documentarios": [],
    "gerar_graficos": [2],
    "renovacao": []
  }
}
```

---

### PUT `/api/clientes/:id/tarefas`
Salva tarefas atualizadas do cliente.

**Request:**
```http
PUT /api/clientes/123/tarefas
Authorization: Bearer <token>
Content-Type: application/json

{
  "prospeccao": [0, 1],
  "aumentar_conexao": [2],
  "envio_consultor": [4]
  // ... demais etapas
}
```

**Response:**
```json
{
  "message": "Tarefas atualizadas com sucesso",
  "tarefas_concluidas": { /* ... */ }
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `clientes`
```sql
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cnpj VARCHAR(18),
    status VARCHAR(50) DEFAULT 'PROSPECÇÃO',
    tarefas_concluidas JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Índice para Performance
```sql
CREATE INDEX idx_tarefas_concluidas ON clientes USING GIN (tarefas_concluidas);
```

---

## 🎯 Estrutura de Etapas (Frontend)

### Array de Etapas
```javascript
const etapas = [
    { id: 'prospeccao', nome: '3 canais de prospecção', tipo: 'PROSPECÇÃO' },
    { id: 'aumentar_conexao', nome: 'Aumentar conexão', tipo: 'PROSPECÇÃO' },
    { id: 'envio_consultor', nome: 'Envio de consultor', tipo: 'REPRESENTANTE OU DISTRIB' },
    { id: 'efetivacao', nome: 'Efetivação', tipo: 'DIRETOR' },
    { id: 'registros_legais', nome: 'Registros legais', tipo: 'LOGÍSTICA' },
    { id: 'separacao', nome: 'Separação', tipo: 'LOGÍSTICA' },
    { id: 'entrega', nome: 'Entrega', tipo: 'LOGÍSTICA' },
    { id: 'recebimentos', nome: 'Recebimentos', tipo: 'FINANCEIRO' },
    { id: 'formacao', nome: 'Formação', tipo: 'FORMADORES' },
    { id: 'documentarios', nome: 'Documentários', tipo: 'MARKETING' },
    { id: 'gerar_graficos', nome: 'Gerar gráficos', tipo: 'TECNOGIA E GERENCIA DADOS' },
    { id: 'renovacao', nome: 'Renovação', tipo: 'MARKETING' }
];
```

### Array de Ações
```javascript
const acoes = [
    { label: 'AÇÃO 1', values: ['email', 'envio', /* ... */] },
    { label: 'AÇÃO 2', values: ['whatsapp', 'envio', /* ... */] },
    { label: 'AÇÃO 3', values: ['ligação', 'entregar', /* ... */] },
    { label: 'AÇÃO 4', values: ['', 'formalizar', /* ... */] },
    { label: '', values: ['alimenta sistema', /* ... */] }
];
```

---

## 🎨 Mapa de Cores

```javascript
const getCor = (tipo) => {
    const cores = {
        'PROSPECÇÃO': '#ffff00',
        'REPRESENTANTE OU DISTRIB': '#ff9966',
        'DIRETOR': '#00ccff',
        'LOGÍSTICA': '#cccccc',
        'FINANCEIRO': '#ffff00',
        'FORMADORES': '#ffcc99',
        'MARKETING': '#99ff99',
        'TECNOGIA E GERENCIA DADOS': '#ccccff'
    };
    return cores[tipo] || '#fff';
};
```

---

## 🔧 Métodos Principais (ClientManager)

### `renderEsteiraProcessosTableInTableContainer(selectedClient)`
Renderiza a tabela Excel-style da esteira.

**Parâmetros:**
- `selectedClient`: Objeto com dados do cliente
  - `id`: ID do cliente
  - `tarefas_concluidas`: Objeto JSONB com tarefas

**Retorno:** `void` (insere HTML no DOM)

---

### `salvarTarefasCliente(clienteId, tarefasConcluidas)`
Salva tarefas no backend via API.

**Parâmetros:**
- `clienteId`: Number
- `tarefasConcluidas`: Object

**Retorno:** `Promise<void>`

**Exemplo:**
```javascript
await this.salvarTarefasCliente(123, {
    prospeccao: [0, 1],
    aumentar_conexao: [2]
});
```

---

## 🧪 Testes de Desenvolvimento

### Teste Manual
1. Abrir `vanilla-version/index.html`
2. Fazer login
3. Clicar em "Esteira/Funil" de um cliente
4. Marcar/desmarcar células
5. Verificar salvamento no console
6. Recarregar página e verificar persistência

### Teste de Responsividade
```bash
# Redimensionar janela do navegador
# Ou usar DevTools:
# F12 → Toggle Device Toolbar (Ctrl+Shift+M)
# Testar em: iPhone SE, iPad, Desktop
```

### Verificar Salvamento
```sql
-- No PostgreSQL
SELECT nome, tarefas_concluidas 
FROM clientes 
WHERE id = 123;
```

---

## 🐛 Debug

### Logs Úteis
```javascript
// Em script.js - método renderEsteiraProcessosTableInTableContainer
console.log('✅ Tarefas salvas com sucesso');
console.error('❌ Erro ao salvar tarefas:', error);
```

### Verificar Estado do Cliente
```javascript
// No console do navegador
console.log(selectedClient.tarefas_concluidas);
// Exemplo de output:
// {
//   prospeccao: [0, 1, 2],
//   aumentar_conexao: [],
//   ...
// }
```

### Verificar Token JWT
```javascript
// No console do navegador
console.log(localStorage.getItem('token'));
```

---

## 📱 CSS Responsivo

### Clamp() Function
```css
/* Sintaxe: clamp(min, preferido, max) */

/* Fontes */
font-size: clamp(8px, 1.4vw, 11px);   /* Células */
font-size: clamp(9px, 1.5vw, 11px);   /* Headers */
font-size: clamp(12px, 2vw, 16px);    /* Título */

/* Espaçamento */
padding: clamp(4px, 1vw, 8px);
margin: clamp(16px, 3vw, 32px);
```

### Mobile Optimization
```css
/* Touch targets mínimos */
min-height: 44px; /* iOS Human Interface Guidelines */
min-width: 44px;

/* Smooth scrolling */
-webkit-overflow-scrolling: touch;

/* Prevenir seleção acidental */
user-select: none;
-webkit-user-select: none;

/* Touch action */
touch-action: manipulation; /* Reduz delay */
```

---

## 🔐 Autenticação

### Verificar Token
```javascript
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}
```

### Headers da API
```javascript
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};
```

---

## 🚀 Deploy

### Variáveis de Ambiente
```bash
# .env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=seu_secret_aqui
PORT=3000
NODE_ENV=production
```

### Iniciar Servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### Migrations
```bash
# Criar coluna tarefas_concluidas
psql -d crud_clientes -f MIGRATION_TAREFAS_ESTEIRA.sql
```

---

## 📦 Dependências

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
```

---

## 🎓 Convenções de Código

### Nomenclatura
```javascript
// Variáveis: camelCase
const clienteAtual = getCliente();

// Constantes: UPPER_SNAKE_CASE
const MAX_TAREFAS = 60;

// Classes: PascalCase
class ClientManager { }

// IDs de Etapa: snake_case
const etapaId = 'prospeccao';
```

### Comentários
```javascript
// ✅ Bom: Explica o "porquê"
// Previne zoom duplo no mobile ao tocar rapidamente
e.preventDefault();

// ❌ Ruim: Explica o "o quê" (óbvio)
// Incrementa i
i++;
```

---

## 🔄 Fluxo de Dados

```
┌──────────┐
│ Cliente  │
│ clica em │
│  célula  │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Event Listener   │
│ (click handler)  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Toggle Estado    │
│ (add/remove idx) │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Atualiza UI      │
│ (muda cor verde) │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ PUT /tarefas     │
│ (salva backend)  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ PostgreSQL       │
│ (UPDATE JSONB)   │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Response 200 OK  │
│ (confirma save)  │
└──────────────────┘
```

---

## 📚 Recursos Adicionais

- [PostgreSQL JSONB Docs](https://www.postgresql.org/docs/current/datatype-json.html)
- [CSS clamp() Function](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

**Última Atualização**: Janeiro 2025  
**Versão do Sistema**: 2.0  
**Mantenedor**: Equipe de Desenvolvimento
