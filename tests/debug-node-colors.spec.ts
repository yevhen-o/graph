import { test } from '@playwright/test';

test('debug node colors', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('company_0') || text.includes('with colors:')) {
      console.log(text);
    }
  });
  
  await page.goto('http://localhost:5175');
  await page.waitForTimeout(2000);
  
  // Load automotive dataset
  const datasetSelect = await page.locator('select').first();
  await datasetSelect.selectOption({ label: 'Realistic Automotive Supply Chain' });
  await page.waitForTimeout(2000);
  
  // Switch to risk score mode
  const colorModeSection = await page.locator('[data-testid="color-mode-section"]');
  await colorModeSection.scrollIntoViewIfNeeded();
  const riskScoreButton = await page.locator('[data-testid="color-mode-risk-score"]');
  await riskScoreButton.click();
  await page.waitForTimeout(1000);
});