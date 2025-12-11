/**
 * Script para criar vendedores de teste e validar ciclo completo
 * 
 * Cria 3 vendedores com perfis diferentes para testar:
 * - Criação de interações
 * - Atribuição automática de clientes
 * - Ranking na tela de gestão
 * - Permissões diferenciadas
 */
require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

const saltRounds = 10;

// Vendedores de teste com diferentes perfis
const VENDEDORES_TESTE = [
    {
        nome: 'João Vendedor',
        email: 'joao.vendedor@etica.com',
        senha: 'senha123',
        perfil_id: 2, // Consultor
        meta_vendas_mensal: 10,
        data_admissao: '2025-01-01',
        telefone: '(11) 98765-4321'
    },
    {
        nome: 'Maria Comercial',
        email: 'maria.comercial@etica.com',
        senha: 'senha123',
        perfil_id: 3, // Representante
        meta_vendas_mensal: 15,
        data_admissao: '2025-01-15',
        telefone: '(11) 98765-4322'
    },
    {
        nome: 'Pedro Consultor',
        email: 'pedro.consultor@etica.com',
        senha: 'senha123',
        perfil_id: 2, // Consultor
        meta_vendas_mensal: 12,
        data_admissao: '2025-02-01',
        telefone: '(11) 98765-4323'
    }
];

async function setupVendedores() {
    try {
        console.log('🔄 Iniciando setup de vendedores de teste...\n');
        
        // 1. Verificar se já existem
        const existentes = await pool.query(`
            SELECT email FROM usuarios 
            WHERE email = ANY($1::text[])
        `, [VENDEDORES_TESTE.map(v => v.email)]);
        
        if (existentes.rows.length > 0) {
            console.log('⚠️  Alguns vendedores já existem:');
            existentes.rows.forEach(v => console.log(`   - ${v.email}`));
            console.log('\nDeseja recriar? Execute com flag --force\n');
            
            if (!process.argv.includes('--force')) {
                console.log('❌ Operação cancelada');
                return;
            }
            
            // Remover vendedores existentes
            console.log('\n🗑️  Removendo vendedores existentes...');
            await pool.query(`
                DELETE FROM usuarios 
                WHERE email = ANY($1::text[])
            `, [VENDEDORES_TESTE.map(v => v.email)]);
            console.log('   ✓ Removidos\n');
        }
        
        // 2. Criar vendedores
        console.log('👥 Criando vendedores de teste:\n');
        
        const vendedoresCriados = [];
        
        for (const vendedor of VENDEDORES_TESTE) {
            const senha_hash = await bcrypt.hash(vendedor.senha, saltRounds);
            
            const result = await pool.query(`
                INSERT INTO usuarios (
                    nome, email, senha_hash, perfil_id, ativo,
                    meta_vendas_mensal, data_admissao, telefone
                )
                VALUES ($1, $2, $3, $4, true, $5, $6, $7)
                RETURNING id, nome, email, perfil_id
            `, [
                vendedor.nome,
                vendedor.email,
                senha_hash,
                vendedor.perfil_id,
                vendedor.meta_vendas_mensal,
                vendedor.data_admissao,
                vendedor.telefone
            ]);
            
            const criado = result.rows[0];
            vendedoresCriados.push(criado);
            
            // Buscar nome do perfil
            const perfil = await pool.query(
                'SELECT nome FROM perfis WHERE id = $1',
                [criado.perfil_id]
            );
            
            console.log(`   ✓ ${criado.nome} (${perfil.rows[0].nome})`);
            console.log(`     - Email: ${vendedor.email}`);
            console.log(`     - Senha: ${vendedor.senha}`);
            console.log(`     - Meta: ${vendedor.meta_vendas_mensal} vendas/mês`);
            console.log('');
        }
        
        // 3. Criar clientes de teste para cada vendedor
        console.log('🏫 Criando clientes de teste para distribuir entre vendedores:\n');
        
        const clientesPorVendedor = [
            // João Vendedor - 3 clientes em diferentes estágios
            {
                nome: 'Escola Municipal São João',
                tipo: 'Escola Pública',
                cnpj: '11111111000101',
                cidade: 'São Paulo',
                uf: 'SP',
                telefone: '(11) 3333-1001',
                status: 'Prospecção', // Sem vendedor ainda
                vendedor_responsavel: null
            },
            {
                nome: 'Colégio Santa Maria',
                tipo: 'Escola Particular',
                cnpj: '11111111000102',
                cidade: 'São Paulo',
                uf: 'SP',
                telefone: '(11) 3333-1002',
                status: 'Contato Inicial',
                vendedor_responsavel: 'João Vendedor'
            },
            {
                nome: 'Instituto Educacional Alpha',
                tipo: 'Escola Particular',
                cnpj: '11111111000103',
                cidade: 'Campinas',
                uf: 'SP',
                telefone: '(19) 3333-1003',
                status: 'Proposta',
                vendedor_responsavel: 'João Vendedor'
            },
            // Maria Comercial - 4 clientes (melhor performance)
            {
                nome: 'Escola Estadual Prof. José Silva',
                tipo: 'Escola Pública',
                cnpj: '22222222000101',
                cidade: 'Santos',
                uf: 'SP',
                telefone: '(13) 3333-2001',
                status: 'Contato Inicial',
                vendedor_responsavel: 'Maria Comercial'
            },
            {
                nome: 'Colégio Dom Bosco',
                tipo: 'Escola Particular',
                cnpj: '22222222000102',
                cidade: 'Santos',
                uf: 'SP',
                telefone: '(13) 3333-2002',
                status: 'Proposta',
                vendedor_responsavel: 'Maria Comercial'
            },
            {
                nome: 'Centro Educacional Beta',
                tipo: 'Escola Particular',
                cnpj: '22222222000103',
                cidade: 'Guarujá',
                uf: 'SP',
                telefone: '(13) 3333-2003',
                status: 'Negociação',
                vendedor_responsavel: 'Maria Comercial'
            },
            {
                nome: 'Escola Técnica SENAI',
                tipo: 'Escola Técnica',
                cnpj: '22222222000104',
                cidade: 'Santos',
                uf: 'SP',
                telefone: '(13) 3333-2004',
                status: 'Fechamento',
                vendedor_responsavel: 'Maria Comercial'
            },
            // Pedro Consultor - 2 clientes
            {
                nome: 'Escola Municipal Maria Clara',
                tipo: 'Escola Pública',
                cnpj: '33333333000101',
                cidade: 'Sorocaba',
                uf: 'SP',
                telefone: '(15) 3333-3001',
                status: 'Contato Inicial',
                vendedor_responsavel: 'Pedro Consultor'
            },
            {
                nome: 'Colégio Objetivo',
                tipo: 'Escola Particular',
                cnpj: '33333333000102',
                cidade: 'Sorocaba',
                uf: 'SP',
                telefone: '(15) 3333-3002',
                status: 'Prospecção', // Será movido ao criar interação
                vendedor_responsavel: null
            }
        ];
        
        for (const cliente of clientesPorVendedor) {
            try {
                await pool.query(`
                    INSERT INTO clientes (
                        nome, tipo, cnpj, cidade, uf, telefone, 
                        status, vendedor_responsavel
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    cliente.nome,
                    cliente.tipo,
                    cliente.cnpj,
                    cliente.cidade,
                    cliente.uf,
                    cliente.telefone,
                    cliente.status,
                    cliente.vendedor_responsavel
                ]);
                
                const statusIcon = cliente.vendedor_responsavel ? '✓' : '○';
                console.log(`   ${statusIcon} ${cliente.nome} - ${cliente.status} ${cliente.vendedor_responsavel ? `(${cliente.vendedor_responsavel})` : ''}`);
            } catch (error) {
                if (error.code === '23505') {
                    console.log(`   ⚠️  ${cliente.nome} - Já existe (pulando)`);
                } else {
                    throw error;
                }
            }
        }
        
        // 4. Criar interações de exemplo
        console.log('\n💬 Criando interações de exemplo:\n');
        
        const interacoes = [
            {
                cliente_nome: 'Colégio Santa Maria',
                tipo: 'Ligação',
                descricao: 'Primeira ligação. Diretor demonstrou interesse no programa de matemática.',
                usuario: 'João Vendedor'
            },
            {
                cliente_nome: 'Instituto Educacional Alpha',
                tipo: 'Reunião',
                descricao: 'Reunião presencial. Apresentação da proposta. Solicitaram desconto de 10%.',
                usuario: 'João Vendedor'
            },
            {
                cliente_nome: 'Colégio Dom Bosco',
                tipo: 'Email',
                descricao: 'Enviada proposta formal por email com prazo de 15 dias.',
                usuario: 'Maria Comercial'
            },
            {
                cliente_nome: 'Centro Educacional Beta',
                tipo: 'Ligação',
                descricao: 'Follow-up da proposta. Coordenadora pediu mais informações sobre capacitação.',
                usuario: 'Maria Comercial'
            },
            {
                cliente_nome: 'Escola Técnica SENAI',
                tipo: 'Reunião',
                descricao: 'Reunião de fechamento. Contrato assinado! Início em março.',
                usuario: 'Maria Comercial'
            }
        ];
        
        for (const interacao of interacoes) {
            const cliente = await pool.query(
                'SELECT id FROM clientes WHERE nome = $1',
                [interacao.cliente_nome]
            );
            
            if (cliente.rows.length > 0) {
                await pool.query(`
                    INSERT INTO interacoes (
                        cliente_id, tipo, descricao, usuario_responsavel, data_interacao
                    )
                    VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
                `, [
                    cliente.rows[0].id,
                    interacao.tipo,
                    interacao.descricao,
                    interacao.usuario
                ]);
                
                console.log(`   ✓ ${interacao.tipo} - ${interacao.cliente_nome} (${interacao.usuario})`);
            }
        }
        
        // 5. Mostrar resumo final
        console.log('\n📊 Resumo do Setup:\n');
        
        const resumo = await pool.query(`
            SELECT 
                u.nome as vendedor,
                p.nome as perfil,
                u.meta_vendas_mensal as meta,
                COUNT(DISTINCT c.id) as total_clientes,
                COUNT(DISTINCT CASE WHEN c.status IN ('Fechamento', 'Efetivação') THEN c.id END) as vendas,
                COUNT(DISTINCT i.id) as total_interacoes
            FROM usuarios u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            LEFT JOIN clientes c ON c.vendedor_responsavel = u.nome
            LEFT JOIN interacoes i ON i.usuario_responsavel = u.nome
            WHERE u.email = ANY($1::text[])
            GROUP BY u.nome, p.nome, u.meta_vendas_mensal
            ORDER BY total_clientes DESC
        `, [VENDEDORES_TESTE.map(v => v.email)]);
        
        console.table(resumo.rows);
        
        console.log('\n✅ Setup concluído com sucesso!\n');
        console.log('🔐 Credenciais de acesso:\n');
        VENDEDORES_TESTE.forEach(v => {
            console.log(`   ${v.nome}:`);
            console.log(`   - Email: ${v.email}`);
            console.log(`   - Senha: ${v.senha}`);
            console.log('');
        });
        
        console.log('🧪 Próximos passos para testar:\n');
        console.log('1. Login com cada vendedor no sistema');
        console.log('2. Verificar dashboard de vendas (GET /api/vendedores/estatisticas)');
        console.log('3. Criar nova interação e validar atribuição automática');
        console.log('4. Mudar status de cliente e observar atribuição');
        console.log('5. Verificar ranking na tela de gestão');
        console.log('6. Testar permissões diferenciadas por perfil\n');
        
    } catch (error) {
        console.error('❌ Erro ao executar setup:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar
setupVendedores()
    .then(() => {
        console.log('✅ Script finalizado');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script finalizado com erro:', error);
        process.exit(1);
    });
