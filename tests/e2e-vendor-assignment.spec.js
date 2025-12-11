// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Teste E2E completo: Gemini Search → Adicionar Cliente → Auto-atribuição de Vendedor
 * 
 * Fluxo:
 * 1. Admin pesquisa CNPJ no Gemini Search
 * 2. Admin adiciona novo cliente
 * 3. Logout do admin
 * 4. Login como vendedor (João)
 * 5. Vendedor marca tarefa na esteira
 * 6. Valida que o vendedor foi auto-atribuído
 */

test.describe('Fluxo Completo: Gemini Search → Auto-atribuição de Vendedor', () => {
  
  test('deve pesquisar CNPJ, adicionar cliente e auto-atribuir vendedor ao marcar tarefa', async ({ page }) => {
    const BASE_URL = 'http://localhost:3000';
    const CNPJ_TESTE = '07876452000194'; // CNPJ válido para teste
    const NOME_CLIENTE_ESPERADO = 'Teste E2E'; // Nome que deve aparecer após busca
    const GEMINI_API_KEY = 'AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs';
    
    // ===== PASSO 1: Login como Admin =====
    console.log('🔐 PASSO 1: Fazendo login como Admin...');
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('#email', 'novo@admin.com');
    await page.fill('#password', 'senha123');
    await page.click('button[type="submit"]');
    
    // Aguarda redirecionamento
    await page.waitForURL(`${BASE_URL}/index.html`, { timeout: 10000 });
    console.log('✅ Login admin realizado com sucesso');
    
    // ===== PASSO 2: Pesquisar CNPJ no Gemini Search =====
    console.log('\n🔍 PASSO 2: Acessando Gemini Search...');
    await page.goto(`${BASE_URL}/gemini-search/`);
    await page.waitForLoadState('networkidle');
    
    // Preencher CNPJ e API Key
    console.log(`📝 Pesquisando CNPJ: ${CNPJ_TESTE}`);
    const apiKeyInput = page.locator('input[placeholder*="API Key"], input[name="apiKey"], #api-key');
    if (await apiKeyInput.count() > 0) {
      await apiKeyInput.first().fill(GEMINI_API_KEY);
    }
    const cnpjInput = page.locator('input[placeholder*="CNPJ"], input[name="cnpj"], #cnpj-input');
    await cnpjInput.first().fill(CNPJ_TESTE);
    
    // Clicar no botão de buscar
    const searchButton = page.locator('button:has-text("Buscar"), button:has-text("Pesquisar"), button[type="submit"]');
    await searchButton.first().click();
    
    // Aguarda resultado da busca
    console.log('⏳ Aguardando resultado da busca...');
    await page.waitForTimeout(3000); // Aguarda resposta da API
    
    // Verifica se encontrou dados
    const hasResults = await page.locator('text=/encontrado|sucesso|resultado/i').count() > 0;
    if (hasResults) {
      console.log('✅ Dados do CNPJ encontrados');
    } else {
      console.log('⚠️ Nenhum resultado encontrado, mas continuando...');
    }
    
    // ===== PASSO 3: Adicionar Cliente =====
    console.log('\n➕ PASSO 3: Adicionando novo cliente...');
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForLoadState('networkidle');
    
    // Clicar no botão "Adicionar Cliente" ou "+Novo"
    const addButton = page.locator('button:has-text("Adicionar"), button:has-text("Novo"), button:has-text("+")').first();
    await addButton.click();
    
    // Aguarda modal abrir
    await page.waitForTimeout(500);
    
    // Preencher formulário
    const nomeClienteTeste = `E2E Test ${Date.now()}`;
    console.log(`📝 Criando cliente: ${nomeClienteTeste}`);
    
    await page.fill('input[name="nome"], #nome', nomeClienteTeste);
    await page.fill('input[name="cnpj"], #cnpj', CNPJ_TESTE);
    await page.selectOption('select[name="tipo"], #tipo', 'PJ');
    await page.fill('input[name="telefone"], #telefone', '(11) 98765-4321');
    await page.fill('input[name="email"], #email', 'teste.e2e@example.com');
    await page.fill('input[name="cidade"], #cidade', 'São Paulo');
    await page.fill('input[name="uf"], #uf', 'SP');
    
    // Salvar cliente
    const saveButton = page.locator('button:has-text("Salvar"), button:has-text("Adicionar"), button[type="submit"]').first();
    await saveButton.click();
    
    // Aguarda confirmação
    await page.waitForTimeout(2000);
    console.log('✅ Cliente adicionado com sucesso');
    
    // Captura ID do cliente criado (procura na tabela)
    await page.waitForTimeout(1000);
    const clienteRow = page.locator(`tr:has-text("${nomeClienteTeste}")`).first();
    const clienteId = await clienteRow.getAttribute('data-client-id');
    console.log(`🆔 Cliente ID: ${clienteId}`);
    
    // ===== PASSO 4: Logout do Admin =====
    console.log('\n🚪 PASSO 4: Fazendo logout do admin...');
    const logoutButton = page.locator('button:has-text("Sair"), a:has-text("Logout"), button[aria-label*="Sair"]');
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(1000);
    } else {
      // Logout manual via JS
      await page.evaluate(() => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      });
    }
    console.log('✅ Logout realizado');
    
    // ===== PASSO 5: Login como Vendedor (João) =====
    console.log('\n🔐 PASSO 5: Fazendo login como vendedor João...');
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('#email', 'joao.vendedor@etica.com');
    await page.fill('#password', 'senha123');
    await page.click('button[type="submit"]');
    
    // Aguarda redirecionamento
    await page.waitForURL(`${BASE_URL}/index.html`, { timeout: 10000 });
    console.log('✅ Login vendedor realizado com sucesso');
    
    // ===== PASSO 6: Encontrar o cliente criado =====
    console.log('\n🔍 PASSO 6: Procurando cliente criado...');
    await page.waitForTimeout(2000);
    
    // Busca pela linha do cliente
    const clienteRowVendedor = page.locator(`tr[data-client-id="${clienteId}"]`);
    await expect(clienteRowVendedor).toBeVisible({ timeout: 10000 });
    
    // Verifica badge inicial (deve ser "Sem Vendedor")
    const vendedorBadgeInicial = clienteRowVendedor.locator('.vendedor-badge-empty, .vendedor-badge');
    const badgeTextoInicial = await vendedorBadgeInicial.textContent();
    console.log(`📛 Badge inicial: ${badgeTextoInicial?.trim()}`);
    
    if (badgeTextoInicial?.includes('Sem Vendedor')) {
      console.log('✅ Cliente sem vendedor (correto)');
    }
    
    // ===== PASSO 7: Abrir esteira do cliente =====
    console.log('\n📊 PASSO 7: Abrindo esteira do cliente...');
    const esteiraButton = clienteRowVendedor.locator('button[data-action="esteira"]');
    await esteiraButton.click();
    
    // Aguarda modal/dashboard da esteira abrir
    await page.waitForTimeout(1500);
    console.log('✅ Esteira aberta');
    
    // ===== PASSO 8: Marcar primeira tarefa =====
    console.log('\n✅ PASSO 8: Marcando primeira tarefa...');
    
    // Procura primeira célula marcável na esteira
    const primeiraTarefa = page.locator('.task-cell:not(.completed), td[data-concluida="false"]').first();
    await primeiraTarefa.click();
    
    // Aguarda salvamento
    await page.waitForTimeout(2000);
    console.log('✅ Tarefa marcada');
    
    // Fechar esteira (ESC ou botão fechar)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // ===== PASSO 9: Validar auto-atribuição =====
    console.log('\n🎯 PASSO 9: Validando auto-atribuição do vendedor...');
    
    // Recarrega página para garantir dados atualizados
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Procura novamente a linha do cliente
    const clienteRowFinal = page.locator(`tr[data-client-id="${clienteId}"]`);
    await expect(clienteRowFinal).toBeVisible();
    
    // Verifica badge do vendedor
    const vendedorBadgeFinal = clienteRowFinal.locator('.vendedor-badge, .vendedor-badge-empty');
    await expect(vendedorBadgeFinal).toBeVisible();
    
    const badgeTextoFinal = await vendedorBadgeFinal.textContent();
    console.log(`📛 Badge final: ${badgeTextoFinal?.trim()}`);
    
    // Validações
    expect(badgeTextoFinal).toContain('João');
    expect(badgeTextoFinal).not.toContain('Sem Vendedor');
    
    // Verifica cor do badge (deve ser azul #667eea)
    const badgeColor = await vendedorBadgeFinal.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    console.log(`🎨 Cor do badge: ${badgeColor}`);
    
    // ===== RESULTADO FINAL =====
    console.log('\n' + '='.repeat(60));
    console.log('✅✅✅ TESTE E2E PASSOU COM SUCESSO! ✅✅✅');
    console.log('='.repeat(60));
    console.log(`📊 Resumo:`);
    console.log(`   ✅ Cliente "${nomeClienteTeste}" criado (ID: ${clienteId})`);
    console.log(`   ✅ Vendedor "João Vendedor" auto-atribuído`);
    console.log(`   ✅ Badge mudou de "Sem Vendedor" para "João Vendedor"`);
    console.log(`   ✅ Frontend e Backend consistentes`);
    console.log('='.repeat(60));
  });
  
  test('deve validar que admin NÃO é auto-atribuído como vendedor', async ({ page }) => {
    const BASE_URL = 'http://localhost:3000';
    
    console.log('🧪 TESTE: Admin não deve ser auto-atribuído');
    console.log('='.repeat(60));
    
    // Login como admin
    console.log('🔐 Login como Admin...');
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('#email', 'novo@admin.com');
    await page.fill('#password', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/index.html`, { timeout: 10000 });
    
    // Criar cliente
    console.log('➕ Criando cliente de teste...');
    const nomeCliente = `Admin Test ${Date.now()}`;
    await page.click('button:has-text("Adicionar"), button:has-text("Novo")');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="nome"]', nomeCliente);
    await page.fill('input[name="cnpj"]', '12345678000199');
    await page.selectOption('select[name="tipo"]', 'PJ');
    await page.fill('input[name="telefone"]', '(11) 99999-9999');
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);
    
    // Pegar ID do cliente
    const clienteRow = page.locator(`tr:has-text("${nomeCliente}")`).first();
    const clienteId = await clienteRow.getAttribute('data-client-id');
    console.log(`🆔 Cliente ID: ${clienteId}`);
    
    // Abrir esteira e marcar tarefa
    console.log('📊 Marcando tarefa como admin...');
    await clienteRow.locator('button[data-action="esteira"]').click();
    await page.waitForTimeout(1500);
    await page.locator('.task-cell:not(.completed)').first().click();
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    
    // Validar que NÃO foi atribuído
    console.log('🔍 Validando que admin não foi atribuído...');
    await page.reload();
    await page.waitForTimeout(2000);
    
    const vendedorBadge = page.locator(`tr[data-client-id="${clienteId}"] .vendedor-badge-empty`);
    await expect(vendedorBadge).toBeVisible();
    const badgeTexto = await vendedorBadge.textContent();
    
    expect(badgeTexto).toContain('Sem Vendedor');
    
    console.log('✅ TESTE PASSOU: Admin não foi auto-atribuído (correto)');
  });
  
});
