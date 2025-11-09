/**
 * TESTE DE FLUXO DE DADOS: Backend → Frontend
 * Arquivo: test-data-flow.js
 * 
 * Este script testa se os dados são passados corretamente desde o backend
 * até o frontend, e se a formatação está funcionando.
 */

// ============================================================================
// 1. TESTE DO ENDPOINT BACKEND
// ============================================================================

console.log('🧪 INICIANDO TESTES DE FLUXO DE DADOS\n');

// Função para testar conexão e dados do endpoint
async function testBackendEndpoint() {
    console.log('📡 Teste 1: Verificando endpoint backend /api/clientes/:id/relatorio');
    console.log('─'.repeat(60));
    
    try {
        // Assumindo cliente com ID 1 para teste
        const clientId = 1;
        const response = await fetch(`http://localhost:3000/api/clientes/${clientId}/relatorio`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Resposta recebida com sucesso');
        console.log('─'.repeat(60));
        
        // Verifica campos principais
        console.log('\n📋 CAMPOS DO CLIENTE:');
        console.log(`  • ID: ${data.id}`);
        console.log(`  • Nome: ${data.nome}`);
        console.log(`  • Tipo: ${data.tipo}`);
        console.log(`  • Cidade/UF: ${data.cidade}/${data.uf}`);
        console.log(`  • Telefone: ${data.telefone}`);
        
        // Verifica dados relacionados
        console.log('\n👥 EQUIPE PEDAGÓGICA:');
        if (data.equipe_pedagogica && data.equipe_pedagogica.length > 0) {
            console.log(`  ✅ ${data.equipe_pedagogica.length} membro(s) encontrado(s)`);
            console.log('  Campos:');
            const firstMember = data.equipe_pedagogica[0];
            console.log(`    - id: ${firstMember.id}`);
            console.log(`    - funcao: ${firstMember.funcao}`);
            console.log(`    - nome: ${firstMember.nome}`);
            console.log(`    - zap: ${firstMember.zap}`);
            console.log(`    - email: ${firstMember.email}`);
            console.log(`    - rede_social: ${firstMember.rede_social}`);
        } else {
            console.log('  ⚠️ Nenhum membro encontrado');
        }
        
        console.log('\n👨‍🏫 CORPO DOCENTE:');
        if (data.corpo_docente && data.corpo_docente.length > 0) {
            console.log(`  ✅ ${data.corpo_docente.length} docente(s) encontrado(s)`);
            console.log('  Campos:');
            const firstTeacher = data.corpo_docente[0];
            console.log(`    - id: ${firstTeacher.id}`);
            console.log(`    - funcao: ${firstTeacher.funcao}`);
            console.log(`    - nome: ${firstTeacher.nome}`);
            console.log(`    - zap: ${firstTeacher.zap}`);
            console.log(`    - email: ${firstTeacher.email}`);
            console.log(`    - escola: ${firstTeacher.escola}`);
        } else {
            console.log('  ⚠️ Nenhum docente encontrado');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Erro ao testar backend:', error.message);
        return null;
    }
}

// ============================================================================
// 2. TESTE DE FORMATAÇÃO (simulado)
// ============================================================================

function testDataFormatting(backendData) {
    console.log('\n\n📊 Teste 2: Verificando formatação dos dados (formatClientData)');
    console.log('─'.repeat(60));
    
    if (!backendData) {
        console.log('❌ Sem dados do backend para testar');
        return;
    }
    
    // Simular a função formatClientData
    const formatted = {
        id: backendData.id,
        name: backendData.nome,
        type: backendData.tipo,
        address: backendData.observacoes || '',
        phone: backendData.telefone || '',
        cnpj: backendData.cnpj || '',
        city: backendData.cidade || '',
        state: backendData.uf || '',
        observations: backendData.observacoes || '',
        
        educationalTeam: (backendData.equipe_pedagogica || []).map(eq => ({
            id: eq.id,
            role: eq.funcao,
            name: eq.nome,
            whatsapp: eq.zap || '',
            email: eq.email,
            socialMedia: eq.rede_social || ''
        })),
        
        teachers: (backendData.corpo_docente || []).map(doc => ({
            id: doc.id,
            role: doc.funcao,
            name: doc.nome,
            whatsapp: doc.zap || '',
            email: doc.email,
            school: doc.escola || ''
        }))
    };
    
    console.log('✅ Dados formatados com sucesso');
    console.log('─'.repeat(60));
    
    console.log('\n📋 DADOS FORMATADOS (Frontend):');
    console.log(`  • ID: ${formatted.id}`);
    console.log(`  • Nome: ${formatted.name}`);
    console.log(`  • Tipo: ${formatted.type}`);
    console.log(`  • Cidade: ${formatted.city}`);
    
    console.log('\n👥 EQUIPE PEDAGÓGICA (FORMATADA):');
    if (formatted.educationalTeam && formatted.educationalTeam.length > 0) {
        console.log(`  ✅ ${formatted.educationalTeam.length} membro(s) formatado(s)`);
        formatted.educationalTeam.forEach((member, idx) => {
            console.log(`  [${idx + 1}]`);
            console.log(`    • ID: ${member.id}`);
            console.log(`    • Função: ${member.role}`);
            console.log(`    • Nome: ${member.name}`);
            console.log(`    • WhatsApp: ${member.whatsapp}`);
            console.log(`    • Email: ${member.email}`);
        });
    } else {
        console.log('  ⚠️ Sem dados para formatar');
    }
    
    console.log('\n👨‍🏫 CORPO DOCENTE (FORMATADO):');
    if (formatted.teachers && formatted.teachers.length > 0) {
        console.log(`  ✅ ${formatted.teachers.length} docente(s) formatado(s)`);
        formatted.teachers.forEach((teacher, idx) => {
            console.log(`  [${idx + 1}]`);
            console.log(`    • ID: ${teacher.id}`);
            console.log(`    • Função: ${teacher.role}`);
            console.log(`    • Nome: ${teacher.name}`);
            console.log(`    • WhatsApp: ${teacher.whatsapp}`);
            console.log(`    • Email: ${teacher.email}`);
            console.log(`    • Escola: ${teacher.school}`);
        });
    } else {
        console.log('  ⚠️ Sem dados para formatar');
    }
    
    return formatted;
}

// ============================================================================
// 3. TESTE DE RENDERIZAÇÃO
// ============================================================================

function testRendering(formattedData) {
    console.log('\n\n🎨 Teste 3: Verificando se dados estão prontos para renderização');
    console.log('─'.repeat(60));
    
    if (!formattedData) {
        console.log('❌ Sem dados formatados para testar renderização');
        return;
    }
    
    // Verifica se as arrays estão prontas para map()
    console.log('\n✅ Verificação de estruturas para map():');
    
    console.log('\n👥 EQUIPE PEDAGÓGICA:');
    if (Array.isArray(formattedData.educationalTeam)) {
        console.log(`  ✅ educationalTeam é um array válido (${formattedData.educationalTeam.length} itens)`);
        if (formattedData.educationalTeam.length > 0) {
            console.log('  ✅ Primeiro item tem as propriedades esperadas:');
            const item = formattedData.educationalTeam[0];
            console.log(`     • role: ${item.role ? '✅' : '❌'}`);
            console.log(`     • name: ${item.name ? '✅' : '❌'}`);
            console.log(`     • whatsapp: ${item.whatsapp ? '✅' : '❌'}`);
            console.log(`     • email: ${item.email ? '✅' : '❌'}`);
        }
    } else {
        console.log(`  ❌ educationalTeam não é array: ${typeof formattedData.educationalTeam}`);
    }
    
    console.log('\n👨‍🏫 CORPO DOCENTE:');
    if (Array.isArray(formattedData.teachers)) {
        console.log(`  ✅ teachers é um array válido (${formattedData.teachers.length} itens)`);
        if (formattedData.teachers.length > 0) {
            console.log('  ✅ Primeiro item tem as propriedades esperadas:');
            const item = formattedData.teachers[0];
            console.log(`     • role: ${item.role ? '✅' : '❌'}`);
            console.log(`     • name: ${item.name ? '✅' : '❌'}`);
            console.log(`     • whatsapp: ${item.whatsapp ? '✅' : '❌'}`);
            console.log(`     • email: ${item.email ? '✅' : '❌'}`);
            console.log(`     • school: ${item.school ? '✅' : '❌'}`);
        }
    } else {
        console.log(`  ❌ teachers não é array: ${typeof formattedData.teachers}`);
    }
}

// ============================================================================
// 4. EXECUTAR TODOS OS TESTES
// ============================================================================

async function runAllTests() {
    try {
        const backendData = await testBackendEndpoint();
        if (backendData) {
            const formattedData = testDataFormatting(backendData);
            testRendering(formattedData);
        }
        
        console.log('\n\n' + '═'.repeat(60));
        console.log('✅ TESTES CONCLUÍDOS');
        console.log('═'.repeat(60));
        
    } catch (error) {
        console.error('❌ Erro durante testes:', error);
    }
}

// Executar se estiver em Node.js ou browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testBackendEndpoint, testDataFormatting, testRendering, runAllTests };
} else {
    // Se estiver no navegador, executar automaticamente
    runAllTests();
}
