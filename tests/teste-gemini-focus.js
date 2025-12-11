/**
 * Teste focado APENAS na busca do Gemini
 * Para debug e verificação de funcionamento da API
 */

const { chromium } = require('@playwright/test');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  geminiApiKey: 'AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs',
  searchParams: {
    uf: 'BA',
    cidade: 'Salvador',
    tipo: 'Escola Pública Municipal'
  }
};

(async () => {
  console.log('🔍 TESTE FOCADO: BUSCA GEMINI AI');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capturar console logs
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[CONSOLE ${type.toUpperCase()}]: ${msg.text()}`);
    }
  });
  
  // Capturar erros de rede
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[NETWORK ERROR]: ${response.status()} - ${response.url()}`);
    }
  });
  
  try {
    // Ir para a página de busca
    console.log('\n📍 Navegando para página de busca...');
    await page.goto(`${CONFIG.baseUrl}/gemini-search/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Configurar API Key
    console.log('🔑 Configurando API Key...');
    const apiKeyInput = page.locator('#api-key-input');
    await apiKeyInput.fill(CONFIG.geminiApiKey);
    await page.click('button:has-text("Salvar e Continuar")');
    await page.waitForTimeout(2000);
    
    // Selecionar aba Leads
    console.log('📋 Selecionando aba de Leads...');
    await page.click('button:has-text("Busca por Contatos (Leads)")');
    await page.waitForTimeout(1000);
    
    // Preencher formulário
    console.log(`🗺️ Selecionando UF: ${CONFIG.searchParams.uf}...`);
    await page.selectOption('#estado-lead-select', { value: CONFIG.searchParams.uf });
    await page.waitForTimeout(3000); // Aguardar cidades carregarem
    
    console.log(`🏙️ Selecionando cidade: ${CONFIG.searchParams.cidade}...`);
    await page.selectOption('#cidade-select', { label: CONFIG.searchParams.cidade });
    await page.waitForTimeout(1000);
    
    console.log(`🏫 Selecionando tipo: ${CONFIG.searchParams.tipo}...`);
    await page.selectOption('#tipo-entidade-select', { label: CONFIG.searchParams.tipo });
    await page.waitForTimeout(1000);
    
    // Screenshot antes de buscar
    await page.screenshot({ path: 'busca-antes.png' });
    console.log('\n📸 Screenshot salvo: busca-antes.png');
    
    // Iniciar busca
    console.log('\n🚀 Iniciando busca Gemini...');
    console.log('⏳ Aguardando resposta (pode demorar até 120s)...\n');
    
    const startTime = Date.now();
    await page.click('button:has-text("Gerar Lista")');
    
    // Aguardar com verificações periódicas
    let found = false;
    for (let i = 0; i < 40; i++) { // 40 x 3s = 120s
      await page.waitForTimeout(3000);
      
      const rows = await page.locator('table tbody tr').count();
      const error = await page.locator('[role="alert"]:has-text("Erro")').count();
      const loading = await page.locator('text="Buscando..."').count();
      
      console.log(`   [${i * 3}s] Linhas: ${rows}, Erro: ${error}, Loading: ${loading}`);
      
      if (rows > 0) {
        found = true;
        console.log(`\n✅ RESULTADOS ENCONTRADOS EM ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        break;
      }
      
      if (error > 0) {
        console.log('\n❌ ERRO NA BUSCA:');
        const errorText = await page.locator('[role="alert"]').textContent();
        console.log(errorText);
        break;
      }
      
      if (loading === 0 && rows === 0) {
        // Verificar se existe mensagem de erro
        const pageContent = await page.content();
        if (pageContent.includes('erro') || pageContent.includes('Erro')) {
          console.log('\n⚠️ Possível erro na página');
        }
      }
    }
    
    // Screenshot depois
    await page.screenshot({ path: 'busca-depois.png', fullPage: true });
    console.log('\n📸 Screenshot salvo: busca-depois.png');
    
    // Verificar resultados
    const finalRows = await page.locator('table tbody tr').count();
    console.log(`\n📊 Total de resultados: ${finalRows}`);
    
    if (finalRows > 0) {
      // Mostrar primeiro resultado
      const primeiraLinha = page.locator('table tbody tr').first();
      const texto = await primeiraLinha.textContent();
      console.log(`\n📝 Primeiro resultado: ${texto?.substring(0, 200)}...`);
    }
    
    // Aguardar para visualização
    console.log('\n⏳ Aguardando 10s para visualização...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: 'busca-erro.png', fullPage: true });
    console.log('📸 Screenshot do erro salvo: busca-erro.png');
  } finally {
    await browser.close();
    console.log('\n🏁 Teste finalizado!');
  }
})();
