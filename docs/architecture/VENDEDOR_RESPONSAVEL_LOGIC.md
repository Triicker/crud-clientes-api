# Documentação: Lógica de Atribuição do Vendedor Responsável

## Estado Atual

### Problema Identificado
O campo `vendedor_responsavel` atualmente não possui validação ou regra de negócio definida:

```javascript
// controller/clientesController.js - linha 16
const { ..., vendedor_responsavel, ... } = req.body;

// linha 29 - valor inserido diretamente sem validação
const values = [..., vendedor_responsavel, ...];
```

**Problemas:**
- ✗ Aceita qualquer valor (inclusive string vazia ou inválida)
- ✗ Não valida se o vendedor existe na tabela `usuarios`
- ✗ Não há regra definida de QUANDO o vendedor deve ser atribuído
- ✗ Permite atribuição no momento da prospecção (antes de qualquer interação comercial)

---

## Regra de Negócio Recomendada

### Quando Atribuir o Vendedor

O `vendedor_responsavel` deve ser atribuído **SOMENTE** quando houver uma ação qualificada do vendedor, não durante a fase de prospecção inicial.

#### Momento da Atribuição

**Prospecção (Lead Frio):**
- Status: `Prospecção`
- vendedor_responsavel: `NULL`
- Descrição: Cliente foi encontrado via pesquisa (Gemini, PNCP), mas ainda não houve contato

**Primeira Interação (Lead Quente):**
- Trigger: Qualquer uma das ações abaixo:
  1. Mudança de status de `Prospecção` → `Contato Inicial` (ou superior)
  2. Criação de primeira interação (email/ligação/reunião)
  3. Criação de primeira proposta
  4. Atribuição manual explícita pelo gestor
- vendedor_responsavel: Atribuído ao usuário que executou a ação
- Descrição: Vendedor assume responsabilidade pelo relacionamento

---

## Implementação Proposta

### 1. Validação no Controller

```javascript
// controller/clientesController.js

// Função auxiliar: Validar se vendedor existe
async function validarVendedor(nome) {
    if (!nome) return { valido: true, vendedor: null }; // NULL é permitido
    
    const result = await pool.query(
        'SELECT id, nome FROM usuarios WHERE nome = $1 AND ativo = true',
        [nome]
    );
    
    if (result.rows.length === 0) {
        return { valido: false, vendedor: null };
    }
    
    return { valido: true, vendedor: result.rows[0] };
}

// Modificar createCliente
exports.createCliente = async (req, res) => {
    const { ..., vendedor_responsavel, ... } = req.body;
    
    // NOVA VALIDAÇÃO
    if (vendedor_responsavel) {
        const validacao = await validarVendedor(vendedor_responsavel);
        if (!validacao.valido) {
            return res.status(400).json({ 
                erro: 'Vendedor inválido',
                mensagem: `O vendedor "${vendedor_responsavel}" não existe ou está inativo.`
            });
        }
    }
    
    // Forçar NULL se status for Prospecção (regra de negócio)
    const vendedorFinal = status === 'Prospecção' ? null : vendedor_responsavel;
    
    const values = [..., vendedorFinal, ...];
    // ... resto do código
};

// Modificar updateCliente
exports.updateCliente = async (req, res) => {
    const { id } = req.params;
    const { ..., status, vendedor_responsavel, ... } = req.body;
    
    // Buscar cliente atual
    const clienteAtual = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (clienteAtual.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }
    
    const cliente = clienteAtual.rows[0];
    
    // LÓGICA DE ATRIBUIÇÃO AUTOMÁTICA
    let vendedorFinal = vendedor_responsavel;
    
    // Se está saindo de Prospecção e ainda não tem vendedor
    if (cliente.status === 'Prospecção' && status !== 'Prospecção' && !cliente.vendedor_responsavel) {
        // Atribuir ao usuário da sessão (req.user.nome)
        if (req.user && req.user.nome) {
            vendedorFinal = req.user.nome;
            console.log(`✓ Vendedor atribuído automaticamente: ${vendedorFinal}`);
        }
    }
    
    // Validar se vendedor existe
    if (vendedorFinal) {
        const validacao = await validarVendedor(vendedorFinal);
        if (!validacao.valido) {
            return res.status(400).json({ 
                erro: 'Vendedor inválido',
                mensagem: `O vendedor "${vendedorFinal}" não existe ou está inativo.`
            });
        }
    }
    
    const values = [..., vendedorFinal, ...];
    // ... resto do código
};
```

### 2. Atribuição Automática via Interações

```javascript
// controller/interacoesController.js

exports.createInteracao = async (req, res) => {
    const { cliente_id, tipo, descricao, usuario_responsavel } = req.body;
    
    try {
        // Buscar cliente
        const clienteResult = await pool.query(
            'SELECT id, status, vendedor_responsavel FROM clientes WHERE id = $1',
            [cliente_id]
        );
        
        if (clienteResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }
        
        const cliente = clienteResult.rows[0];
        
        // REGRA: Se é a primeira interação e cliente está em Prospecção
        if (cliente.status === 'Prospecção' && !cliente.vendedor_responsavel) {
            // Atribuir vendedor automaticamente
            const vendedor = usuario_responsavel || req.user.nome;
            
            await pool.query(
                `UPDATE clientes 
                 SET vendedor_responsavel = $1, status = 'Contato Inicial' 
                 WHERE id = $2`,
                [vendedor, cliente_id]
            );
            
            console.log(`✓ Cliente movido para "Contato Inicial" e atribuído a ${vendedor}`);
        }
        
        // Criar interação...
        // ... resto do código
    } catch (error) {
        // ...
    }
};
```

### 3. Middleware de Autenticação

Para que `req.user` esteja disponível, garantir que o middleware de autenticação está ativo:

```javascript
// server.js
const authMiddleware = require('./middleaware/auth');

// Aplicar middleware em rotas protegidas
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/interacoes', authMiddleware, interacoesRoutes);
```

---

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PROSPECÇÃO (Lead Frio)                                   │
│    ├─ Status: "Prospecção"                                  │
│    ├─ vendedor_responsavel: NULL                            │
│    └─ Origem: Pesquisa Gemini, PNCP, importação            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Trigger de Atribuição (um dos):     │
        │  • Status → "Contato Inicial"+       │
        │  • Primeira interação registrada     │
        │  • Primeira proposta criada          │
        │  • Atribuição manual do gestor       │
        └───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CONTATO INICIAL (Lead Quente)                            │
│    ├─ Status: "Contato Inicial" (ou superior)               │
│    ├─ vendedor_responsavel: [Nome do Vendedor]             │
│    └─ Responsabilidade atribuída                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PIPELINE (Processo de Venda)                             │
│    ├─ Status: Proposta → Negociação → Fechamento           │
│    ├─ vendedor_responsavel: Mantido (não muda)             │
│    └─ Todas as ações rastreadas sob o mesmo vendedor       │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefícios da Implementação

### Qualidade de Dados
✅ Impede vendedores inválidos no banco
✅ Garante rastreabilidade (quem trabalhou com qual cliente)
✅ Evita atribuições prematuras (antes do contato real)

### Métricas Precisas
✅ Relatórios de vendas refletem trabalho real
✅ Taxa de conversão por vendedor mais precisa
✅ Identificação de leads órfãos (sem vendedor após 30 dias)

### Gestão Comercial
✅ Gestor pode ver leads "livres" (prospecção sem vendedor)
✅ Redistribuição de carteira baseada em dados reais
✅ Auditoria de quando cada vendedor assumiu cada cliente

---

## Checklist de Implementação

- [ ] Adicionar função `validarVendedor()` no clientesController
- [ ] Modificar `createCliente()` com validação
- [ ] Modificar `updateCliente()` com atribuição automática
- [ ] Atualizar `createInteracao()` para atribuir vendedor
- [ ] Garantir que `req.user` está disponível (middleware auth)
- [ ] Criar migration para limpar vendedores inválidos existentes
- [ ] Atualizar documentação da API
- [ ] Criar testes unitários para validação

---

## Migração de Dados Existentes

```sql
-- 1. Identificar vendedores inválidos
SELECT DISTINCT vendedor_responsavel 
FROM clientes 
WHERE vendedor_responsavel IS NOT NULL
  AND vendedor_responsavel NOT IN (SELECT nome FROM usuarios WHERE ativo = true);

-- 2. Limpar vendedores inválidos (definir NULL)
UPDATE clientes 
SET vendedor_responsavel = NULL
WHERE vendedor_responsavel IS NOT NULL
  AND vendedor_responsavel NOT IN (SELECT nome FROM usuarios WHERE ativo = true);

-- 3. Aplicar regra de Prospecção (NULL para clientes em Prospecção)
UPDATE clientes 
SET vendedor_responsavel = NULL
WHERE status = 'Prospecção';
```

---

## Consultas Úteis

```sql
-- Ver distribuição de clientes por vendedor
SELECT 
    COALESCE(vendedor_responsavel, '[SEM VENDEDOR]') as vendedor,
    status,
    COUNT(*) as total
FROM clientes
GROUP BY vendedor_responsavel, status
ORDER BY vendedor, status;

-- Ver leads órfãos (sem vendedor há mais de 30 dias)
SELECT id, nome, cidade, uf, created_at
FROM clientes
WHERE vendedor_responsavel IS NULL
  AND status != 'Prospecção'
  AND created_at < NOW() - INTERVAL '30 days'
ORDER BY created_at;

-- Ver primeiro contato de cada vendedor
SELECT 
    c.vendedor_responsavel,
    MIN(i.data_interacao) as primeira_interacao,
    COUNT(DISTINCT c.id) as total_clientes
FROM clientes c
LEFT JOIN interacoes i ON c.id = i.cliente_id
WHERE c.vendedor_responsavel IS NOT NULL
GROUP BY c.vendedor_responsavel;
```

---

**Última Atualização:** 2025-01-19  
**Autor:** Sistema de Documentação Automática
