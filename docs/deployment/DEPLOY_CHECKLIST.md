# Deploy no Render - Checklist

## ✅ Preparações Concluídas

1. **Backend configurado** para servir frontend React na rota `/gemini-search`
2. **Fallback SPA** adicionado para rotas do React
3. **Build script** adicionado ao `package.json` principal
4. **render.yaml** criado com configuração de build automático
5. **.gitignore** atualizado para excluir `node_modules` e arquivos desnecessários
6. **Frontend buildado** e pronto em `Teste-lista/dist/`

## 🚀 Próximos Passos no Render

### 1. Variáveis de Ambiente no Render
Configure no Dashboard do Render:
- `DATABASE_URL` - URL do banco PostgreSQL (Internal URL do Render)
- `JWT_SECRET` - Chave secreta para tokens JWT
- `SSL=true`
- `RENDER=true`
- `NODE_ENV=production`

### 2. Build Command
```bash
cd Teste-lista && npm install && npm run build && cd ..
```

### 3. Start Command
```bash
node server.js
```

### 4. Rotas Disponíveis Após Deploy
- `/` - Redireciona para `/login.html`
- `/login.html` - Login (vanilla version)
- `/gemini-search` - Aplicação React (busca de CNPJs/Leads com IA)
- `/SearchContratos` - Busca de contratos
- `/api/*` - Todas as rotas da API

## 📋 Checklist de Deploy

- [x] Frontend buildado
- [x] Backend configurado para servir frontend
- [x] render.yaml criado
- [x] .gitignore atualizado
- [ ] Commit e push para repositório
- [ ] Configurar variáveis de ambiente no Render
- [ ] Deploy automático será acionado após push

## 🔗 Conexão com Banco
O backend já está configurado para usar `DATABASE_URL` do ambiente, que o Render fornece automaticamente ao conectar o serviço web ao banco PostgreSQL existente.
