// Arquivo: scripts/seedDatabase.js

/**
 * Script para popular o banco de dados com dados de exemplo da Esteira de Trabalho
 */
require('dotenv').config();
const pool = require('../config/db');

const seedData = async () => {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // 1. Criar tabela de interações (se não existir)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interacoes (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        descricao TEXT,
        data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_responsavel VARCHAR(100)
      );
    `);
    console.log('✅ Tabela interacoes verificada/criada');

    // 2. Inserir clientes de exemplo
    const clientesData = [
      {
        nome: 'Escola Nova Era',
        tipo: 'Escola Privada',
        cnpj: '12345678000199',
        cidade: 'São Paulo',
        uf: 'SP',
        telefone: '(11) 98765-4321',
        observacoes: 'Cliente potencial identificado via PNCP',
        status: 'Prospecção',
        vendedor: 'João Silva',
        tarefas: { Prospecção: ['Pesquisa de dados básicos'] }
      },
      {
        nome: 'Colégio Futuro Brilhante',
        tipo: 'Escola Privada',
        cnpj: '98765432000188',
        cidade: 'Rio de Janeiro',
        uf: 'RJ',
        telefone: '(21) 91234-5678',
        observacoes: 'Primeira reunião agendada',
        status: 'Apresentação',
        vendedor: 'Maria Santos',
        tarefas: {
          Prospecção: ['Pesquisa de dados básicos', 'Identificação de decisores', 'Primeiro contato (Email/Tel)'],
          Apresentação: ['Agendamento de reunião']
        }
      },
      {
        nome: 'Instituto Educacional Conquista',
        tipo: 'Escola Privada',
        cnpj: '11223344000155',
        cidade: 'Curitiba',
        uf: 'PR',
        telefone: '(41) 99876-5432',
        observacoes: 'Proposta comercial enviada',
        status: 'Negociação',
        vendedor: 'João Silva',
        tarefas: {
          Prospecção: ['Pesquisa de dados básicos', 'Identificação de decisores', 'Primeiro contato (Email/Tel)'],
          Apresentação: ['Agendamento de reunião', 'Envio de material institucional', 'Realização da apresentação'],
          Negociação: ['Envio de proposta comercial']
        }
      },
      {
        nome: 'Escola Excelência Educacional',
        tipo: 'Escola Privada',
        cnpj: '55667788000144',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        telefone: '(31) 98888-7777',
        observacoes: 'Contrato em fase de assinatura',
        status: 'Fechamento',
        vendedor: 'Maria Santos',
        tarefas: {
          Prospecção: ['Pesquisa de dados básicos', 'Identificação de decisores', 'Primeiro contato (Email/Tel)'],
          Apresentação: ['Agendamento de reunião', 'Envio de material institucional', 'Realização da apresentação'],
          Negociação: ['Envio de proposta comercial', 'Follow-up da proposta', 'Ajustes e contrapropostas'],
          Fechamento: ['Coleta de documentos']
        }
      },
      {
        nome: 'Colégio Saber e Crescer',
        tipo: 'Escola Privada',
        cnpj: '99887766000133',
        cidade: 'Porto Alegre',
        uf: 'RS',
        telefone: '(51) 97777-6666',
        observacoes: 'Cliente recém-fechado, iniciando onboarding',
        status: 'Pós-venda',
        vendedor: 'João Silva',
        tarefas: {
          Prospecção: ['Pesquisa de dados básicos', 'Identificação de decisores', 'Primeiro contato (Email/Tel)'],
          Apresentação: ['Agendamento de reunião', 'Envio de material institucional', 'Realização da apresentação'],
          Negociação: ['Envio de proposta comercial', 'Follow-up da proposta', 'Ajustes e contrapropostas'],
          Fechamento: ['Coleta de documentos', 'Assinatura do contrato', 'Pagamento inicial'],
          'Pós-venda': ['Onboarding do cliente']
        }
      },
      {
        nome: 'Instituto Educação Transformadora',
        tipo: 'Escola Privada',
        cnpj: '44556677000122',
        cidade: 'Brasília',
        uf: 'DF',
        telefone: '(61) 96666-5555',
        observacoes: 'Contrato próximo da renovação',
        status: 'Renovação',
        vendedor: 'Maria Santos',
        tarefas: {
          Prospecção: ['Pesquisa de dados básicos', 'Identificação de decisores', 'Primeiro contato (Email/Tel)'],
          Apresentação: ['Agendamento de reunião', 'Envio de material institucional', 'Realização da apresentação'],
          Negociação: ['Envio de proposta comercial', 'Follow-up da proposta', 'Ajustes e contrapropostas'],
          Fechamento: ['Coleta de documentos', 'Assinatura do contrato', 'Pagamento inicial'],
          'Pós-venda': ['Onboarding do cliente', 'Treinamento da equipe', 'Pesquisa de satisfação'],
          Renovação: ['Contato para renovação']
        }
      }
    ];

    for (const cliente of clientesData) {
      try {
        await pool.query(
          `INSERT INTO clientes (nome, tipo, cnpj, cidade, uf, telefone, observacoes, status, vendedor_responsavel, tarefas_concluidas)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (cnpj) DO NOTHING`,
          [
            cliente.nome,
            cliente.tipo,
            cliente.cnpj,
            cliente.cidade,
            cliente.uf,
            cliente.telefone,
            cliente.observacoes,
            cliente.status,
            cliente.vendedor,
            JSON.stringify(cliente.tarefas)
          ]
        );
        console.log(`✅ Cliente inserido: ${cliente.nome}`);
      } catch (err) {
        console.log(`⚠️  Cliente ${cliente.nome} já existe ou erro: ${err.message}`);
      }
    }

    // 3. Inserir interações de exemplo
    const interacoesData = [
      { cnpj: '12345678000199', tipo: 'Nota', descricao: 'Primeiro contato realizado via LinkedIn. Decisor identificado: Diretor Pedagógico.', usuario: 'João Silva' },
      { cnpj: '98765432000188', tipo: 'Reunião', descricao: 'Reunião de apresentação realizada. Demonstração da plataforma bem recebida.', usuario: 'Maria Santos' },
      { cnpj: '98765432000188', tipo: 'Email', descricao: 'Material institucional enviado para o corpo diretivo.', usuario: 'Maria Santos' },
      { cnpj: '11223344000155', tipo: 'Ligação', descricao: 'Follow-up da proposta comercial. Cliente solicitou ajustes no prazo de pagamento.', usuario: 'João Silva' },
      { cnpj: '55667788000144', tipo: 'Email', descricao: 'Documentação solicitada recebida. Encaminhado para análise jurídica.', usuario: 'Maria Santos' },
      { cnpj: '99887766000133', tipo: 'Reunião', descricao: 'Sessão de onboarding realizada com a equipe pedagógica. Treinamento inicial concluído.', usuario: 'João Silva' },
      { cnpj: '44556677000122', tipo: 'Ligação', descricao: 'Contato para renovação de contrato. Cliente demonstrou interesse em upgrade do plano.', usuario: 'Maria Santos' }
    ];

    for (const interacao of interacoesData) {
      try {
        const clienteResult = await pool.query('SELECT id FROM clientes WHERE cnpj = $1', [interacao.cnpj]);
        if (clienteResult.rows.length > 0) {
          await pool.query(
            'INSERT INTO interacoes (cliente_id, tipo, descricao, usuario_responsavel) VALUES ($1, $2, $3, $4)',
            [clienteResult.rows[0].id, interacao.tipo, interacao.descricao, interacao.usuario]
          );
          console.log(`✅ Interação inserida para cliente ${interacao.cnpj}`);
        }
      } catch (err) {
        console.log(`⚠️  Erro ao inserir interação: ${err.message}`);
      }
    }

    console.log('🎉 Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
};

seedData();
