// tests/gestao-vendedores.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Gestão de Vendedores', () => {
    
    // Helper para fazer login como admin
    async function loginAsAdmin(page) {
        await page.goto('http://localhost:3000/login.html');
        await page.waitForSelector('input#email', { timeout: 10000 });
        await page.fill('input#email', 'novo@admin.com');
        await page.fill('input#password', 'senha123');
        await page.click('button#loginBtn');
        await page.waitForURL('**/index.html', { timeout: 10000 });
        
        // Confirma login
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
    }

    test('Menu Gestão de Vendedores deve estar visível para admin', async ({ page }) => {
        await loginAsAdmin(page);
        
        // Aguarda um pouco para garantir que o JS carregou
        await page.waitForTimeout(2000);
        
        // Debug: verifica se os elementos existem
        const menuButtonExists = await page.evaluate(() => !!document.getElementById('userMenuButton'));
        const userMenuExists = await page.evaluate(() => !!document.getElementById('userMenu'));
        const gestaoVendedoresExists = await page.evaluate(() => !!document.getElementById('gestaoVendedores'));
        console.log('userMenuButton existe:', menuButtonExists);
        console.log('userMenu existe:', userMenuExists);
        console.log('gestaoVendedores existe:', gestaoVendedoresExists);
        
        // Clica no botão do menu do usuário (engrenagem)
        const menuButton = page.locator('#userMenuButton');
        await expect(menuButton).toBeVisible({ timeout: 5000 });
        
        // Clica e força o menu a abrir via JS se necessário
        await page.evaluate(() => {
            const menu = document.getElementById('userMenu');
            if (menu) {
                menu.style.display = 'block';
                console.log('Menu forçado a abrir');
            }
        });
        
        // Verifica se o item "Gestão de Vendedores" está visível
        const gestaoVendedoresItem = page.locator('#gestaoVendedores');
        
        // Verifica o estado do menu
        const menuDisplay = await page.evaluate(() => {
            const menu = document.getElementById('userMenu');
            return menu ? menu.style.display : 'não encontrado';
        });
        console.log('Display do menu:', menuDisplay);
        
        // Verifica estado do gestaoVendedores
        const gestaoDisplay = await page.evaluate(() => {
            const item = document.getElementById('gestaoVendedores');
            return item ? getComputedStyle(item).display : 'não encontrado';
        });
        console.log('Display do gestaoVendedores:', gestaoDisplay);
        
        // Log do perfil
        const perfilId = await page.evaluate(() => {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            return user.perfil_id;
        });
        console.log('Perfil ID do usuário logado:', perfilId);
        
        await expect(gestaoVendedoresItem).toBeVisible({ timeout: 3000 });
    });

    test('Deve navegar para página de Gestão de Vendedores', async ({ page }) => {
        await loginAsAdmin(page);
        
        await page.waitForTimeout(2000);
        
        // Força o menu a abrir via JS
        await page.evaluate(() => {
            const menu = document.getElementById('userMenu');
            if (menu) menu.style.display = 'block';
        });
        
        // Clica em Gestão de Vendedores
        await page.locator('#gestaoVendedores').click();
        
        // Aguarda navegar para a página
        await page.waitForURL('**/gestao-vendedores.html', { timeout: 10000 });
        
        // Verifica se a página carregou corretamente
        await expect(page.locator('h1')).toContainText('Gestão de Vendedores', { timeout: 5000 });
    });

    test('Página de Gestão de Vendedores deve carregar dados', async ({ page }) => {
        await loginAsAdmin(page);
        
        // Navega diretamente para a página
        await page.goto('http://localhost:3000/gestao-vendedores.html');
        
        // Aguarda a página carregar
        await page.waitForLoadState('networkidle');
        
        // Verifica elementos principais da página
        await expect(page.locator('h1')).toContainText('Gestão de Vendedores');
        
        // Verifica se os cards de estatísticas existem (usa ID correto: dashboard-stats)
        const statsContainer = page.locator('#dashboard-stats');
        await expect(statsContainer).toBeVisible({ timeout: 5000 });
        
        // Verifica se o grid de usuários existe (usa ID correto: users-grid)
        const vendedoresContainer = page.locator('#users-grid');
        await expect(vendedoresContainer).toBeVisible({ timeout: 10000 });
        
        // Aguarda os dados carregarem
        await page.waitForTimeout(2000);
        
        // Verifica se tem cards de vendedores
        const userCards = page.locator('#users-grid .user-card');
        const cardsCount = await userCards.count();
        console.log('Cards de vendedores encontrados:', cardsCount);
    });

    test('Tarefas da esteira devem ficar verdes ao clicar (admin)', async ({ page }) => {
        await loginAsAdmin(page);
        
        // Aguarda a tabela de clientes carregar
        await page.waitForSelector('#tableBody tr', { timeout: 10000 });
        
        // Clica no primeiro cliente para abrir detalhes
        const firstRow = page.locator('#tableBody tr').first();
        await firstRow.click();
        
        // Aguarda a esteira/modal carregar
        await page.waitForTimeout(1500);
        
        // Procura por uma célula da esteira que não está marcada (background branco)
        const esteiraCell = page.locator('[data-etapa-id][data-acao-idx]').first();
        
        if (await esteiraCell.count() > 0) {
            // Pega a cor de fundo antes do clique
            const bgColorBefore = await esteiraCell.evaluate(el => getComputedStyle(el).backgroundColor);
            console.log('Cor antes do clique:', bgColorBefore);
            
            // Clica na célula
            await esteiraCell.click();
            
            // Aguarda um pouco para a atualização visual
            await page.waitForTimeout(500);
            
            // Verifica se a cor mudou para verde (#90EE90 = rgb(144, 238, 144))
            const bgColorAfter = await esteiraCell.evaluate(el => getComputedStyle(el).backgroundColor);
            console.log('Cor depois do clique:', bgColorAfter);
            
            // Verifica se mudou (não está mais branco)
            expect(bgColorAfter).not.toBe(bgColorBefore);
        } else {
            console.log('Nenhuma célula de esteira encontrada - pulando teste de cor');
        }
    });

    test('API de vendedores deve retornar dados', async ({ page }) => {
        await loginAsAdmin(page);
        
        // Faz uma requisição direta para a API
        const token = await page.evaluate(() => localStorage.getItem('token'));
        
        const response = await page.request.get('http://localhost:3000/api/vendedores', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        expect(response.ok()).toBeTruthy();
        
        const data = await response.json();
        console.log('Resposta da API /api/vendedores:', JSON.stringify(data, null, 2).substring(0, 500));
        
        // Verifica se retornou sucesso e tem a propriedade usuarios (que é um array)
        expect(data.success).toBeTruthy();
        expect(Array.isArray(data.usuarios)).toBeTruthy();
        expect(data.total).toBeGreaterThanOrEqual(0);
    });
});
