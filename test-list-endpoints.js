const https = require('https');

console.log('==================================================');
console.log('TESTANDO ENDPOINTS DE LISTAGEM');
console.log('==================================================');
console.log('');

const tests = [
    {
        name: 'Compras por órgão (sem filtro)',
        url: 'https://pncp.gov.br/api/consulta/v1/orgaos/46612032000149/compras'
    },
    {
        name: 'Compras por órgão (com datas)',
        url: 'https://pncp.gov.br/api/consulta/v1/orgaos/46612032000149/compras?dataInicial=2024-01-01&dataFinal=2024-11-17&pagina=1'
    },
    {
        name: 'Contratos gerais com filtro de CNPJ',
        url: 'https://pncp.gov.br/api/consulta/v1/contratos?cnpjOrgao=46612032000149&dataInicial=2024-01-01&dataFinal=2024-11-17&pagina=1'
    },
    {
        name: 'Contratos gerais com filtro orgao_cnpj',
        url: 'https://pncp.gov.br/api/consulta/v1/contratos?orgao_cnpj=46612032000149&dataInicial=2024-01-01&dataFinal=2024-11-17&pagina=1'
    }
];

let currentTest = 0;

function runTest() {
    if (currentTest >= tests.length) {
        console.log('==================================================');
        console.log('TESTES FINALIZADOS');
        console.log('==================================================');
        return;
    }

    const test = tests[currentTest];
    console.log(`📝 Teste ${currentTest + 1}: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    https.get(test.url, (res) => {
        console.log(`Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(data);
                    console.log('✅ FUNCIONA!');
                    console.log(`Resultados: ${Array.isArray(json) ? json.length : 'objeto único'}`);
                    if (Array.isArray(json) && json.length > 0) {
                        console.log('Primeiro item (preview):', JSON.stringify(json[0], null, 2).substring(0, 300));
                    }
                } catch(e) {
                    console.log('✅ Status 200, mas resposta:', data.substring(0, 200));
                }
            } else {
                console.log('❌ Erro');
                console.log('Resposta:', data.substring(0, 300));
            }
            
            console.log('');
            currentTest++;
            setTimeout(runTest, 1000);
        });
    }).on('error', (e) => {
        console.error('❌ Erro na requisição:', e.message);
        console.log('');
        currentTest++;
        setTimeout(runTest, 1000);
    });
}

runTest();
