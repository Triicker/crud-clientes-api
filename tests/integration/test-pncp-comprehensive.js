/**
 * Comprehensive PNCP API Test
 * Tests multiple endpoints and CNPJs
 */

const https = require('https');

const BASE_URL = 'pncp.gov.br';

// Test dates
const dataFinal = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const dataInicial = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

// List of CNPJs to test
const TEST_CNPJS = [
    '13937065000100', // User provided
    '09198876000169', // Example from search.html
    '00394460005887', // Common federal agency
];

function makeRequest(path, description) {
    return new Promise((resolve, reject) => {
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
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    data: data,
                    description: description
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function runTests() {
    console.log('='.repeat(70));
    console.log('PNCP API Comprehensive Test Suite');
    console.log('='.repeat(70));
    console.log(`Test Date Range: ${dataInicial} to ${dataFinal}`);
    console.log('');

    // Test 1: General contracts endpoint
    console.log('\n' + '='.repeat(70));
    console.log('TEST 1: General Contracts Endpoint (baseline)');
    console.log('='.repeat(70));
    try {
        const result = await makeRequest(
            `/api/consulta/v1/contratos?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1`,
            'General Contracts'
        );
        console.log(`Status: ${result.statusCode}`);
        if (result.statusCode === 200) {
            const parsed = JSON.parse(result.data);
            console.log(`✅ SUCCESS: Found ${Array.isArray(parsed) ? parsed.length : 'N/A'} contracts`);
        } else {
            console.log(`❌ FAILED: ${result.statusMessage}`);
            console.log(`Response: ${result.data.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }

    // Test 2: Organization contracts for each CNPJ
    for (const cnpj of TEST_CNPJS) {
        console.log('\n' + '='.repeat(70));
        console.log(`TEST 2: Organization Contracts for CNPJ: ${cnpj}`);
        console.log('='.repeat(70));
        
        const path = `/api/consulta/v1/orgaos/${cnpj}/contratos?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1`;
        console.log(`Endpoint: https://${BASE_URL}${path}`);
        
        try {
            const result = await makeRequest(path, `Org Contracts ${cnpj}`);
            console.log(`Status: ${result.statusCode} ${result.statusMessage}`);
            
            if (result.statusCode === 200) {
                const parsed = JSON.parse(result.data);
                if (Array.isArray(parsed)) {
                    console.log(`✅ SUCCESS: Found ${parsed.length} contracts`);
                    if (parsed.length > 0) {
                        console.log('\nFirst contract fields:');
                        console.log(Object.keys(parsed[0]).join(', '));
                    }
                } else {
                    console.log(`⚠️  Unexpected format: ${typeof parsed}`);
                    console.log(result.data.substring(0, 200));
                }
            } else if (result.statusCode === 404) {
                console.log(`❌ NOT FOUND: Organization may not exist or has no contracts in this period`);
            } else {
                console.log(`❌ FAILED: ${result.statusMessage}`);
                console.log(`Response: ${result.data.substring(0, 300)}`);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 3: Try to get organization info
    console.log('\n' + '='.repeat(70));
    console.log('TEST 3: Organization Info Endpoint');
    console.log('='.repeat(70));
    
    for (const cnpj of TEST_CNPJS.slice(0, 2)) { // Just test 2
        const path = `/api/consulta/v1/orgaos/${cnpj}`;
        console.log(`\nCNPJ: ${cnpj}`);
        console.log(`Endpoint: https://${BASE_URL}${path}`);
        
        try {
            const result = await makeRequest(path, `Org Info ${cnpj}`);
            console.log(`Status: ${result.statusCode}`);
            
            if (result.statusCode === 200) {
                const parsed = JSON.parse(result.data);
                console.log(`✅ Organization found:`);
                console.log(JSON.stringify(parsed, null, 2).substring(0, 500));
            } else {
                console.log(`❌ Status ${result.statusCode}: Organization not found or error`);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(70));
    console.log('Test Suite Complete');
    console.log('='.repeat(70));
}

runTests().catch(console.error);
