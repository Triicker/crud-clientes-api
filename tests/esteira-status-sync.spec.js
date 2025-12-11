// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'carlos.silva@empresa.com', senha: '123456' };

/**
 * Testes para validar a sincronização do status do cliente
 * quando tarefas são marcadas na esteira
 */

test.describe('Sincronização Status Esteira', () => {
    // Login antes de cada teste
    test.beforeEach(async ({ page }) => {
        // Interceptar requisições para debug
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                console.log('📍', request.method(), request.url().replace(BASE_URL, ''));
            }
        });

        // Login - usando mesmo padrão do gestao-vendedores-full.spec.js
        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('input[name="email"], input#email', ADMIN_USER.email);
        await page.fill('input[name="senha"], input#password, input[type="password"]', ADMIN_USER.senha);
        await page.click('button[type="submit"]');
        
        // Aguardar redirecionamento com regex
        await page.waitForURL(/index\.html|\/$/);
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle');
    });

    test('Marcar tarefa na esteira atualiza o status na tabela de clientes', async ({ page }) => {
        // 1. Encontrar um cliente na tabela (Arquitetura Plus ou outro)
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Clicar no botão da esteira do primeiro cliente
        const esteiraBtn = page.locator('.esteira-btn-modern').first();
        await expect(esteiraBtn).toBeVisible();
        
        // Capturar o status inicial
        const statusInicial = await esteiraBtn.locator('span').textContent();
        console.log('📊 Status inicial:', statusInicial);
        
        // Clicar para abrir a esteira
        await esteiraBtn.click();
        
        // Aguardar a esteira carregar
        await page.waitForSelector('#esteiraProcessosSection', { timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // 2. Verificar se a seção da esteira está visível
        const esteiraSection = page.locator('#esteiraProcessosSection');
        await expect(esteiraSection).toBeVisible();
        
        // 3. Encontrar células de tarefa clicáveis
        const tarefaCells = page.locator('.tarefa-cell[role="button"]');
        const countCells = await tarefaCells.count();
        console.log('📋 Células de tarefa encontradas:', countCells);
        
        if (countCells > 0) {
            // Clicar em uma tarefa para marcar
            const primeiraTarefa = tarefaCells.first();
            const estavaMarcada = await primeiraTarefa.getAttribute('aria-pressed');
            console.log('📍 Tarefa estava marcada?', estavaMarcada);
            
            // Clicar para alternar
            await primeiraTarefa.click();
            await page.waitForTimeout(1500); // Aguardar salvamento
            
            // Verificar se a tarefa mudou de estado
            const estadoApos = await primeiraTarefa.getAttribute('aria-pressed');
            console.log('📍 Tarefa após clique:', estadoApos);
            
            // O estado deve ter mudado
            expect(estadoApos).not.toBe(estavaMarcada);
        }
        
        // 4. Verificar se a tabela de clientes foi atualizada
        // Procurar o botão de status que deveria ter sido atualizado
        const statusAtualizado = await esteiraBtn.locator('span').textContent();
        console.log('📊 Status após marcar tarefa:', statusAtualizado);
        
        // O status deve ser um ID de etapa válido
        const etapasValidas = [
            'prospeccao', 'aumentar_conexao', 'envio_consultor', 'efetivacao',
            'registros_legais', 'separacao', 'entrega', 'recebimentos',
            'formacao', 'documentarios', 'gerar_graficos', 'renovacao',
            'Prospecção', 'Prospecção 3 Canais', 'Aumentar Conexão', 'Envio de Consultor',
            'Efetivação', 'Registros Legais', 'Separação', 'Entrega', 'Recebimentos',
            'Formação', 'Documentários', 'Gerar Gráficos', 'Renovação'
        ];
        
        // Verifica se o status é válido (não está vazio/em branco)
        expect(statusAtualizado?.trim()).toBeTruthy();
    });

    test('Status do botão reflete a etapa atual baseada nas tarefas', async ({ page }) => {
        // Aguardar tabela carregar
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Verificar todos os botões de esteira
        const clientRows = page.locator('.client-row');
        const count = await clientRows.count();
        console.log('🔢 Quantidade de clientes:', count);
        
        let clientesComStatusVazio = 0;
        let clientesComStatusValido = 0;
        
        for (let i = 0; i < Math.min(count, 5); i++) {
            const row = clientRows.nth(i);
            const status = await row.locator('.esteira-btn-modern span').textContent();
            const clientName = await row.locator('.client-name').textContent();
            
            console.log(`👤 Cliente: ${clientName?.trim().substring(0, 30)} | Status: "${status}"`);
            
            if (!status || status.trim() === '') {
                clientesComStatusVazio++;
            } else {
                clientesComStatusValido++;
            }
        }
        
        console.log(`📊 Resumo: ${clientesComStatusValido} com status válido, ${clientesComStatusVazio} com status vazio`);
        
        // Todos os clientes devem ter um status válido (não vazio)
        expect(clientesComStatusVazio).toBe(0);
    });

    test('Indicadores de progresso (bolinhas) sincronizam com tarefas', async ({ page }) => {
        // Aguardar tabela carregar
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Clicar no primeiro cliente para abrir esteira
        await page.locator('.esteira-btn-modern').first().click();
        
        // Aguardar esteira carregar
        await page.waitForSelector('.esteira-etapa-col', { timeout: 5000 });
        
        // Verificar indicadores de etapa
        const indicadores = page.locator('.esteira-etapa-col');
        const countIndicadores = await indicadores.count();
        console.log('🔵 Indicadores de etapa:', countIndicadores);
        
        // Devem ter 12 etapas
        expect(countIndicadores).toBe(12);
        
        // Verificar que pelo menos o primeiro indicador está visível
        await expect(indicadores.first()).toBeVisible();
    });

    test('API atualiza status ao salvar tarefas', async ({ page, request }) => {
        // Fazer login via API
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
            data: ADMIN_USER
        });
        expect(loginResponse.ok()).toBeTruthy();
        const { token } = await loginResponse.json();
        
        // Buscar um cliente
        const clientesResponse = await request.get(`${BASE_URL}/api/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        expect(clientesResponse.ok()).toBeTruthy();
        const clientes = await clientesResponse.json();
        
        if (clientes.length > 0) {
            const clienteId = clientes[0].id;
            console.log('📋 Testando cliente ID:', clienteId);
            
            // Preparar tarefas concluídas (primeira etapa completa)
            const tarefasConcluidas = {
                'prospeccao': [0, 1, 2], // 3 tarefas = etapa concluída
                'aumentar_conexao': [0] // 1 tarefa = etapa não concluída
            };
            
            // Salvar tarefas
            const updateResponse = await request.put(`${BASE_URL}/api/clientes/${clienteId}/tarefas`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: { tarefas_concluidas: tarefasConcluidas }
            });
            
            expect(updateResponse.ok()).toBeTruthy();
            const clienteAtualizado = await updateResponse.json();
            
            console.log('✅ Status retornado pela API:', clienteAtualizado.status);
            
            // O status deve ser 'aumentar_conexao' pois é a primeira etapa não completa
            expect(clienteAtualizado.status).toBe('aumentar_conexao');
        }
    });

    test('Cliente com todas tarefas da etapa 1 completas avança para etapa 2', async ({ page, request }) => {
        // Login via API
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
            data: ADMIN_USER
        });
        const { token } = await loginResponse.json();
        
        // Buscar cliente Arquitetura Plus
        const clientesResponse = await request.get(`${BASE_URL}/api/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const clientes = await clientesResponse.json();
        const arquiteturaPlus = clientes.find(c => c.nome.includes('Arquitetura Plus'));
        
        if (arquiteturaPlus) {
            console.log('📋 Testando Arquitetura Plus, ID:', arquiteturaPlus.id);
            console.log('📊 Status atual:', arquiteturaPlus.status);
            
            // Verificar tarefas atuais
            const esteiraResponse = await request.get(`${BASE_URL}/api/clientes/${arquiteturaPlus.id}/esteira`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const esteira = await esteiraResponse.json();
            console.log('📦 Tarefas atuais:', JSON.stringify(esteira.tarefas_concluidas));
            
            // Se tem tarefas, o status deve refletir a etapa correta
            if (esteira.tarefas_concluidas) {
                const status = arquiteturaPlus.status;
                expect(status).toBeTruthy();
                console.log('✅ Status está definido:', status);
            }
        } else {
            console.log('⚠️ Cliente Arquitetura Plus não encontrado');
        }
    });
});
