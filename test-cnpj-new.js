const https = require('https');

const cnpj = '13927801000653';
const dataFinal = '2025-11-17';
const dataInicial = '2025-08-19';
const url = `https://pncp.gov.br/api/consulta/v1/orgaos/${cnpj}/contratos?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1`;

console.log('==================================================');
console.log('TESTANDO NOVO CNPJ: 13.927.801/0006-53');
console.log('==================================================');
console.log('URL:', url);
console.log('');

https.get(url, (res) => {
    console.log('Status HTTP:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                console.log('✅ SUCESSO! Contratos encontrados:', json.length);
                console.log('');
                
                if (json.length > 0) {
                    console.log('📋 Primeiro contrato (preview):');
                    console.log(JSON.stringify(json[0], null, 2).substring(0, 800));
                    console.log('...');
                }
            } catch(e) {
                console.log('Resposta (não-JSON):', data.substring(0, 500));
            }
        } else if (res.statusCode === 404) {
            console.log('❌ CNPJ não encontrado ou sem contratos no período');
            console.log('Resposta:', data);
        } else {
            console.log('⚠️ Erro:', data);
        }
    });
}).on('error', (e) => {
    console.error('❌ Erro na requisição:', e.message);
});
