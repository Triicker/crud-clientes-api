const pool = require('./config/db');

(async () => {
    try {
        console.log('🔍 Verificando cliente com CNPJ 12345678000199...\n');
        
        const result = await pool.query(
            'SELECT * FROM clientes WHERE cnpj = $1',
            ['12345678000199']
        );

        if (result.rows.length > 0) {
            console.log('✅ Cliente encontrado no banco de dados:');
            console.log(JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log('❌ Cliente NÃO encontrado no banco de dados!');
            console.log('   Isso significa que a API retornou 409 mas o cliente não existe.');
            console.log('   Pode haver outro cliente com mesmo CNPJ ou erro na validação.');
            
            // Procurar por CNPJs similares
            console.log('\n🔍 Procurando CNPJs similares...');
            const similar = await pool.query(
                "SELECT cnpj, nome, status FROM clientes WHERE cnpj LIKE '%12345678%'"
            );
            
            if (similar.rows.length > 0) {
                console.log(`\n📋 Encontrados ${similar.rows.length} cliente(s) com CNPJ similar:`);
                similar.rows.forEach((row, index) => {
                    console.log(`   ${index + 1}. ${row.cnpj} - ${row.nome} (${row.status})`);
                });
            }
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await pool.end();
        process.exit(1);
    }
})();
