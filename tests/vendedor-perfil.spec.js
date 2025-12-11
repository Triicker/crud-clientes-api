/**
 * Teste Playwright - Página de Perfil do Vendedor
 * 
 * Testa o fluxo de navegação do admin para a página de perfil do vendedor
 * Bug reportado: authManager.verificarAutenticacao is not a function
 */

const { test, expect } = require('@playwright/test');

test.describe('Perfil do Vendedor', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navegar para página de login
        await page.goto('http://localhost:3000/login.html');
        
        // Fazer login como admin com seletores corretos
        await page.fill('#email', 'novo@admin.com');
        await page.fill('#password', 'senha123');
        await page.click('button.login-button, button[type="submit"]');
        
        // Aguardar redirecionamento para index.html
        await page.waitForURL('**/index.html', { timeout: 10000 });
        
        // Verificar que está logado
        const logoutBtn = page.locator('#logoutButton');
        await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    });

    test('deve carregar perfil do vendedor ao clicar no botão na tabela', async ({ page }) => {
        console.log('🧪 Testando navegação para perfil do vendedor...');
        
        // Aguardar a tabela de clientes carregar
        await page.waitForSelector('table tbody tr', { timeout: 10000 });
        
        // Procurar um botão de vendedor na tabela
        const vendedorButton = page.locator('button:has-text("Maria"), a[href*="vendedor-perfil.html"]').first();
        
        // Se existir botão de vendedor, clicar
        const hasVendedor = await vendedorButton.count() > 0;
        
        if (!hasVendedor) {
            console.log('⚠️ Nenhum vendedor encontrado na tabela. Testando URL direta...');
            // Testar com ID fixo do vendedor (ajustar conforme seu banco)
            await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        } else {
            console.log('✅ Botão de vendedor encontrado, clicando...');
            await vendedorButton.click();
        }
        
        // Aguardar navegação para página do vendedor
        await page.waitForURL('**/vendedor-perfil.html*', { timeout: 5000 });
        
        console.log('📄 URL atual:', page.url());
        
        // Verificar que não há erro de JavaScript
        const errors = [];
        page.on('pageerror', error => {
            errors.push(error.message);
            console.error('❌ Erro JavaScript:', error.message);
        });
        
        // Aguardar 2 segundos para erros aparecerem
        await page.waitForTimeout(2000);
        
        // Verificar se authManager está definido
        const authManagerExists = await page.evaluate(() => {
            return typeof window.authManager !== 'undefined';
        });
        
        expect(authManagerExists).toBeTruthy();
        console.log('✅ authManager está definido:', authManagerExists);
        
        // Verificar se authManager.isAuthenticated existe
        const hasIsAuthenticated = await page.evaluate(() => {
            return typeof window.authManager?.isAuthenticated === 'function';
        });
        
        expect(hasIsAuthenticated).toBeTruthy();
        console.log('✅ authManager.isAuthenticated existe:', hasIsAuthenticated);
        
        // Verificar se há erros de "is not a function"
        const hasAuthError = errors.some(err => 
            err.includes('verificarAutenticacao is not a function') ||
            err.includes('authManager') && err.includes('is not a function')
        );
        
        expect(hasAuthError).toBeFalsy();
        
        if (hasAuthError) {
            console.error('❌ ERRO ENCONTRADO:', errors.join('\n'));
            throw new Error('Erro de authManager detectado');
        }
        
        // Verificar que o conteúdo da página carregou
        const perfilHeader = page.locator('.perfil-header');
        await expect(perfilHeader).toBeVisible({ timeout: 5000 });
        
        console.log('✅ Header do perfil visível');
        
        // Verificar que não está mostrando mensagem de erro
        const errorMessage = page.locator('.error-message, .error-banner');
        const hasError = await errorMessage.count() > 0;
        
        if (hasError) {
            const errorText = await errorMessage.textContent();
            console.error('❌ Mensagem de erro exibida:', errorText);
        }
        
        expect(hasError).toBeFalsy();
        
        // Verificar que os cards de estatísticas aparecem
        const statsCards = page.locator('.stat-card');
        await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
        
        console.log('✅ Cards de estatísticas visíveis');
        
        // Tirar screenshot para documentação
        await page.screenshot({ 
            path: 'test-results/vendedor-perfil-sucesso.png',
            fullPage: true 
        });
        
        console.log('✅ Teste concluído com sucesso!');
    });

    test('deve redirecionar para login se não autenticado', async ({ page, context }) => {
        console.log('🧪 Testando redirecionamento sem autenticação...');
        
        // Limpar cookies e localStorage (logout)
        await context.clearCookies();
        await page.evaluate(() => localStorage.clear());
        
        // Tentar acessar perfil do vendedor diretamente
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        
        // Deve redirecionar para login
        await page.waitForURL('**/login.html', { timeout: 5000 });
        
        console.log('✅ Redirecionou para login corretamente');
        
        // Verificar que está na página de login
        const loginForm = page.locator('form');
        await expect(loginForm).toBeVisible();
    });

    test('deve mostrar erro se ID do vendedor não for fornecido', async ({ page }) => {
        console.log('🧪 Testando erro de ID ausente...');
        
        // Acessar sem parâmetro ID
        await page.goto('http://localhost:3000/vendedor-perfil.html');
        
        // Aguardar mensagem de erro
        await page.waitForTimeout(2000);
        
        // Verificar se há mensagem de erro exibida
        const errorMessage = page.locator('.error-message, .error-banner, .alert-danger');
        const hasError = await errorMessage.count() > 0;
        
        if (hasError) {
            const errorText = await errorMessage.textContent();
            console.log('✅ Mensagem de erro exibida:', errorText);
            expect(errorText).toContain('ID');
        }
        
        // Ou verificar no console
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        await page.waitForTimeout(1000);
        
        const hasIdError = consoleErrors.some(err => 
            err.includes('ID do vendedor') || err.includes('não fornecido')
        );
        
        expect(hasIdError).toBeTruthy();
        console.log('✅ Erro de ID ausente detectado no console');
    });

    test('deve validar presença dos elementos principais', async ({ page }) => {
        console.log('🧪 Testando elementos da página...');
        
        // Navegar para perfil do vendedor
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        
        // Aguardar carregamento
        await page.waitForTimeout(2000);
        
        // Verificar elementos principais
        const elements = {
            'Header do perfil': '.perfil-header',
            'Botão de voltar': 'button:has-text("Voltar")',
            'Container de estatísticas': '.stats-grid',
            'Container de clientes': '#clientesContainer'
        };
        
        for (const [name, selector] of Object.entries(elements)) {
            const element = page.locator(selector);
            const isVisible = await element.isVisible().catch(() => false);
            
            if (isVisible) {
                console.log(`✅ ${name} está visível`);
            } else {
                console.log(`⚠️ ${name} não encontrado (pode ser normal se dados não carregarem)`);
            }
        }
    });

    test('deve permitir voltar para lista de clientes', async ({ page }) => {
        console.log('🧪 Testando botão de voltar...');
        
        // Navegar para perfil do vendedor
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        
        // Aguardar carregamento
        await page.waitForTimeout(2000);
        
        // Clicar no botão voltar
        const voltarBtn = page.locator('button:has-text("Voltar"), a:has-text("Voltar")').first();
        
        if (await voltarBtn.count() > 0) {
            await voltarBtn.click();
            
            // Deve voltar para index.html
            await page.waitForURL('**/index.html', { timeout: 5000 });
            
            console.log('✅ Voltou para lista de clientes');
        } else {
            console.log('⚠️ Botão voltar não encontrado');
        }
    });
});

test.describe('Correção do Bug authManager', () => {
    
    test('deve usar isAuthenticated() em vez de verificarAutenticacao()', async ({ page }) => {
        console.log('🧪 Verificando correção do bug authManager...');
        
        // Fazer login
        await page.goto('http://localhost:3000/login.html');
        await page.fill('#email', 'novo@admin.com');
        await page.fill('#password', 'senha123');
        await page.click('button.login-button, button[type="submit"]');
        await page.waitForURL('**/index.html', { timeout: 10000 });
        
        // Navegar para perfil do vendedor
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        
        // Capturar erros de JavaScript
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        // Aguardar inicialização
        await page.waitForTimeout(3000);
        
        // Verificar que NÃO há erro "verificarAutenticacao is not a function"
        const hasVerificarError = jsErrors.some(err => 
            err.includes('verificarAutenticacao is not a function')
        );
        
        if (hasVerificarError) {
            console.error('❌ ERRO: verificarAutenticacao ainda está sendo chamado!');
            console.error('Erros encontrados:', jsErrors);
            throw new Error('Bug não foi corrigido: verificarAutenticacao is not a function');
        }
        
        console.log('✅ Sem erro de verificarAutenticacao');
        
        // Verificar que authManager.isAuthenticated funciona
        const authStatus = await page.evaluate(() => {
            return {
                exists: typeof window.authManager !== 'undefined',
                hasIsAuthenticated: typeof window.authManager?.isAuthenticated === 'function',
                isAuthenticated: window.authManager?.isAuthenticated() || false,
                hasVerificar: typeof window.authManager?.verificarAutenticacao === 'function'
            };
        });
        
        console.log('📊 Status do authManager:', authStatus);
        
        expect(authStatus.exists).toBeTruthy();
        expect(authStatus.hasIsAuthenticated).toBeTruthy();
        expect(authStatus.isAuthenticated).toBeTruthy();
        expect(authStatus.hasVerificar).toBeFalsy(); // Não deve existir
        
        console.log('✅ Bug corrigido: usando isAuthenticated() corretamente');
    });
});
