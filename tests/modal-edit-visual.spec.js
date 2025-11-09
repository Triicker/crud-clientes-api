const { test, expect } = require('@playwright/test');

test('Modal de edição só aparece ao clicar e não mistura com header', async ({ page }) => {
  // Login e navegação até detalhes do cliente
  await page.goto('http://localhost:3000/login.html');
  await page.fill('input#email', 'novo@admin.com');
  await page.fill('input#password', 'senha123');
  await page.click('button#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 10000 });

  // Clica no primeiro cliente da lista para ir para detalhes
  await page.waitForSelector('.client-row', { timeout: 10000 });
  await page.click('.client-row');
  await page.waitForURL('**/client-details.html*', { timeout: 10000 });

  // Garante que o modal NÃO está visível inicialmente
  await expect(page.locator('#editModal')).toBeHidden();
  await expect(page.locator('#editModalBody')).toBeHidden();

  // Clica no botão Editar Cliente
  await page.click('.btn-edit');

  // Garante que o modal e o body aparecem
  await expect(page.locator('#editModal')).toBeVisible();
  await expect(page.locator('#editModalBody')).toBeVisible();

  // Garante que o modal NÃO se mistura com o header
  const modalBox = await page.locator('#editModalBody').boundingBox();
  const headerBox = await page.locator('.page-header').boundingBox();
  expect(modalBox.y).toBeGreaterThan(headerBox.y + headerBox.height);

  // Fecha o modal
  await page.click('#closeEditModal');
  await expect(page.locator('#editModal')).toBeHidden();
  await expect(page.locator('#editModalBody')).toBeHidden();
});
