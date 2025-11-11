const { test, expect } = require('@playwright/test');

test.describe('Edição de Cliente na Página Principal', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/vanilla-version/login.html');
    await page.fill('input#email', 'novo@admin.com');
    await page.fill('input#password', 'senha123');
    await page.click('button#loginBtn');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    
    // Aguarda carregamento da tabela
    await page.waitForSelector('.client-row', { timeout: 10000 });
  });

  test('Deve abrir modal de edição ao clicar no botão view e depois em editar', async ({ page }) => {
    // Clica no botão de visualizar do primeiro cliente
    await page.click('.client-row .view-btn');
    
    // Aguarda modal de detalhes aparecer
    await expect(page.locator('#clientModal')).toBeVisible({ timeout: 5000 });
    
    // Clica no botão Editar dentro do modal de detalhes
    await page.click('#editClient');
    
    // Aguarda modal de edição aparecer
    await expect(page.locator('#editModal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#editModalBody')).toBeVisible({ timeout: 5000 });
  });

  test('Deve editar cliente com sucesso', async ({ page }) => {
    // Clica no botão de visualizar do primeiro cliente
    await page.click('.client-row .view-btn');
    
    // Aguarda modal de detalhes
    await expect(page.locator('#clientModal')).toBeVisible({ timeout: 5000 });
    
    // Clica em Editar
    await page.click('#editClient');
    
    // Aguarda modal de edição
    await expect(page.locator('#editModal')).toBeVisible({ timeout: 5000 });
    
    // Preenche o formulário com novos dados
    await page.fill('#editName', 'Cliente Teste Editado');
    await page.fill('#editPhone', '(11) 98888-7777');
    
    // Clica em Salvar
    await page.click('#saveChanges');
    
    // Aguarda toast de sucesso
    await expect(page.locator('.toast.success')).toBeVisible({ timeout: 5000 });
    
    // Aguarda modal fechar
    await page.waitForTimeout(1000);
    
    // Verifica se a tabela foi atualizada
    await expect(page.locator('.client-row').first()).toContainText('Cliente Teste Editado');
  });

  test('Deve cancelar edição ao clicar em cancelar', async ({ page }) => {
    // Clica no botão de visualizar
    await page.click('.client-row .view-btn');
    
    // Aguarda modal de detalhes
    await expect(page.locator('#clientModal')).toBeVisible({ timeout: 5000 });
    
    // Clica em Editar
    await page.click('#editClient');
    
    // Aguarda modal de edição
    await expect(page.locator('#editModal')).toBeVisible({ timeout: 5000 });
    
    // Modifica campo
    const originalName = await page.inputValue('#editName');
    await page.fill('#editName', 'Nome Temporário');
    
    // Clica em Cancelar
    await page.click('#cancelEdit');
    
    // Modal deve fechar
    await expect(page.locator('#editModal')).toBeHidden({ timeout: 5000 });
    
    // Abre novamente para verificar que não salvou
    await page.click('#editClient');
    await expect(page.locator('#editModal')).toBeVisible({ timeout: 5000 });
    
    // Verifica que o nome original foi mantido
    const currentName = await page.inputValue('#editName');
    expect(currentName).toBe(originalName);
  });

  test('Deve validar campos obrigatórios', async ({ page }) => {
    // Clica no botão de visualizar
    await page.click('.client-row .view-btn');
    
    // Aguarda modal de detalhes
    await expect(page.locator('#clientModal')).toBeVisible({ timeout: 5000 });
    
    // Clica em Editar
    await page.click('#editClient');
    
    // Aguarda modal de edição
    await expect(page.locator('#editModal')).toBeVisible({ timeout: 5000 });
    
    // Limpa campo obrigatório
    await page.fill('#editName', '');
    
    // Tenta salvar
    await page.click('#saveChanges');
    
    // Deve mostrar mensagem de erro (toast ou validação HTML5)
    const isInvalid = await page.evaluate(() => {
      const input = document.getElementById('editName');
      return !input.validity.valid;
    });
    
    expect(isInvalid).toBe(true);
  });
});
