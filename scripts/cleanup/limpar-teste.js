const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://etica123:CHeeJkYLvfJCoFEWq7fgo7SlC6TO4Z4n@dpg-d48hefu3jp1c73cjb9qg-a.oregon-postgres.render.com/etica_vendas',
  ssl: { rejectUnauthorized: false }
});

async function limpar() {
  try {
    await client.connect();
    
    // Remover corpo docente de clientes de teste
    const docentesResult = await client.query(`
      DELETE FROM corpo_docente 
      WHERE cliente_id IN (
        SELECT id FROM clientes WHERE nome LIKE '%Teste%' OR cnpj LIKE '3%'
      )
    `);
    console.log(`Membros corpo docente removidos: ${docentesResult.rowCount}`);
    
    // Remover clientes de teste
    const clientesResult = await client.query(`
      DELETE FROM clientes 
      WHERE nome LIKE '%Teste%' OR nome LIKE '%Test %'
    `);
    console.log(`Clientes de teste removidos: ${clientesResult.rowCount}`);
    
    // Verificar totais
    const total = await client.query('SELECT COUNT(*) FROM clientes');
    console.log(`Total de clientes agora: ${total.rows[0].count}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

limpar();
