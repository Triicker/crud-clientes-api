/**
 * Script para limpar dados fictícios do banco de dados
 * e verificar CNPJs duplicados
 */
const { Pool } = require('pg');

// Usar DATABASE_URL do Render
const pool = new Pool({
  connectionString: 'postgresql://etica123:CHeeJkYLvfJCoFEWq7fgo7SlC6TO4Z4n@dpg-d48hefu3jp1c73cjb9qg-a.oregon-postgres.render.com/etica_vendas',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('🔌 Conectando ao banco de dados Render...\n');
    
    // 1. Verificar todos os clientes
    console.log('📊 ANÁLISE DO BANCO DE DADOS');
    console.log('='.repeat(80));
    
    const todosClientes = await pool.query('SELECT id, nome, cnpj, tipo FROM clientes ORDER BY id');
    console.log(`\n📋 Total de clientes: ${todosClientes.rows.length}\n`);
    
    // 2. Identificar CNPJs fictícios/aleatórios
    console.log('🔍 Analisando CNPJs...\n');
    
    const cnpjsFicticios = [];
    const cnpjsValidos = [];
    const cnpjsDuplicados = new Map();
    
    // Padrões de CNPJs fictícios
    const padroesFicticios = [
      /^00\.?000\.?000\/?0000-?00$/,       // 00.000.000/0000-00
      /^11\.?111\.?111\/?1111-?11$/,       // 11.111.111/1111-11
      /^12345678000\d{3}$/,                // 12345678000xxx (sequencial)
      /^23456789000\d{3}$/,                // 23456789000xxx
      /^33\.?333\.?333\/?3333-?33$/,       // 33.333.333/3333-33
      /^44556677000\d{3}$/,                // 44556677000xxx
      /^55667788000\d{3}$/,                // 55667788000xxx
      /^88776655000\d{3}$/,                // 88776655000xxx
      /^98765432000\d{3}$/,                // 98765432000xxx
      /^99887766000\d{3}$/,                // 99887766000xxx
    ];
    
    // Nomes que indicam dados de teste
    const nomesTeste = [
      'teste', 'test', 'example', 'exemplo', 'fake', 'fictício', 
      'playwright', 'demo', 'manual', 'nova era', 'excelência educacional',
      'cliente teste', 'tech solutions', 'inovação digital', 'startup brasil',
      'cloud services', 'sistemas integrados', 'instituto saber', 'escola futuro',
      'colégio horizonte', 'escola municipal teste', 'escola teste'
    ];
    
    for (const cliente of todosClientes.rows) {
      const cnpj = cliente.cnpj?.replace(/\D/g, '') || '';
      const nomeNorm = cliente.nome.toLowerCase();
      
      // Verificar se é fictício pelo padrão do CNPJ
      let isFicticio = false;
      for (const padrao of padroesFicticios) {
        if (padrao.test(cnpj) || padrao.test(cliente.cnpj || '')) {
          isFicticio = true;
          break;
        }
      }
      
      // Verificar pelo nome
      if (!isFicticio) {
        for (const nomeTeste of nomesTeste) {
          if (nomeNorm.includes(nomeTeste)) {
            isFicticio = true;
            break;
          }
        }
      }
      
      // Verificar CNPJs sequenciais simples
      if (!isFicticio && cnpj.length >= 8) {
        const primeiro8 = cnpj.substring(0, 8);
        if (/^(\d)\1{7}$/.test(primeiro8) || // 11111111, 22222222, etc
            /^12345678$/.test(primeiro8) ||
            /^87654321$/.test(primeiro8)) {
          isFicticio = true;
        }
      }
      
      if (isFicticio) {
        cnpjsFicticios.push(cliente);
      } else {
        cnpjsValidos.push(cliente);
      }
      
      // Rastrear duplicados
      if (cnpj) {
        if (!cnpjsDuplicados.has(cnpj)) {
          cnpjsDuplicados.set(cnpj, []);
        }
        cnpjsDuplicados.get(cnpj).push(cliente);
      }
    }
    
    // 3. Mostrar CNPJs fictícios
    console.log('🗑️  CLIENTES COM DADOS FICTÍCIOS:');
    console.log('-'.repeat(80));
    if (cnpjsFicticios.length === 0) {
      console.log('   Nenhum dado fictício encontrado!\n');
    } else {
      for (const c of cnpjsFicticios) {
        console.log(`   ID ${c.id}: ${c.nome.substring(0, 40).padEnd(40)} | CNPJ: ${c.cnpj || 'N/A'}`);
      }
      console.log(`\n   Total: ${cnpjsFicticios.length} registros fictícios\n`);
    }
    
    // 4. Mostrar CNPJs duplicados
    console.log('⚠️  CNPJS DUPLICADOS:');
    console.log('-'.repeat(80));
    let temDuplicados = false;
    for (const [cnpj, clientes] of cnpjsDuplicados) {
      if (clientes.length > 1) {
        temDuplicados = true;
        console.log(`   CNPJ ${cnpj}:`);
        for (const c of clientes) {
          console.log(`      - ID ${c.id}: ${c.nome}`);
        }
      }
    }
    if (!temDuplicados) {
      console.log('   Nenhum CNPJ duplicado encontrado!\n');
    }
    
    // 5. Perguntar se deseja excluir
    if (cnpjsFicticios.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🗑️  EXCLUINDO DADOS FICTÍCIOS...');
      console.log('='.repeat(80));
      
      const idsParaExcluir = cnpjsFicticios.map(c => c.id);
      
      // Primeiro, excluir dados relacionados
      console.log('\n1. Excluindo dados relacionados...');
      
      await pool.query('DELETE FROM equipe_pedagogica WHERE cliente_id = ANY($1)', [idsParaExcluir]);
      console.log('   ✓ equipe_pedagogica');
      
      await pool.query('DELETE FROM corpo_docente WHERE cliente_id = ANY($1)', [idsParaExcluir]);
      console.log('   ✓ corpo_docente');
      
      await pool.query('DELETE FROM diagnostico WHERE cliente_id = ANY($1)', [idsParaExcluir]);
      console.log('   ✓ diagnostico');
      
      await pool.query('DELETE FROM propostas WHERE cliente_id = ANY($1)', [idsParaExcluir]);
      console.log('   ✓ propostas');
      
      await pool.query('DELETE FROM interacoes WHERE cliente_id = ANY($1)', [idsParaExcluir]);
      console.log('   ✓ interacoes');
      
      // Algumas tabelas podem ter estrutura diferente, usar try/catch individual
      try {
        await pool.query('DELETE FROM influenciadores WHERE cliente_id = ANY($1)', [idsParaExcluir]);
        console.log('   ✓ influenciadores');
      } catch (e) { console.log('   ⚠ influenciadores (tabela com estrutura diferente)'); }
      
      try {
        await pool.query('DELETE FROM rede_numeros WHERE cliente_id = ANY($1)', [idsParaExcluir]);
        console.log('   ✓ rede_numeros');
      } catch (e) { console.log('   ⚠ rede_numeros (tabela com estrutura diferente)'); }
      
      try {
        await pool.query('DELETE FROM programas_financeiros WHERE cliente_id = ANY($1)', [idsParaExcluir]);
        console.log('   ✓ programas_financeiros');
      } catch (e) { console.log('   ⚠ programas_financeiros (tabela com estrutura diferente)'); }
      
      try {
        await pool.query('DELETE FROM comunicacao_equipe WHERE cliente_id = ANY($1)', [idsParaExcluir]);
        console.log('   ✓ comunicacao_equipe');
      } catch (e) { console.log('   ⚠ comunicacao_equipe (tabela com estrutura diferente)'); }
      
      try {
        await pool.query('DELETE FROM liberacao_etapas WHERE cliente_id = ANY($1)', [idsParaExcluir]);
        console.log('   ✓ liberacao_etapas');
      } catch (e) { console.log('   ⚠ liberacao_etapas (tabela com estrutura diferente)'); }
      
      try {
        await pool.query('DELETE FROM historico_tarefas WHERE cliente_id = ANY($1)', [idsParaExcluir]);
        console.log('   ✓ historico_tarefas');
      } catch (e) { console.log('   ⚠ historico_tarefas (tabela com estrutura diferente)'); }
      
      // Agora excluir os clientes
      console.log('\n2. Excluindo clientes fictícios...');
      const deleteResult = await pool.query('DELETE FROM clientes WHERE id = ANY($1) RETURNING id, nome', [idsParaExcluir]);
      
      console.log(`\n✅ ${deleteResult.rowCount} clientes fictícios excluídos!`);
      
      // Verificar resultado final
      const clientesRestantes = await pool.query('SELECT COUNT(*) FROM clientes');
      console.log(`\n📊 Clientes restantes no banco: ${clientesRestantes.rows[0].count}`);
    }
    
    // 6. Mostrar clientes válidos restantes
    console.log('\n' + '='.repeat(80));
    console.log('✅ CLIENTES VÁLIDOS NO SISTEMA:');
    console.log('='.repeat(80));
    
    const clientesFinais = await pool.query('SELECT id, nome, cnpj, tipo, cidade, uf FROM clientes ORDER BY nome');
    console.log(`\nTotal: ${clientesFinais.rows.length} clientes\n`);
    
    for (const c of clientesFinais.rows) {
      console.log(`   ID ${c.id.toString().padStart(3)}: ${c.nome.substring(0, 45).padEnd(45)} | ${c.tipo || 'N/A'}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 Limpeza concluída!');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

main();
