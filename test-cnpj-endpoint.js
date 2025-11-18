/**
 * Test script to validate PNCP CNPJ endpoint
 * Tests CNPJ: 13.937.065/0001-00
 */

const https = require('https');

const CNPJ = '13937065000100'; // CNPJ without formatting
const BASE_URL = 'pncp.gov.br';

// Test dates: last 30 days
const dataFinal = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const dataInicial = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

const path = `/api/consulta/v1/orgaos/${CNPJ}/contratos?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1`;

console.log('='.repeat(60));
console.log('Testing PNCP API - Contracts by Organization');
console.log('='.repeat(60));
console.log(`CNPJ: ${CNPJ}`);
console.log(`Endpoint: https://${BASE_URL}${path}`);
console.log(`Data Range: ${dataInicial} to ${dataFinal}`);
console.log('='.repeat(60));
console.log('');

const options = {
    hostname: BASE_URL,
    path: path,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);
    console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
    console.log('');

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response received:');
        console.log('-'.repeat(60));
        
        try {
            const parsed = JSON.parse(data);
            
            if (Array.isArray(parsed)) {
                console.log(`✅ SUCCESS: Found ${parsed.length} contracts`);
                console.log('');
                
                if (parsed.length > 0) {
                    console.log('First contract sample:');
                    console.log(JSON.stringify(parsed[0], null, 2));
                } else {
                    console.log('No contracts found for this CNPJ in the specified date range.');
                    console.log('This might be normal if the organization has no contracts in this period.');
                }
            } else if (parsed.error || parsed.message) {
                console.log(`❌ ERROR: ${parsed.message || parsed.error}`);
            } else {
                console.log('Unexpected response format:');
                console.log(JSON.stringify(parsed, null, 2));
            }
        } catch (error) {
            console.log(`❌ PARSE ERROR: ${error.message}`);
            console.log('Raw response:');
            console.log(data.substring(0, 500)); // First 500 chars
        }
        
        console.log('-'.repeat(60));
    });
});

req.on('error', (error) => {
    console.error(`❌ REQUEST ERROR: ${error.message}`);
});

req.end();
