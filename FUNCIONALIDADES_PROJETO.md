# Funcionalidades do Projeto - Plataforma de Gestão de Clientes e Inteligência Comercial

## Visão Geral
Esta plataforma foi desenvolvida para facilitar a prospecção, cadastro e gestão de clientes do setor educacional público e privado. Ela utiliza inteligência artificial (Google Gemini) para enriquecer dados, sugerir abordagens comerciais e automatizar tarefas que antes exigiam pesquisa manual. O sistema é pensado para ser simples, intuitivo e útil tanto para equipes comerciais quanto para gestores.

---

## Principais Funcionalidades

### 1. Cadastro de Clientes
- **Manual:**
  - O usuário pode cadastrar clientes diretamente pelo sistema, preenchendo dados como nome, CNPJ, contatos, localização, etc.
  - Permite editar, excluir e visualizar detalhes dos clientes cadastrados.
- **Automático (Busca Inteligente):**
  - O sistema permite buscar órgãos públicos e entidades educacionais usando IA (Google Gemini).
  - Basta informar o estado e o tipo de órgão desejado (ex: "Secretaria Municipal de Educação da Bahia").
  - A IA retorna uma lista de clientes potenciais já enriquecidos com dados relevantes: potencial de compra, contatos chave, iniciativas recentes, etc.

### 2. Inteligência Comercial
- **Painel de Órgãos:**
  - Exibe resultados de busca com informações estratégicas para vendas:
    - Potencial de compra (Alto, Médio, Baixo)
    - Contatos chave (nome, cargo)
    - Iniciativas recentes (projetos, notícias)
    - Fonte da informação
- **Sugestão de Abordagem Comercial (IA):**
  - Para cada cliente/órgão, há um botão "Sugerir Abordagem".
  - Ao clicar, a IA analisa as iniciativas recentes e gera 2-3 frases personalizadas para usar em e-mails ou ligações.
  - Exemplo: "Vi que vocês lançaram o programa 'Escola Digital'. Nossa plataforma pode ajudar a aumentar o engajamento dos alunos. Podemos conversar?"

### 3. Gestão de Contatos e Leads
- **Busca de Leads:**
  - Permite buscar contatos de escolas, prefeituras, secretarias, etc., filtrando por cidade, estado e tipo de entidade.
  - Resultados incluem nome, cargo, e-mail, telefone e observações relevantes.
- **Exportação de Dados:**
  - Todos os resultados podem ser exportados para planilha (CSV) para facilitar o trabalho da equipe comercial.

### 4. Cadastro e Gerenciamento Manual
- **Cadastro Manual de Clientes:**
  - O usuário pode adicionar clientes que não estão na base da IA, garantindo flexibilidade.
  - Permite atualização dos dados e exclusão de registros.

### 5. Integração com Banco de Dados
- **Banco PostgreSQL:**
  - Todos os dados cadastrados e buscados ficam salvos de forma segura.
  - Permite consultas rápidas e integração futura com outros sistemas.

---

## Fluxo de Uso (Explicação Simples)
1. **Login:** Usuário acessa o sistema e faz login.
2. **Busca Inteligente:** Escolhe o estado e tipo de órgão, clica em buscar. O sistema retorna uma lista de clientes potenciais já enriquecidos.
3. **Sugestão de Abordagem:** Para cada cliente, pode clicar em "Sugerir Abordagem" e receber frases prontas para contato comercial.
4. **Cadastro Manual:** Se quiser, pode cadastrar clientes manualmente, editar ou excluir.
5. **Exportação:** Pode exportar listas para Excel/planilha.
6. **Gestão:** Visualiza, filtra e gerencia todos os clientes e leads em um painel único.

---

## O que falta implementar
- **Cadastro manual de clientes via interface amigável:** (em andamento)
- **Painel de edição/visualização detalhada dos clientes cadastrados manualmente:**
- **Notificações e lembretes para follow-up comercial:**
- **Dashboard de resultados e métricas de vendas:**
- **Integração com e-mail para envio direto pelo sistema:**
- **Permissões de usuário (gestor, vendedor, etc.):**
- **Melhorias visuais e de usabilidade:**

---

## Resumo para Gestores e Clientes
- **Para o gestor:** O sistema permite acompanhar toda a prospecção, entender o potencial de cada cliente e visualizar o histórico de contatos e iniciativas. Facilita a tomada de decisão e o acompanhamento da equipe.
- **Para o vendedor:** Automatiza a parte mais difícil da prospecção, entrega listas qualificadas e frases prontas para abordagem, economizando tempo e aumentando as chances de sucesso.

---

## Dúvidas Frequentes
- **Preciso saber de tecnologia para usar?** Não! O sistema é feito para ser intuitivo e fácil de usar.
- **Posso cadastrar clientes que não aparecem na busca?** Sim, o cadastro manual está disponível.
- **Os dados ficam salvos?** Sim, tudo é armazenado com segurança no banco de dados.
- **Posso exportar para Excel?** Sim, todos os resultados podem ser exportados.

---

## Contato para Demonstração
Se quiser ver o sistema funcionando ou tirar dúvidas, entre em contato com o responsável pelo projeto.
