/**
 * Script para criar usuários vendedores de demonstração
 * Perfil: equipe_interna (id = 4)
 * 
 * Uso: node seed-vendedores.js
 */

require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

// Dados dos vendedores para demonstração
const vendedores = [
    {
        nome: 'Carlos Silva',
        email: 'carlos.silva@empresa.com',
        telefone: '(11) 98765-4321',
        perfil_id: 4, // equipe_interna
        meta_vendas_mensal: 15,
        ativo: true,
        data_admissao: '2023-03-15'
    },
    {
        nome: 'Ana Paula Santos',
        email: 'ana.santos@empresa.com',
        telefone: '(11) 97654-3210',
        perfil_id: 4,
        meta_vendas_mensal: 12,
        ativo: true,
        data_admissao: '2023-06-01'
    },
    {
        nome: 'Roberto Oliveira',
        email: 'roberto.oliveira@empresa.com',
        telefone: '(21) 99876-5432',
        perfil_id: 4,
        meta_vendas_mensal: 18,
        ativo: true,
        data_admissao: '2022-11-20'
    },
    {
        nome: 'Fernanda Lima',
        email: 'fernanda.lima@empresa.com',
        telefone: '(31) 98765-1234',
        perfil_id: 4,
        meta_vendas_mensal: 10,
        ativo: true,
        data_admissao: '2024-01-10'
    },
    {
        nome: 'Marcos Pereira',
        email: 'marcos.pereira@empresa.com',
        telefone: '(41) 97654-9876',
        perfil_id: 4,
        meta_vendas_mensal: 20,
        ativo: false, // Um inativo para mostrar filtro
        data_admissao: '2023-09-05'
    }
];

// Status do pipeline para distribuir clientes
const statusPipeline = ['Prospecção', 'Qualificação', 'Proposta', 'Fechamento', 'Efetivação'];

// Clientes fictícios para atribuir aos vendedores
const clientesFicticios = [
    // Clientes para Carlos Silva
    { nome: 'Tech Solutions Ltda', cnpj: '12345678000101', vendedor: 'Carlos Silva', status: 'Proposta' },
    { nome: 'Inovação Digital ME', cnpj: '12345678000102', vendedor: 'Carlos Silva', status: 'Qualificação' },
    { nome: 'Startup Brasil SA', cnpj: '12345678000103', vendedor: 'Carlos Silva', status: 'Fechamento' },
    { nome: 'Cloud Services Ltda', cnpj: '12345678000104', vendedor: 'Carlos Silva', status: 'Prospecção' },
    { nome: 'Sistemas Integrados', cnpj: '12345678000105', vendedor: 'Carlos Silva', status: 'Efetivação' },
    
    // Clientes para Ana Paula Santos
    { nome: 'Educação Moderna SA', cnpj: '23456789000101', vendedor: 'Ana Paula Santos', status: 'Qualificação' },
    { nome: 'Instituto Saber', cnpj: '23456789000102', vendedor: 'Ana Paula Santos', status: 'Proposta' },
    { nome: 'Escola Futuro ME', cnpj: '23456789000103', vendedor: 'Ana Paula Santos', status: 'Fechamento' },
    { nome: 'Colégio Horizonte', cnpj: '23456789000104', vendedor: 'Ana Paula Santos', status: 'Efetivação' },
    
    // Clientes para Roberto Oliveira
    { nome: 'Construtora ABC', cnpj: '34567890000101', vendedor: 'Roberto Oliveira', status: 'Prospecção' },
    { nome: 'Engenharia Total', cnpj: '34567890000102', vendedor: 'Roberto Oliveira', status: 'Prospecção' },
    { nome: 'Obras Master', cnpj: '34567890000103', vendedor: 'Roberto Oliveira', status: 'Qualificação' },
    { nome: 'Arquitetura Plus', cnpj: '34567890000104', vendedor: 'Roberto Oliveira', status: 'Proposta' },
    { nome: 'Imobiliária Central', cnpj: '34567890000105', vendedor: 'Roberto Oliveira', status: 'Proposta' },
    { nome: 'Empreiteira União', cnpj: '34567890000106', vendedor: 'Roberto Oliveira', status: 'Fechamento' },
    { nome: 'Construtora Progresso', cnpj: '34567890000107', vendedor: 'Roberto Oliveira', status: 'Efetivação' },
    
    // Clientes para Fernanda Lima
    { nome: 'Moda Fashion Ltda', cnpj: '45678901000101', vendedor: 'Fernanda Lima', status: 'Qualificação' },
    { nome: 'Beleza & Estilo', cnpj: '45678901000102', vendedor: 'Fernanda Lima', status: 'Prospecção' },
    { nome: 'Loja Virtual ME', cnpj: '45678901000103', vendedor: 'Fernanda Lima', status: 'Proposta' },
    
    // Clientes para Marcos Pereira (inativo - menos clientes)
    { nome: 'Empresa Antiga SA', cnpj: '56789012000101', vendedor: 'Marcos Pereira', status: 'Qualificação' },
    { nome: 'Comércio Local', cnpj: '56789012000102', vendedor: 'Marcos Pereira', status: 'Prospecção' }
];

async function seedVendedores() {
    console.log('🚀 Iniciando seed de vendedores...\n');
    
    try {
        // Hash padrão para senha "123456"
        const senhaHash = await bcrypt.hash('123456', 10);
        
        console.log('📦 Inserindo usuários vendedores...');
        
        for (const vendedor of vendedores) {
            // Verificar se já existe
            const existeResult = await pool.query(
                'SELECT id FROM usuarios WHERE email = $1',
                [vendedor.email]
            );
            
            if (existeResult.rows.length > 0) {
                console.log(`   ⏭️  ${vendedor.nome} já existe, pulando...`);
                continue;
            }
            
            // Inserir novo vendedor
            await pool.query(`
                INSERT INTO usuarios (
                    nome, email, telefone, senha_hash, 
                    perfil_id, meta_vendas_mensal, ativo, data_admissao
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                vendedor.nome,
                vendedor.email,
                vendedor.telefone,
                senhaHash,
                vendedor.perfil_id,
                vendedor.meta_vendas_mensal,
                vendedor.ativo,
                vendedor.data_admissao
            ]);
            
            console.log(`   ✅ ${vendedor.nome} criado com sucesso`);
        }
        
        console.log('\n📊 Inserindo clientes de demonstração...');
        
        for (const cliente of clientesFicticios) {
            // Verificar se já existe
            const existeResult = await pool.query(
                'SELECT id FROM clientes WHERE cnpj = $1',
                [cliente.cnpj]
            );
            
            if (existeResult.rows.length > 0) {
                // Atualizar vendedor_responsavel se já existe
                await pool.query(
                    'UPDATE clientes SET vendedor_responsavel = $1, status = $2 WHERE cnpj = $3',
                    [cliente.vendedor, cliente.status, cliente.cnpj]
                );
                console.log(`   🔄 ${cliente.nome} atualizado`);
                continue;
            }
            
            // Inserir novo cliente
            await pool.query(`
                INSERT INTO clientes (
                    nome, tipo, cnpj, vendedor_responsavel, status,
                    cidade, uf
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                cliente.nome,
                'PJ',
                cliente.cnpj,
                cliente.vendedor,
                cliente.status,
                'São Paulo',
                'SP'
            ]);
            
            console.log(`   ✅ ${cliente.nome} criado`);
        }
        
        // Mostrar resumo
        console.log('\n📈 Resumo Final:');
        
        const vendedoresResult = await pool.query(`
            SELECT u.nome, u.ativo, u.meta_vendas_mensal,
                   COUNT(c.id) as total_clientes
            FROM usuarios u
            LEFT JOIN clientes c ON c.vendedor_responsavel = u.nome
            WHERE u.perfil_id = 4
            GROUP BY u.id, u.nome, u.ativo, u.meta_vendas_mensal
            ORDER BY total_clientes DESC
        `);
        
        console.log('\n   Vendedor                  | Ativo | Meta | Clientes');
        console.log('   ' + '-'.repeat(60));
        
        for (const v of vendedoresResult.rows) {
            const ativoStr = v.ativo ? '✅' : '❌';
            const nome = v.nome.padEnd(25);
            const meta = (v.meta_vendas_mensal || 0).toString().padStart(4);
            const clientes = v.total_clientes.toString().padStart(4);
            console.log(`   ${nome} | ${ativoStr}    | ${meta} | ${clientes}`);
        }
        
        console.log('\n✅ Seed concluído com sucesso!');
        console.log('\n💡 Credenciais de login para todos os vendedores:');
        console.log('   Email: [nome.sobrenome]@empresa.com');
        console.log('   Senha: 123456');
        
    } catch (error) {
        console.error('❌ Erro ao executar seed:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

seedVendedores();
