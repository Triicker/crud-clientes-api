/**
 * Script de análise da estrutura do banco de dados
 * Analisa tabelas: clientes, corpo_docente, equipe_pedagogica
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://etica123:CHeeJkYLvfJCoFEWq7fgo7SlC6TO4Z4n@dpg-d48hefu3jp1c73cjb9qg-a.oregon-postgres.render.com/etica_vendas',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('📊 ANÁLISE COMPLETA DO BANCO DE DADOS\n');
  console.log('='.repeat(100));

  try {
    // 1. Estrutura da tabela CLIENTES
    console.log('\n🔷 TABELA: clientes');
    console.log('-'.repeat(100));
    const clientesCols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clientes'
      ORDER BY ordinal_position
    `);
    console.log('\nColunas:');
    clientesCols.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | NULL: ${col.is_nullable.padEnd(5)} | Default: ${col.column_default || 'N/A'}`);
    });

    // 2. Estrutura da tabela CORPO_DOCENTE
    console.log('\n\n🔷 TABELA: corpo_docente');
    console.log('-'.repeat(100));
    const corpoCols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'corpo_docente'
      ORDER BY ordinal_position
    `);
    console.log('\nColunas:');
    corpoCols.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | NULL: ${col.is_nullable.padEnd(5)} | Default: ${col.column_default || 'N/A'}`);
    });

    // 3. Estrutura da tabela EQUIPE_PEDAGOGICA
    console.log('\n\n🔷 TABELA: equipe_pedagogica');
    console.log('-'.repeat(100));
    const equipeCols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'equipe_pedagogica'
      ORDER BY ordinal_position
    `);
    console.log('\nColunas:');
    equipeCols.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | NULL: ${col.is_nullable.padEnd(5)} | Default: ${col.column_default || 'N/A'}`);
    });

    // 4. Constraints e Foreign Keys
    console.log('\n\n🔷 FOREIGN KEYS');
    console.log('-'.repeat(100));
    const fks = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('clientes', 'corpo_docente', 'equipe_pedagogica')
    `);
    fks.rows.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // 5. Unique Constraints
    console.log('\n\n🔷 UNIQUE CONSTRAINTS');
    console.log('-'.repeat(100));
    const uniques = await pool.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name IN ('clientes', 'corpo_docente', 'equipe_pedagogica')
    `);
    uniques.rows.forEach(u => {
      console.log(`  ${u.table_name}: UNIQUE(${u.column_name})`);
    });

    // 6. Exemplo de dados
    console.log('\n\n🔷 EXEMPLO DE CLIENTE COM CORPO DOCENTE');
    console.log('-'.repeat(100));
    const clienteComDocente = await pool.query(`
      SELECT c.id, c.nome, c.cnpj
      FROM clientes c
      WHERE EXISTS (SELECT 1 FROM corpo_docente cd WHERE cd.cliente_id = c.id)
      LIMIT 1
    `);
    
    if (clienteComDocente.rows.length > 0) {
      const cliente = clienteComDocente.rows[0];
      console.log(`\nCliente: ${cliente.nome} (ID: ${cliente.id})`);
      
      const docentes = await pool.query(
        'SELECT * FROM corpo_docente WHERE cliente_id = $1',
        [cliente.id]
      );
      console.log(`\nCorpo Docente (${docentes.rows.length} membros):`);
      docentes.rows.forEach(d => {
        console.log(`  - ${d.nome || 'N/A'} | ${d.funcao || 'N/A'} | ${d.email || 'N/A'}`);
      });
    } else {
      console.log('\n  Nenhum cliente com corpo docente cadastrado.');
    }

    // 7. Contagens
    console.log('\n\n🔷 ESTATÍSTICAS');
    console.log('-'.repeat(100));
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM clientes) as total_clientes,
        (SELECT COUNT(*) FROM corpo_docente) as total_docentes,
        (SELECT COUNT(*) FROM equipe_pedagogica) as total_equipe,
        (SELECT COUNT(DISTINCT cliente_id) FROM corpo_docente) as clientes_com_docentes
    `);
    const s = stats.rows[0];
    console.log(`  Total de clientes: ${s.total_clientes}`);
    console.log(`  Total de membros do corpo docente: ${s.total_docentes}`);
    console.log(`  Total de membros da equipe pedagógica: ${s.total_equipe}`);
    console.log(`  Clientes com corpo docente: ${s.clientes_com_docentes}`);

    console.log('\n' + '='.repeat(100));
    console.log('✅ Análise concluída!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

main();
