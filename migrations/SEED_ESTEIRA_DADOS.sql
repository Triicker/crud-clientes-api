-- Criar tabela de interações caso não exista (já está no MIGRATION_ESTEIRA.sql, mas incluído aqui para referência)
CREATE TABLE IF NOT EXISTS interacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_responsavel VARCHAR(100)
);

-- Inserir dados de exemplo para testes

-- Inserir clientes de exemplo em diferentes etapas da esteira
INSERT INTO clientes (nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel, tarefas_concluidas)
VALUES 
    ('Escola Nova Era', 'Escola Privada', '12345678000199', 'São Paulo', 'SP', '(11) 98765-4321', 'Cliente potencial identificado via PNCP', 'Prospecção', 'João Silva', '{"Prospecção": ["Pesquisa de dados básicos"]}'),
    ('Colégio Futuro Brilhante', 'Escola Privada', '98765432000188', 'Rio de Janeiro', 'RJ', '(21) 91234-5678', 'Primeira reunião agendada', 'Apresentação', 'Maria Santos', '{"Prospecção": ["Pesquisa de dados básicos", "Identificação de decisores", "Primeiro contato (Email/Tel)"], "Apresentação": ["Agendamento de reunião"]}'),
    ('Instituto Educacional Conquista', 'Escola Privada', '11223344000155', 'Curitiba', 'PR', '(41) 99876-5432', 'Proposta comercial enviada', 'Negociação', 'João Silva', '{"Prospecção": ["Pesquisa de dados básicos", "Identificação de decisores", "Primeiro contato (Email/Tel)"], "Apresentação": ["Agendamento de reunião", "Envio de material institucional", "Realização da apresentação"], "Negociação": ["Envio de proposta comercial"]}'),
    ('Escola Excelência Educacional', 'Escola Privada', '55667788000144', 'Belo Horizonte', 'MG', '(31) 98888-7777', 'Contrato em fase de assinatura', 'Fechamento', 'Maria Santos', '{"Prospecção": ["Pesquisa de dados básicos", "Identificação de decisores", "Primeiro contato (Email/Tel)"], "Apresentação": ["Agendamento de reunião", "Envio de material institucional", "Realização da apresentação"], "Negociação": ["Envio de proposta comercial", "Follow-up da proposta", "Ajustes e contrapropostas"], "Fechamento": ["Coleta de documentos"]}'),
    ('Colégio Saber e Crescer', 'Escola Privada', '99887766000133', 'Porto Alegre', 'RS', '(51) 97777-6666', 'Cliente recém-fechado, iniciando onboarding', 'Pós-venda', 'João Silva', '{"Prospecção": ["Pesquisa de dados básicos", "Identificação de decisores", "Primeiro contato (Email/Tel)"], "Apresentação": ["Agendamento de reunião", "Envio de material institucional", "Realização da apresentação"], "Negociação": ["Envio de proposta comercial", "Follow-up da proposta", "Ajustes e contrapropostas"], "Fechamento": ["Coleta de documentos", "Assinatura do contrato", "Pagamento inicial"], "Pós-venda": ["Onboarding do cliente"]}'),
    ('Instituto Educação Transformadora', 'Escola Privada', '44556677000122', 'Brasília', 'DF', '(61) 96666-5555', 'Contrato próximo da renovação', 'Renovação', 'Maria Santos', '{"Prospecção": ["Pesquisa de dados básicos", "Identificação de decisores", "Primeiro contato (Email/Tel)"], "Apresentação": ["Agendamento de reunião", "Envio de material institucional", "Realização da apresentação"], "Negociação": ["Envio de proposta comercial", "Follow-up da proposta", "Ajustes e contrapropostas"], "Fechamento": ["Coleta de documentos", "Assinatura do contrato", "Pagamento inicial"], "Pós-venda": ["Onboarding do cliente", "Treinamento da equipe", "Pesquisa de satisfação"], "Renovação": ["Contato para renovação"]}')
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir algumas interações de exemplo
INSERT INTO interacoes (cliente_id, tipo, descricao, usuario_responsavel)
VALUES 
    ((SELECT id FROM clientes WHERE cnpj = '12345678000199'), 'Nota', 'Primeiro contato realizado via LinkedIn. Decisor identificado: Diretor Pedagógico.', 'João Silva'),
    ((SELECT id FROM clientes WHERE cnpj = '98765432000188'), 'Reunião', 'Reunião de apresentação realizada. Demonstração da plataforma bem recebida.', 'Maria Santos'),
    ((SELECT id FROM clientes WHERE cnpj = '98765432000188'), 'Email', 'Material institucional enviado para o corpo diretivo.', 'Maria Santos'),
    ((SELECT id FROM clientes WHERE cnpj = '11223344000155'), 'Ligação', 'Follow-up da proposta comercial. Cliente solicitou ajustes no prazo de pagamento.', 'João Silva'),
    ((SELECT id FROM clientes WHERE cnpj = '55667788000144'), 'Email', 'Documentação solicitada recebida. Encaminhado para análise jurídica.', 'Maria Santos'),
    ((SELECT id FROM clientes WHERE cnpj = '99887766000133'), 'Reunião', 'Sessão de onboarding realizada com a equipe pedagógica. Treinamento inicial concluído.', 'João Silva'),
    ((SELECT id FROM clientes WHERE cnpj = '44556677000122'), 'Ligação', 'Contato para renovação de contrato. Cliente demonstrou interesse em upgrade do plano.', 'Maria Santos');
