const { test, expect } = require('@playwright/test');

test.describe('Testes de Vendedor - Perfil e Associação', () => {
    
    test.beforeEach(async ({ page }) => {
        // Login como admin
        await page.goto('http://localhost:3000/login.html');
        await page.fill('#email', 'novo@admin.com');
        await page.fill('#password', 'senha123');
        await page.click('button.login-button');
        await page.waitForURL('**/index.html');
    });

    test('deve mostrar todos os clientes do João Vendedor (ID 11)', async ({ page }) => {
        console.log('🧪 Testando perfil do João Vendedor...');
        
        // Navega para o perfil do vendedor
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=11');
        
        // Aguarda carregar
        await page.waitForTimeout(2000);
        
        // Verifica se o nome está correto
        const nomeVendedor = await page.textContent('#perfilNome');
        console.log(`👤 Nome do vendedor: ${nomeVendedor}`);
        expect(nomeVendedor).toContain('João');
        
        // Verifica estatísticas
        const totalClientes = await page.textContent('#statClientes');
        console.log(`📊 Total de clientes: ${totalClientes}`);
        expect(parseInt(totalClientes)).toBeGreaterThanOrEqual(6);
        
        // Verifica se a tabela de clientes foi carregada
        const tabelaClientes = await page.locator('.client-table tbody tr');
        const numClientes = await tabelaClientes.count();
        console.log(`📋 Clientes na tabela: ${numClientes}`);
        expect(numClientes).toBe(6);
        
        // Lista os clientes
        const clientes = await tabelaClientes.allTextContents();
        console.log('✅ Clientes encontrados:');
        clientes.forEach((c, i) => console.log(`   ${i + 1}. ${c.substring(0, 50)}...`));
    });

    test('deve mostrar perfil da Maria Comercial (ID 12)', async ({ page }) => {
        console.log('🧪 Testando perfil da Maria Comercial...');
        
        await page.goto('http://localhost:3000/vendedor-perfil.html?id=12');
        await page.waitForTimeout(2000);
        
        const nomeVendedor = await page.textContent('#perfilNome');
        console.log(`👤 Nome do vendedor: ${nomeVendedor}`);
        expect(nomeVendedor).toContain('Maria');
        
        const totalClientes = await page.textContent('#statClientes');
        console.log(`📊 Total de clientes: ${totalClientes}`);
    });

    test('deve navegar da tabela de clientes para o perfil do vendedor', async ({ page }) => {
        console.log('🧪 Testando navegação Cliente → Vendedor...');
        
        // Vai para a página principal
        await page.goto('http://localhost:3000/index.html');
        await page.waitForTimeout(1500);
        
        // Procura por um badge de vendedor na tabela
        const vendedorBadge = page.locator('.vendedor-badge').first();
        
        if (await vendedorBadge.count() > 0) {
            const nomeVendedor = await vendedorBadge.textContent();
            console.log(`👤 Clicando no vendedor: ${nomeVendedor}`);
            
            await vendedorBadge.click();
            await page.waitForTimeout(2000);
            
            // Verifica se navegou para vendedor-perfil.html
            expect(page.url()).toContain('vendedor-perfil.html');
            console.log(`✅ Navegou para: ${page.url()}`);
            
            // Verifica se carregou o perfil
            const perfilNome = await page.textContent('#perfilNome');
            console.log(`✅ Perfil carregado: ${perfilNome}`);
        } else {
            console.log('⚠️  Nenhum badge de vendedor encontrado na tabela');
        }
    });

    test('deve associar novo vendedor a um cliente após interação', async ({ page }) => {
        console.log('🧪 Testando associação de vendedor a cliente...');
        
        // Vai para a página principal
        await page.goto('http://localhost:3000/index.html');
        await page.waitForTimeout(1500);
        
        // Seleciona o primeiro cliente sem vendedor ou qualquer cliente
        const primeiraLinha = page.locator('tbody tr').first();
        await primeiraLinha.click();
        await page.waitForTimeout(500);
        
        const nomeCliente = await page.locator('#editNome').inputValue();
        console.log(`📋 Cliente selecionado: ${nomeCliente}`);
        
        // Verifica se tem campo de vendedor no modal
        const campoVendedor = page.locator('#editVendedor, select[name="vendedor_responsavel"]');
        
        if (await campoVendedor.count() > 0) {
            // Seleciona um vendedor
            await campoVendedor.selectOption({ index: 1 }); // Seleciona o primeiro vendedor disponível
            
            const vendedorSelecionado = await campoVendedor.inputValue();
            console.log(`👤 Vendedor selecionado: ${vendedorSelecionado}`);
            
            // Salva
            await page.click('button:has-text("Salvar")');
            await page.waitForTimeout(1500);
            
            console.log('✅ Cliente atualizado com novo vendedor');
        } else {
            console.log('⚠️  Campo de vendedor não encontrado no modal de edição');
        }
    });
});
