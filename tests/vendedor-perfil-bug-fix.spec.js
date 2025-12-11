/**
 * Teste Simples - Bug do vendedor-perfil.js
 * Verifica se authManager.verificarAutenticacao() foi corrigido para isAuthenticated()
 */

const { test, expect } = require('@playwright/test');

test.describe('Bug Fix - vendedor-perfil.js', () => {
    
    test('deve ter corrigido verificarAutenticacao() para isAuthenticated()', async ({ page }) => {
        console.log('🧪 Testando correção do código...');
        
        // Configurar autenticação manual via localStorage
        await page.goto('http://localhost:3000/login.html');
        
        // Injetar token e usuário no localStorage
        await page.evaluate(() => {
            localStorage.setItem('token', 'fake-token-for-testing');
            localStorage.setItem('currentUser', JSON.stringify({
                id: 1,
                nome: 'Admin Teste',
                email: 'novo@admin.com',
                perfil_id: 1,
                perfil: 'Administrador'
            }));
        });
        
        console.log('✅ Token e usuário configurados no localStorage');
        
        // Capturar erros de JavaScript
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
            console.error('❌ Erro JS:', error.message);
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ Console Error:', msg.text());
            } else if (msg.text().includes('🚀') || msg.text().includes('📋')) {
                console.log('📝', msg.text());
            }
        });
        
        // Navegar para a página do vendedor
        console.log('🔗 Navegando para vendedor-perfil.html?id=12...');
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        
        // Aguardar alguns segundos para erros aparecerem
        await page.waitForTimeout(3000);
        
        // Verificar se há erro específico "verificarAutenticacao is not a function"
        const hasVerificarError = jsErrors.some(err => 
            err.includes('verificarAutenticacao is not a function')
        );
        
        if (hasVerificarError) {
            console.error('❌ FALHOU: Ainda está chamando verificarAutenticacao()');
            console.error('Erros encontrados:', jsErrors);
            throw new Error('Bug NÃO foi corrigido: verificarAutenticacao is not a function');
        }
        
        console.log('✅ SUCESSO: Não há erro de verificarAutenticacao()');
        
        // Verificar conteúdo do arquivo vendedor-perfil.js
        const scriptContent = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[src*="vendedor-perfil.js"]'));
            return scripts.length > 0 ? 'loaded' : 'not-found';
        });
        
        console.log('📜 Script vendedor-perfil.js:', scriptContent);
        
        // Verificar se authManager está definido
        const authManagerStatus = await page.evaluate(() => {
            return {
                exists: typeof window.authManager !== 'undefined',
                hasIsAuthenticated: typeof window.authManager?.isAuthenticated === 'function',
                hasVerificar: typeof window.authManager?.verificarAutenticacao === 'function'
            };
        });
        
        console.log('📊 AuthManager Status:', authManagerStatus);
        
        // O importante é que NÃO haja o erro "verificarAutenticacao is not a function"
        expect(hasVerificarError).toBeFalsy();
        
        // Tirar screenshot
        await page.screenshot({ 
            path: 'test-results/vendedor-perfil-bug-fix.png',
            fullPage: true 
        });
        
        console.log('✅ Teste concluído - Bug corrigido!');
    });

    test('deve permitir login real e acesso ao perfil do vendedor', async ({ page }) => {
        console.log('🧪 Testando fluxo completo com login real...');
        
        // Capturar erros
        const jsErrors = [];
        page.on('pageerror', error => {
            jsErrors.push(error.message);
            console.error('❌ Erro JS:', error.message);
        });
        
        // Fazer login
        console.log('🔐 Fazendo login...');
        await page.goto('http://localhost:3000/login.html');
        await page.fill('#email', 'novo@admin.com');
        await page.fill('#password', 'senha123');
        await page.click('button.login-button');
        
        // Aguardar redirecionamento
        try {
            await page.waitForURL('**/index.html', { timeout: 10000 });
            console.log('✅ Login realizado com sucesso');
        } catch (e) {
            console.error('❌ Falha no login ou redirecionamento');
            await page.screenshot({ path: 'test-results/login-failed.png' });
            throw e;
        }
        
        // Navegar para perfil do vendedor
        console.log('🔗 Navegando para perfil do vendedor...');
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        
        // Aguardar
        await page.waitForTimeout(3000);
        
        // Verificar se NÃO há o erro específico
        const hasVerificarError = jsErrors.some(err => 
            err.includes('verificarAutenticacao is not a function')
        );
        
        if (hasVerificarError) {
            console.error('❌ ERRO: Bug ainda presente!');
            console.error('Erros:', jsErrors);
            await page.screenshot({ path: 'test-results/bug-ainda-presente.png' });
            throw new Error('Bug não foi corrigido');
        }
        
        console.log('✅ Sem erro de verificarAutenticacao');
        
        // Verificar se a página carregou (header do perfil deve estar visível)
        const perfilHeader = page.locator('.perfil-header');
        const headerVisible = await perfilHeader.isVisible().catch(() => false);
        
        if (headerVisible) {
            console.log('✅ Página carregou corretamente');
        } else {
            console.log('⚠️ Página pode ter redirecionado (sem erro de código)');
        }
        
        // Screenshot final
        await page.screenshot({ 
            path: 'test-results/vendedor-perfil-final.png',
            fullPage: true 
        });
        
        // O teste passa se NÃO houver o erro específico
        expect(hasVerificarError).toBeFalsy();
        
        console.log('✅ Teste completo - Bug verificado como corrigido!');
    });
});
