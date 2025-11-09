# 🚀 Guia Completo de Deploy no Render

Este projeto está configurado para rodar como aplicação monolítica no Render: um único Web Service Node.js que serve o frontend (da pasta `vanilla-version/`) e a API em `/api`.

## 📦 Arquitetura do Deploy

```
┌─────────────────────────────────────┐
│   Render Web Service (Node.js)     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  Frontend    │  │   API       │ │
│  │  (Static)    │  │  /api/*     │ │
│  │  /login.html │  │  Express    │ │
│  │  /index.html │  │  Routes     │ │
│  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Render PostgreSQL Database        │
│   - banco_clientes                  │
│   - Tabelas: clientes, usuarios...  │
└─────────────────────────────────────┘
```

## ✅ Pré-requisitos

- [x] Código commitado no GitHub
- [x] Banco PostgreSQL no Render criado (`banco_clientes`)
- [x] Dados importados via dump SQL
- [ ] Conta no Render conectada ao GitHub

---

## 🔧 Passo 1: Preparar Variáveis de Ambiente

Você precisará das seguintes variáveis no Render:

### 1.1 DATABASE_URL (Internal Database URL)

No painel do Render, acesse seu banco **banco_clientes**:
- Vá em **Info** → copie a **Internal Database URL**
- Formato: `postgresql://etica123:SENHA@dpg-xxxx-a/etica_vendas`
- ⚠️ **Use a URL INTERNAL, não a External** (melhor performance e segurança)

### 1.2 JWT_SECRET

Gere um segredo forte para assinar tokens JWT. Execute no PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado (exemplo: `a7f3c9e2d8b1f4a6c3e5d7b9f1a4c6e8...`)

---

## 🌐 Passo 2: Criar Web Service no Render

1. **Acesse o Render Dashboard**: https://dashboard.render.com
2. Clique em **New +** → **Web Service**
3. **Conecte seu repositório GitHub** (`crud-clientes-api`)
4. Configurações:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `crud-clientes-api` (ou outro nome) |
   | **Region** | Oregon (mesma do banco) |
   | **Branch** | `main` |
   | **Root Directory** | _(deixe vazio)_ |
   | **Runtime** | Node |
   | **Build Command** | _(deixe vazio ou `npm install`)_ |
   | **Start Command** | `npm start` |
   | **Plan** | Free |

5. **Environment Variables** - Clique em **Add Environment Variable** e adicione:

   ```
   DATABASE_URL=postgresql://etica123:SENHA@dpg-d48hefu3jp1c73cjb9qg-a/etica_vendas
   JWT_SECRET=seu_segredo_gerado_aqui
   NODE_ENV=production
   ```

   ⚠️ **Substitua**:
   - `SENHA` pela senha real do banco (aquela do External URL)
   - `JWT_SECRET` pelo valor gerado no passo 1.2
   - A URL do DATABASE_URL pela **Internal URL** do seu banco

6. Clique em **Create Web Service**

---

## ⏳ Passo 3: Aguardar o Deploy

O Render vai:
1. ✅ Clonar o repositório
2. ✅ Instalar dependências (`npm install`)
3. ✅ Executar `npm start` (que roda `node server.js`)
4. ✅ Expor a aplicação em uma URL (exemplo: `https://crud-clientes-api.onrender.com`)

Acompanhe os logs em tempo real no dashboard. O primeiro deploy pode demorar 2-3 minutos.

---

## 🧪 Passo 4: Testar a Aplicação

### 4.1 Health Check

Acesse no navegador:
```
https://SEU-APP.onrender.com/health
```

Deve retornar:
```json
{
  "status": "healthy"
}
```

### 4.2 Testar Login

1. Acesse: `https://SEU-APP.onrender.com`
2. Será redirecionado para `/login.html`
3. Use as credenciais do banco:
   - Email: `admin@teste.com`
   - Senha: `teste123` (a senha que foi usada para gerar o hash bcrypt)

### 4.3 Testar Listagem de Clientes

Após fazer login, você deve:
1. Ver a listagem de clientes (8 clientes importados do dump)
2. Poder adicionar, editar e excluir clientes
3. Acessar detalhes de cada cliente

---

## 🔐 Passo 5: Segurança (Opcional mas Recomendado)

### Regenerar Senhas Fracas

No dump importado, alguns usuários têm senhas com hash fraco (`hash123`, `hash456`). Recomendo:

1. Fazer login como admin
2. Acessar gestão de usuários
3. Redefinir senhas dos usuários:
   - `admin@etica.com` (senha atual: texto plano "hash123")
   - `paulo@etica.com` (senha atual: texto plano "hash456")
   - `ana@etica.com` (senha atual: texto plano "hash789")

### CORS (se necessário)

Se futuramente quiser hospedar o frontend separadamente:

No Render, adicione estas variáveis:
```
CORS_ENABLED=true
FRONTEND_ORIGIN=https://seu-dominio.com
```

---

## 📝 Variáveis de Ambiente - Referência Completa

| Variável | Obrigatória | Descrição | Exemplo |
|----------|------------|-----------|---------|
| `DATABASE_URL` | ✅ Sim | URL de conexão Postgres (Internal URL) | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | ✅ Sim | Segredo para assinar tokens JWT | `a7f3c9e2d8b1f4a6c3e5d7b9...` |
| `PORT` | ⚠️ Auto | Render define automaticamente | `10000` |
| `NODE_ENV` | 📋 Recomendado | Ambiente de execução | `production` |
| `CORS_ENABLED` | ❌ Opcional | Ativar CORS | `true` / `false` |
| `FRONTEND_ORIGIN` | ❌ Opcional | Origem permitida no CORS | `https://example.com` |
| `PGSSL` | ❌ Opcional | Forçar SSL (já incluído na URL) | `true` |

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"
- ✅ Verifique se usou a **Internal Database URL** (não a External)
- ✅ Confirme que o banco está na mesma região do Web Service (Oregon)
- ✅ Verifique se a senha está correta na URL
- ✅ Teste a conexão do DBeaver primeiro

### Erro: "JWT secret not defined"
- ✅ Adicione a variável `JWT_SECRET` no Render
- ✅ Faça um novo deploy após adicionar a variável

### Frontend não carrega / Erro 404
- ✅ Verifique se a pasta `vanilla-version/` está no repositório GitHub
- ✅ Confirme que `server.js` tem: `app.use(express.static(path.join(__dirname, 'vanilla-version')))`
- ✅ Acesse `/login.html` diretamente para testar

### Deploy falha no Render
- ✅ Veja os logs no Render Dashboard → Logs
- ✅ Confirme que `package.json` tem `"start": "node server.js"`
- ✅ Verifique se todas as dependências estão em `dependencies` (não em `devDependencies`)
- ✅ Certifique-se que commitou o `package-lock.json`

### Login não funciona
- ✅ Verifique que os dados foram importados: acesse o banco no DBeaver e execute `SELECT * FROM usuarios;`
- ✅ Confirme que o `JWT_SECRET` está definido no Render
- ✅ Teste com `admin@teste.com` (que tem hash bcrypt válido)

---

## 🔄 Atualizações Futuras

Para atualizar a aplicação:
1. Faça alterações no código local
2. Commit e push para GitHub:
   ```bash
   git add .
   git commit -m "feat: sua descrição"
   git push origin main
   ```
3. O Render faz **auto-deploy** automaticamente! 🎉

Acompanhe o progresso no Dashboard → Logs.

---

## 📊 Como Funciona a Conexão

```
Fluxo de Requisição:
┌─────────────┐      HTTPS       ┌──────────────────┐
│   Browser   │ ──────────────►  │  Render Web      │
│  (Usuário)  │                  │  Service         │
└─────────────┘                  │  (Node.js)       │
                                 │                  │
                                 │  - Express       │
                                 │  - JWT Auth      │
                                 └──────────────────┘
                                          │
                                          │ Internal Network
                                          │ (Mais rápido e seguro)
                                          ▼
                                 ┌──────────────────┐
                                 │  Render Postgres │
                                 │  banco_clientes  │
                                 └──────────────────┘
```

**Vantagens da Internal URL:**
- ✅ Conexão mais rápida (mesma rede interna do Render)
- ✅ Não conta no limite de conexões externas
- ✅ Mais segura (não exposta à internet)
- ✅ Não precisa de SSL explícito

---

## 📞 Links Úteis

- **Render Dashboard**: https://dashboard.render.com
- **Documentação Render**: https://render.com/docs
- **Seu Health Check**: `https://SEU-APP.onrender.com/health`
- **Logs em Tempo Real**: Dashboard → Seu Service → Logs

---

## 🎉 Checklist Final

Antes de considerar o deploy concluído:

- [ ] Health check retorna `{"status": "healthy"}`
- [ ] Login funciona com `admin@teste.com`
- [ ] Listagem de clientes mostra 8 clientes
- [ ] É possível adicionar novo cliente
- [ ] É possível editar cliente existente
- [ ] É possível excluir cliente
- [ ] Detalhes do cliente carregam corretamente
- [ ] Token JWT está sendo gerado e validado
- [ ] Auto-deploy está funcionando (teste fazendo um commit)

---

**Última atualização**: 09/11/2025
