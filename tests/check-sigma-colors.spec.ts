import { test } from '@playwright/test';

test('check sigma node colors', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}]:`, msg.text());
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
  
  // Scroll to color mode section
  const colorModeSection = await page.locator('[data-testid="color-mode-section"]');
  await colorModeSection.scrollIntoViewIfNeeded();
  
  // Click Risk Score button
  console.log('\n=== Switching to Risk Score mode ===');
  const riskScoreButton = await page.locator('[data-testid="color-mode-risk-score"]');
  await riskScoreButton.click();
  
  // Wait for the change
  await page.waitForTimeout(2000);
  
  // Try to inspect Sigma's graph data
  const graphInfo = await page.evaluate(() => {
    // Try to find Sigma instance
    const container = document.querySelector('.graph-container');
    if (!container) return { error: 'No graph container found' };
    
    // Get all canvas elements
    const canvases = container.querySelectorAll('canvas');
    
    return {
      canvasCount: canvases.length,
      containerClasses: container.className,
      // Try to access window.sigma if exposed
      sigmaExists: typeof (window as any).sigma !== 'undefined'
    };
  });
  
  console.log('\nGraph info:', graphInfo);
  
  // Take screenshot
  await page.screenshot({ path: 'sigma-risk-colors.png', fullPage: true });
  console.log('Screenshot saved as sigma-risk-colors.png');
});