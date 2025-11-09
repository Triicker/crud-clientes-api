# Sistema de Gestão de Clientes (CRM) - API

Este é o backend de uma aplicação de CRM (Customer Relationship Management) construída com Node.js, Express e PostgreSQL. A API fornece endpoints para operações CRUD (Criar, Ler, Atualizar, Deletar) em diversas entidades como Clientes, Usuários, Propostas, e mais.

O projeto também inclui uma interface de frontend (vanilla-version) para interagir com a API, com um sistema de autenticação baseado em JSON Web Tokens (JWT).

## Funcionalidades

- **API RESTful**: Endpoints bem definidos para gerenciar recursos.
- **Autenticação e Autorização**: Sistema de login com JWT para proteger as rotas.
- **Banco de Dados PostgreSQL**: Persistência de dados robusta e relacional.
- **Estrutura Organizada**: O código é dividido em `routes`, `controllers`, `config` e `middleware` para facilitar a manutenção.
- **Variáveis de Ambiente**: Uso do `dotenv` para gerenciar configurações sensíveis.
- **Frontend Simples**: Uma interface em HTML, CSS e JavaScript puro para testar e usar a API.

## Estrutura do Projeto

```
crud-clientes-api/
├── config/
│   └── db.js               # Configuração da conexão com o PostgreSQL
├── controller/
│   ├── authController.js   # Lógica de autenticação (login)
│   └── ...                 # Outros controllers para cada entidade
├── middleware/
│   └── authMiddleware.js   # Middleware para proteger rotas com JWT
├── node_modules/
├── routes/
│   ├── auth.js             # Rota pública de login
│   └── ...                 # Outras rotas para cada entidade
├── vanilla-version/
│   ├── api-client.js       # Funções para comunicar com a API
│   ├── auth-manager.js     # Lógica de autenticação no frontend
│   ├── index.html          # Dashboard principal (tela de clientes)
│   ├── login.html          # Tela de login
│   └── ...                 # Outros arquivos do frontend
├── .env                    # Arquivo para variáveis de ambiente (NÃO versionar)
├── .gitignore
├── package.json
├── README.md
└── server.js               # Arquivo principal da aplicação Express
```

## Pré-requisitos

- Node.js (versão 14 ou superior)
- PostgreSQL (um servidor de banco de dados rodando localmente ou em um container Docker)

## Instalação e Configuração

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-seu-repositorio>
    cd crud-clientes-api
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados:**
    - Crie um banco de dados no PostgreSQL. Por exemplo, `etica_vendas`.
    - Execute os scripts SQL (que você deve ter) para criar as tabelas e popular os dados iniciais.

4.  **Configure as Variáveis de Ambiente:**
    - Crie um arquivo chamado `.env` na raiz do projeto.
    - Copie o conteúdo abaixo e substitua pelos seus dados.

    ```env
    # Arquivo: .env

    # Configurações do Banco de Dados
    DB_USER=postgres
    DB_HOST=localhost
    DB_DATABASE=etica_vendas
    DB_PASSWORD=sua_senha_do_banco
    DB_PORT=5432

    # Chave secreta para assinar os tokens JWT
    # Use um gerador de string aleatória para um valor seguro
    JWT_SECRET=sua_chave_secreta_super_segura
    ```

    **Importante**: O arquivo `config/db.js` atualmente contém credenciais fixas. É uma boa prática refatorá-lo para usar as variáveis de ambiente definidas no `.env`, assim como o `authController.js` já faz com `JWT_SECRET`.

## Como Executar a Aplicação

1.  **Inicie o servidor:**
    ```bash
    node server.js
    ```

2.  **Acesse a aplicação:**
    - Abra seu navegador e acesse `http://localhost:3000`.
    - Você será redirecionado para a tela de login.

    A saída no terminal deverá ser semelhante a:
    ```
    [dotenv@17.2.3] injecting env (1) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
    ✅ Conexão com o PostgreSQL estabelecida com sucesso em: ...
    🚀 Servidor a correr na porta 3000. Acessa http://localhost:3000
    ```

## Endpoints da API

A API está organizada por recursos. Todas as rotas, exceto `/api/auth/login`, são protegidas e exigem um token JWT no cabeçalho `Authorization`.

- `POST /api/auth/login`: Realiza o login e retorna um token.
- `GET /api/clientes`: Retorna a lista de clientes.
- `GET /api/clientes/:id`: Retorna um cliente específico.
- `POST /api/clientes`: Cria um novo cliente.
- `PUT /api/clientes/:id`: Atualiza um cliente.
- `DELETE /api/clientes/:id`: Deleta um cliente.
- ... e assim por diante para as outras entidades (`equipe`, `docentes`, `propostas`, etc.).

## Como Contribuir

1.  Faça um fork do projeto.
2.  Crie uma nova branch (`git checkout -b feature/nova-funcionalidade`).
3.  Faça suas alterações e commit (`git commit -m 'Adiciona nova funcionalidade'`).
4.  Envie para a branch original (`git push origin feature/nova-funcionalidade`).
5.  Abra um Pull Request.