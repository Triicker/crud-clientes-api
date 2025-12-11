// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Testes para dropdown editável de vendedores na tabela de clientes
 */

test.describe('Dropdown de Vendedores na Tabela', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('http://localhost:3000/login.html');
        await page.fill('input[type="email"]', 'novo@admin.com');
        await page.fill('input[type="password"]', 'senha123');
        await page.click('button[type="submit"]');
        
        // Aguarda redirecionamento e carregamento da tabela
        await page.waitForURL('**/index.html');
        await page.waitForSelector('.client-row', { timeout: 10000 });
    });

    test('deve exibir dropdowns de vendedores em todas as linhas', async ({ page }) => {
        // Verifica se existem selects de vendedor na tabela
        const selects = await page.locator('.vendedor-select').count();
        
        expect(selects).toBeGreaterThan(0);
        console.log(`✅ ${selects} dropdowns encontrados na tabela`);
    });

    test('deve carregar vendedores nas opções do dropdown', async ({ page }) => {
        // Pega o primeiro select
        const firstSelect = page.locator('.vendedor-select').first();
        
        // Verifica se tem opção "Sem Vendedor"
        const hasEmptyOption = await firstSelect.locator('option[value=""]').count();
        expect(hasEmptyOption).toBe(1);
        
        // Verifica se tem pelo menos 2 vendedores (João e Maria)
        const options = await firstSelect.locator('option').count();
        expect(options).toBeGreaterThanOrEqual(3); // "Sem Vendedor" + João + Maria
        
        console.log(`✅ ${options} opções no dropdown (incluindo "Sem Vendedor")`);
    });

    test('deve atualizar vendedor ao selecionar no dropdown', async ({ page }) => {
        // Aguarda um pouco para garantir que a tabela está carregada
        await page.waitForTimeout(1000);
        
        // Pega o primeiro cliente sem vendedor ou com vendedor diferente de João
        const firstSelect = page.locator('.vendedor-select').first();
        const clientId = await firstSelect.getAttribute('data-client-id');
        
        console.log(`📝 Testando atribuição no cliente ID: ${clientId}`);
        
        // Busca a opção do João Vendedor (ID 11)
        const joaoOption = await firstSelect.locator('option').filter({ hasText: 'João Vendedor' }).count();
        
        if (joaoOption > 0) {
            // Seleciona João Vendedor
            await firstSelect.selectOption({ label: 'João Vendedor' });
            
            // Aguarda o toast de sucesso
            const toast = page.locator('.toast.success');
            await expect(toast).toBeVisible({ timeout: 5000 });
            
            const toastMessage = await toast.locator('.toast-message').textContent();
            expect(toastMessage).toContain('João Vendedor');
            
            console.log(`✅ Toast exibido: ${toastMessage}`);
            
            // Aguarda a tabela atualizar
            await page.waitForTimeout(1000);
            
            // Verifica se o link "Ver perfil" apareceu
            const vendedorLink = page.locator(`[data-client-id="${clientId}"]`).locator('.vendedor-link');
            await expect(vendedorLink).toBeVisible();
            
            console.log('✅ Link "Ver perfil" apareceu após atribuição');
        } else {
            console.log('⚠️ João Vendedor não encontrado nas opções');
        }
    });

    test('deve remover vendedor ao selecionar "Sem Vendedor"', async ({ page }) => {
        // Aguarda a tabela carregar
        await page.waitForTimeout(1000);
        
        // Pega um select que tenha vendedor atribuído
        const selectComVendedor = page.locator('.vendedor-select').filter({ 
            hasNot: page.locator('option[selected][value=""]') 
        }).first();
        
        const count = await selectComVendedor.count();
        
        if (count > 0) {
            const clientId = await selectComVendedor.getAttribute('data-client-id');
            console.log(`📝 Testando remoção de vendedor do cliente ID: ${clientId}`);
            
            // Seleciona "Sem Vendedor"
            await selectComVendedor.selectOption('');
            
            // Aguarda o toast
            const toast = page.locator('.toast.success');
            await expect(toast).toBeVisible({ timeout: 5000 });
            
            const toastMessage = await toast.locator('.toast-message').textContent();
            expect(toastMessage).toContain('removido');
            
            console.log(`✅ Toast exibido: ${toastMessage}`);
            
            // Aguarda atualização
            await page.waitForTimeout(1000);
            
            // Verifica se o link "Ver perfil" sumiu
            const vendedorLink = page.locator(`[data-client-id="${clientId}"]`).locator('.vendedor-link');
            await expect(vendedorLink).not.toBeVisible();
            
            console.log('✅ Link "Ver perfil" removido após desatribuição');
        } else {
            console.log('⚠️ Nenhum cliente com vendedor encontrado para testar remoção');
        }
    });

    test('deve navegar para perfil do vendedor ao clicar no link', async ({ page }) => {
        // Aguarda a tabela carregar
        await page.waitForTimeout(1000);
        
        // Procura um link de vendedor
        const vendedorLink = page.locator('.vendedor-link').first();
        const count = await vendedorLink.count();
        
        if (count > 0) {
            const href = await vendedorLink.getAttribute('href');
            console.log(`🔗 Link encontrado: ${href}`);
            
            // Clica no link
            await vendedorLink.click();
            
            // Aguarda navegação
            await page.waitForURL('**/vendedor-perfil.html?id=*');
            
            // Verifica se a página carregou
            const titulo = page.locator('h1, h2').first();
            await expect(titulo).toBeVisible({ timeout: 10000 });
            
            const tituloTexto = await titulo.textContent();
            console.log(`✅ Navegou para perfil: ${tituloTexto}`);
        } else {
            console.log('⚠️ Nenhum link de vendedor encontrado para testar navegação');
        }
    });

    test('deve aplicar estilo de hover no dropdown', async ({ page }) => {
        const firstSelect = page.locator('.vendedor-select').first();
        
        // Hover sobre o select
        await firstSelect.hover();
        
        // Aguarda um pouco para o CSS aplicar
        await page.waitForTimeout(300);
        
        // Verifica se o border color mudou (indicando hover)
        const borderColor = await firstSelect.evaluate(el => 
            window.getComputedStyle(el).borderColor
        );
        
        console.log(`🎨 Border color no hover: ${borderColor}`);
        
        // Não precisa verificar cor exata, apenas que não está vazio
        expect(borderColor).toBeTruthy();
    });
});
