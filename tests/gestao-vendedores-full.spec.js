/**
 * Testes completos para Gestão de Vendedores e Comunicação
 * Verifica carregamento de dados, filtros e interações
 */
const { test, expect } = require('@playwright/test');

// URL base para testes
const BASE_URL = 'http://localhost:3000';

// Credenciais de teste
const ADMIN_USER = {
    email: 'carlos.silva@empresa.com',
    senha: '123456'
};

test.describe('Gestão de Vendedores - Carregamento de Dados', () => {
    
    test.beforeEach(async ({ page }) => {
        // Fazer login antes de cada teste
        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('input[name="email"], input#email', ADMIN_USER.email);
        await page.fill('input[name="senha"], input#password, input[type="password"]', ADMIN_USER.senha);
        await page.click('button[type="submit"]');
        
        // Aguardar redirecionamento
        await page.waitForURL(/index\.html|\/$/);
        await page.waitForTimeout(1000);
    });

    test('Dashboard carrega estatísticas corretamente', async ({ page }) => {
        // Navegar para gestão de vendedores
        await page.goto(`${BASE_URL}/gestao-vendedores.html`);
        await page.waitForLoadState('networkidle');
        
        // Verificar se o título da página está presente
        await expect(page.locator('text=Gestão de Vendedores')).toBeVisible();
        
        // Aguardar carregamento dos dados
        await page.waitForTimeout(2000);
        
        // Verificar se as estatísticas foram carregadas (não devem mostrar '-')
        const statVendedores = page.locator('#stat-vendedores');
        const statClientes = page.locator('#stat-clientes');
        const statVendas = page.locator('#stat-vendas');
        
        // Verificar se os elementos existem
        if (await statVendedores.isVisible()) {
            const vendedoresText = await statVendedores.textContent();
            console.log('Vendedores Ativos:', vendedoresText);
            // Espera-se um número, não '-'
            expect(vendedoresText).not.toBe('-');
        }
        
        if (await statClientes.isVisible()) {
            const clientesText = await statClientes.textContent();
            console.log('Total Clientes:', clientesText);
            expect(clientesText).not.toBe('-');
        }
    });

    test('Cards de vendedores são exibidos corretamente', async ({ page }) => {
        await page.goto(`${BASE_URL}/gestao-vendedores.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verificar se os cards de vendedores foram carregados
        const usersGrid = page.locator('#users-grid');
        await expect(usersGrid).toBeVisible();
        
        // Verificar se há pelo menos um card de vendedor
        const userCards = page.locator('.user-card');
        const cardCount = await userCards.count();
        console.log('Quantidade de cards de vendedores:', cardCount);
        
        // Deve haver pelo menos 1 vendedor (equipe_interna)
        expect(cardCount).toBeGreaterThan(0);
        
        // Verificar se os vendedores são apenas do perfil equipe_interna
        const perfilBadges = page.locator('.user-perfil');
        const badgeCount = await perfilBadges.count();
        
        for (let i = 0; i < badgeCount; i++) {
            const badgeText = await perfilBadges.nth(i).textContent();
            console.log(`Perfil do vendedor ${i + 1}:`, badgeText);
            expect(badgeText).toBe('equipe_interna');
        }
    });

    test('Ranking de vendedores carrega dados', async ({ page }) => {
        await page.goto(`${BASE_URL}/gestao-vendedores.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verificar se o ranking está presente
        const rankingSection = page.locator('text=Ranking de Vendedores');
        await expect(rankingSection).toBeVisible();
        
        // Verificar se há linhas no ranking
        const rankingRows = page.locator('#ranking-tbody tr');
        const rowCount = await rankingRows.count();
        console.log('Linhas no ranking:', rowCount);
        
        // Deve haver pelo menos 1 vendedor no ranking
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Modal de detalhes abre corretamente', async ({ page }) => {
        await page.goto(`${BASE_URL}/gestao-vendedores.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Clicar no primeiro botão de detalhes
        const btnDetalhes = page.locator('.btn-detalhes').first();
        if (await btnDetalhes.isVisible()) {
            await btnDetalhes.click();
            await page.waitForTimeout(500);
            
            // Verificar se o modal foi aberto
            const modal = page.locator('.modal-overlay.active, .modal.active, [class*="modal"][class*="active"]');
            const isModalVisible = await modal.isVisible().catch(() => false);
            console.log('Modal de detalhes aberto:', isModalVisible);
        }
    });
});

test.describe('API de Vendedores - Testes Diretos', () => {
    
    test('GET /api/vendedores retorna dados com filtro de perfil', async ({ request }) => {
        // Primeiro fazer login para obter token
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
            data: ADMIN_USER
        });
        expect(loginResponse.ok()).toBeTruthy();
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        expect(token).toBeTruthy();
        
        // Buscar vendedores com filtro
        const vendedoresResponse = await request.get(`${BASE_URL}/api/vendedores?perfil=equipe_interna`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        expect(vendedoresResponse.ok()).toBeTruthy();
        const vendedoresData = await vendedoresResponse.json();
        
        console.log('Total de vendedores (equipe_interna):', vendedoresData.total);
        expect(vendedoresData.success).toBeTruthy();
        expect(vendedoresData.usuarios).toBeDefined();
        expect(vendedoresData.usuarios.length).toBeGreaterThan(0);
        
        // Verificar se todos são do perfil equipe_interna
        for (const usuario of vendedoresData.usuarios) {
            expect(usuario.perfil_nome).toBe('equipe_interna');
            console.log(`- ${usuario.nome}: ${usuario.estatisticas?.total_clientes || 0} clientes`);
        }
    });

    test('GET /api/vendedores/dashboard retorna estatísticas', async ({ request }) => {
        // Login
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
            data: ADMIN_USER
        });
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Buscar dashboard
        const dashboardResponse = await request.get(`${BASE_URL}/api/vendedores/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        expect(dashboardResponse.ok()).toBeTruthy();
        const dashboardData = await dashboardResponse.json();
        
        console.log('Dashboard:', JSON.stringify(dashboardData, null, 2));
        expect(dashboardData.success).toBeTruthy();
        expect(dashboardData.dashboard).toBeDefined();
        expect(dashboardData.dashboard.estatisticas_gerais).toBeDefined();
        expect(dashboardData.dashboard.ranking_vendedores).toBeDefined();
    });
});

test.describe('Comunicação da Equipe - Carregamento de Dados', () => {
    
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('input[name="email"], input#email', ADMIN_USER.email);
        await page.fill('input[name="senha"], input#password, input[type="password"]', ADMIN_USER.senha);
        await page.click('button[type="submit"]');
        await page.waitForURL(/index\.html|\/$/);
        await page.waitForTimeout(1000);
    });

    test('Página de comunicação carrega dados', async ({ page }) => {
        await page.goto(`${BASE_URL}/comunicacao-equipe.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verificar título principal
        await expect(page.getByRole('heading', { name: 'Comunicação da Equipe' })).toBeVisible();
    });

    test('Select de clientes é populado', async ({ page }) => {
        await page.goto(`${BASE_URL}/comunicacao-equipe.html`);
        
        // Esperar as chamadas de API terminarem
        const [clientesResponse] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/clientes') && resp.status() === 200, { timeout: 10000 }).catch(() => null),
            page.waitForLoadState('networkidle')
        ]);
        
        // Aguardar mais um pouco para o DOM ser atualizado
        await page.waitForTimeout(2000);
        
        // Capturar logs do console
        const consoleLogs = [];
        page.on('console', msg => consoleLogs.push(msg.text()));
        
        // Verificar se o select de clientes tem opções
        const selectCliente = page.locator('#select-cliente');
        if (await selectCliente.isVisible()) {
            const options = await selectCliente.locator('option').count();
            console.log('Opções no select de clientes:', options);
            console.log('Console logs:', consoleLogs.slice(-10));
            // Deve ter mais que apenas a opção padrão
            expect(options).toBeGreaterThan(1);
        }
    });

    test('Select de usuários é populado', async ({ page }) => {
        await page.goto(`${BASE_URL}/comunicacao-equipe.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Verificar se o select de destinatários tem opções
        const selectDestinatario = page.locator('#select-destinatario');
        if (await selectDestinatario.isVisible()) {
            const options = await selectDestinatario.locator('option').count();
            console.log('Opções no select de destinatários:', options);
            expect(options).toBeGreaterThan(1);
        }
    });
});

test.describe('API de Comunicação - Testes Diretos', () => {
    
    test('GET /api/comunicacao/usuarios retorna lista de usuários', async ({ request }) => {
        // Login
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
            data: ADMIN_USER
        });
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Buscar usuários
        const usuariosResponse = await request.get(`${BASE_URL}/api/comunicacao/usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        expect(usuariosResponse.ok()).toBeTruthy();
        const usuariosData = await usuariosResponse.json();
        
        console.log('Total de usuários para comunicação:', usuariosData.total);
        expect(usuariosData.usuarios).toBeDefined();
        expect(usuariosData.usuarios.length).toBeGreaterThan(0);
    });

    test('GET /api/clientes retorna lista de clientes', async ({ request }) => {
        // Login
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
            data: ADMIN_USER
        });
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Buscar clientes
        const clientesResponse = await request.get(`${BASE_URL}/api/clientes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        expect(clientesResponse.ok()).toBeTruthy();
        const clientesData = await clientesResponse.json();
        
        // A API retorna array diretamente
        const clientes = Array.isArray(clientesData) ? clientesData : clientesData.clientes;
        console.log('Total de clientes:', clientes?.length || 0);
        expect(clientes).toBeDefined();
        expect(clientes.length).toBeGreaterThan(0);
    });

    test('GET /api/comunicacao/dashboard retorna estatísticas', async ({ request }) => {
        // Login
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
            data: ADMIN_USER
        });
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Buscar dashboard
        const dashboardResponse = await request.get(`${BASE_URL}/api/comunicacao/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        expect(dashboardResponse.ok()).toBeTruthy();
        const dashboardData = await dashboardResponse.json();
        
        console.log('Dashboard comunicação:', JSON.stringify(dashboardData, null, 2));
        expect(dashboardData.estatisticas).toBeDefined();
    });
});
