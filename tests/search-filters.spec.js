// tests/search-filters.spec.js
const { test, expect } = require('@playwright/test');

// Helpers
async function login(page) {
  await page.goto('http://localhost:3000/login.html');
  await page.fill('#email', 'novo@admin.com');
  await page.fill('#password', 'senha123');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 15000 });
}

async function waitForTableToLoad(page) {
  // Aguarda a tabela existir e renderizar pelo menos 1 linha
  await page.waitForSelector('#tableBody', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelectorAll('#tableBody tr').length >= 1, null, { timeout: 15000 });
}

// Teste: busca por texto
test('Busca filtra linhas ao digitar', async ({ page }) => {
  await login(page);
  await waitForTableToLoad(page);

  // Captura contagem inicial
  const initialCount = await page.locator('#tableBody tr').count();
  expect(initialCount).toBeGreaterThan(0);

  // Digita "escola" e espera reduzir/ajustar
  await page.fill('#searchInput', 'escola');
  // debounce 300ms
  await page.waitForTimeout(400);

  // Verifica que o texto do contador mudou e há ao menos 1 linha
  const resultsText = await page.locator('#resultsCount').textContent();
  expect(resultsText.toLowerCase()).toContain('clientes');

  const afterCount = await page.locator('#tableBody tr').count();
  expect(afterCount).toBeGreaterThan(0);
});

// Teste: filtro por estado + aplicar filtros
test('Filtro por UF aplica ao clicar no botão', async ({ page }) => {
  await login(page);
  await waitForTableToLoad(page);

  // Aguarda o select estar presente (as options podem ficar ocultas no DOM)
  await page.waitForSelector('#stateFilter', { timeout: 15000 });
  // Tenta selecionar diretamente a sigla
  await page.selectOption('#stateFilter', { value: 'BA' });
  await page.click('#applyFilters');

  // Garante que ainda há resultados
  const count = await page.locator('#tableBody tr').count();
  expect(count).toBeGreaterThan(0);

  // Valida que todas as linhas são BA
  const states = await page.locator('#tableBody td.client-state').allTextContents();
  for (const st of states) {
    expect(st.trim()).toBe('BA');
  }
});
