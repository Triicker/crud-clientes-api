const https = require('https');

console.log('==================================================');
console.log('BUSCANDO CNPJ VÁLIDO DE CONTRATOS REAIS');
console.log('==================================================');
console.log('');

// Buscar contratos gerais para encontrar CNPJs válidos
const url = 'https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=2024-10-01&dataFinal=2024-11-17&pagina=1';

console.log('1️⃣ Buscando contratos recentes...');
console.log('URL:', url);
console.log('');

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const contratos = JSON.parse(data);
                console.log(`✅ Encontrados ${contratos.length} contratos`);
                console.log('');
                
                if (contratos.length > 0) {
                    // Pegar os primeiros 5 CNPJs únicos
                    const cnpjs = new Set();
                    
                    contratos.forEach(contrato => {
                        if (contrato.orgaoEntidade && contrato.orgaoEntidade.cnpj) {
                            cnpjs.add(contrato.orgaoEntidade.cnpj);
                        }
                    });
                    
                    const cnpjsArray = Array.from(cnpjs).slice(0, 5);
                    
                    console.log('📋 CNPJs encontrados nos contratos:');
                    cnpjsArray.forEach((cnpj, index) => {
                        console.log(`${index + 1}. ${cnpj}`);
                    });
                    
                    console.log('');
                    console.log('2️⃣ Testando o primeiro CNPJ...');
                    
                    if (cnpjsArray.length > 0) {
                        testarCNPJ(cnpjsArray[0]);
                    }
                }
            } catch(e) {
                console.error('❌ Erro ao parsear JSON:', e.message);
                console.log('Resposta:', data.substring(0, 500));
            }
        } else {
            console.log('❌ Erro HTTP:', res.statusCode);
        }
    });
}).on('error', (e) => {
    console.error('❌ Erro na requisição:', e.message);
});

function testarCNPJ(cnpj) {
    const testUrl = `https://pncp.gov.br/api/consulta/v1/orgaos/${cnpj}/contratos?dataInicial=2024-10-01&dataFinal=2024-11-17&pagina=1`;
    
    console.log('');
    console.log('URL de teste:', testUrl);
    console.log('');
    
    https.get(testUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(data);
                    console.log('✅✅✅ SUCESSO! Este CNPJ funciona!');
                    console.log('Contratos encontrados:', json.length);
                    console.log('');
                    console.log('Use este CNPJ:', cnpj);
                } catch(e) {
                    console.log('Resposta:', data.substring(0, 300));
                }
            } else {
                console.log('❌ Ainda retornou:', res.statusCode);
                console.log('Resposta:', data);
            }
        });
    }).on('error', (e) => {
        console.error('❌ Erro:', e.message);
    });
}
