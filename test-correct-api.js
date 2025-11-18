const https = require('https');

console.log('==================================================');
console.log('TESTANDO API CORRETA DO PNCP');
console.log('==================================================');
console.log('');

// Teste 1: Dados de contratações (exemplo do manual)
console.log('1️⃣ Testando endpoint de COMPRAS (dados de contratações)');
const cnpj1 = '46612032000149';
const ano1 = '2024';
const sequencial1 = '188';
const url1 = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj1}/compras/${ano1}/${sequencial1}`;
console.log('URL:', url1);

https.get(url1, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ SUCESSO!');
            console.log('Resposta (preview):', data.substring(0, 500));
        } else {
            console.log('❌ Erro:', data);
        }
        console.log('');
        
        // Teste 2: Itens da contratação
        console.log('2️⃣ Testando endpoint de ITENS da compra');
        const url2 = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj1}/compras/${ano1}/${sequencial1}/itens`;
        console.log('URL:', url2);
        
        https.get(url2, (res2) => {
            console.log('Status:', res2.statusCode);
            let data2 = '';
            res2.on('data', (chunk) => data2 += chunk);
            res2.on('end', () => {
                if (res2.statusCode === 200) {
                    console.log('✅ SUCESSO!');
                    try {
                        const itens = JSON.parse(data2);
                        console.log(`Total de itens: ${itens.length}`);
                        if (itens.length > 0) {
                            console.log('Primeiro item:', JSON.stringify(itens[0], null, 2).substring(0, 500));
                        }
                    } catch(e) {
                        console.log('Resposta (preview):', data2.substring(0, 500));
                    }
                } else {
                    console.log('❌ Erro:', data2);
                }
                console.log('');
                
                // Teste 3: CNPJ diferente que você mencionou
                console.log('3️⃣ Testando com CNPJ 31726581000177 (do exemplo)');
                const url3 = 'https://pncp.gov.br/api/pncp/v1/orgaos/31726581000177/compras/2024/1/itens';
                console.log('URL:', url3);
                
                https.get(url3, (res3) => {
                    console.log('Status:', res3.statusCode);
                    let data3 = '';
                    res3.on('data', (chunk) => data3 += chunk);
                    res3.on('end', () => {
                        if (res3.statusCode === 200) {
                            console.log('✅ SUCESSO!');
                            try {
                                const itens = JSON.parse(data3);
                                console.log(`Total de itens: ${itens.length}`);
                            } catch(e) {
                                console.log('Resposta (preview):', data3.substring(0, 500));
                            }
                        } else {
                            console.log('❌ Erro:', data3.substring(0, 300));
                        }
                    });
                });
            });
        });
    });
});
