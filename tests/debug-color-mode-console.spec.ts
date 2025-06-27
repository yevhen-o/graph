import { test } from '@playwright/test';

test('debug color mode console logs', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('color mode') || text.includes('Node company') || text.includes('Node supplier')) {
      consoleLogs.push(text);
      console.log('CONSOLE:', text);
    }
  });
  
  // Navigate to the app
  await page.goto('http://localhost:5175');
  
  // Wait for initial load
  await page.waitForTimeout(2000);
  
  // Load automotive dataset
  const datasetSelect = await page.locator('select').first();
  await datasetSelect.selectOption({ label: 'Realistic Automotive Supply Chain' });
  
  // Wait for dataset to load
  await page.waitForTimeout(2000);
  
  console.log('\n=== Initial load logs ===');
  consoleLogs.forEach(log => console.log(log));
  
  // Clear logs for next phase
  consoleLogs.length = 0;
  
  // Scroll to color mode section
  const colorModeSection = await page.locator('[data-testid="color-mode-section"]');
  await colorModeSection.scrollIntoViewIfNeeded();
  
  // Click Risk Score button
  console.log('\n=== Switching to Risk Score mode ===');
  const riskScoreButton = await page.locator('[data-testid="color-mode-risk-score"]');
  await riskScoreButton.click();
  
  // Wait for the change
  await page.waitForTimeout(2000);
  
  console.log('\n=== After switching to Risk Score ===');
  consoleLogs.forEach(log => console.log(log));
  
  // Clear logs again
  consoleLogs.length = 0;
  
  // Switch back to Node Type
  console.log('\n=== Switching back to Node Type mode ===');
  const nodeTypeButton = await page.locator('[data-testid="color-mode-node-type"]');
  await nodeTypeButton.click();
  
  // Wait for the change
  await page.waitForTimeout(2000);
  
  console.log('\n=== After switching back to Node Type ===');
  consoleLogs.forEach(log => console.log(log));
});