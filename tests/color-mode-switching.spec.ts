import { test, expect } from '@playwright/test';

test.describe('Color Mode Switching', () => {
  test('should switch color modes correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5175');
    
    // Wait for the graph to load
    await page.waitForSelector('[data-testid="left-panel-content"]', { timeout: 10000 });
    
    // Load automotive dataset which has risk scores
    const datasetSelect = await page.locator('select').first();
    await datasetSelect.selectOption({ label: 'Realistic Automotive Supply Chain' });
    
    // Wait for dataset to load
    await page.waitForTimeout(2000);
    
    // Scroll to color mode section
    const colorModeSection = await page.locator('[data-testid="color-mode-section"]');
    await colorModeSection.scrollIntoViewIfNeeded();
    
    // Get initial button states
    const nodeTypeButton = await page.locator('[data-testid="color-mode-node-type"]');
    const riskScoreButton = await page.locator('[data-testid="color-mode-risk-score"]');
    
    // Check initial state (should be nodeType)
    const initialNodeTypeClasses = await nodeTypeButton.getAttribute('class');
    const initialRiskScoreClasses = await riskScoreButton.getAttribute('class');
    
    console.log('Initial state:');
    console.log('Node Type button classes:', initialNodeTypeClasses);
    console.log('Risk Score button classes:', initialRiskScoreClasses);
    
    // Node Type button should be active (blue)
    expect(initialNodeTypeClasses).toContain('bg-blue-600');
    expect(initialRiskScoreClasses).toContain('bg-gray-600');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'color-mode-initial.png', fullPage: true });
    
    // Click Risk Score button
    console.log('\nClicking Risk Score button...');
    await riskScoreButton.click();
    
    // Wait for the change
    await page.waitForTimeout(1000);
    
    // Check state after clicking risk score
    const afterRiskNodeTypeClasses = await nodeTypeButton.getAttribute('class');
    const afterRiskRiskScoreClasses = await riskScoreButton.getAttribute('class');
    
    console.log('\nAfter clicking Risk Score:');
    console.log('Node Type button classes:', afterRiskNodeTypeClasses);
    console.log('Risk Score button classes:', afterRiskRiskScoreClasses);
    
    // Risk Score button should now be active (red)
    expect(afterRiskNodeTypeClasses).toContain('bg-gray-600');
    expect(afterRiskRiskScoreClasses).toContain('bg-red-600');
    
    // Check if risk score legend is visible
    const riskLegend = await page.locator('text=Risk Score Legend').isVisible();
    expect(riskLegend).toBe(true);
    
    // Take screenshot after switching to risk score
    await page.screenshot({ path: 'color-mode-risk-score.png', fullPage: true });
    
    // Click Node Type button to switch back
    console.log('\nClicking Node Type button...');
    await nodeTypeButton.click();
    
    // Wait for the change
    await page.waitForTimeout(1000);
    
    // Check final state
    const finalNodeTypeClasses = await nodeTypeButton.getAttribute('class');
    const finalRiskScoreClasses = await riskScoreButton.getAttribute('class');
    
    console.log('\nAfter clicking Node Type:');
    console.log('Node Type button classes:', finalNodeTypeClasses);
    console.log('Risk Score button classes:', finalRiskScoreClasses);
    
    // Should be back to initial state
    expect(finalNodeTypeClasses).toContain('bg-blue-600');
    expect(finalRiskScoreClasses).toContain('bg-gray-600');
    
    // Risk legend should be hidden
    const riskLegendFinal = await page.locator('text=Risk Score Legend').isVisible();
    expect(riskLegendFinal).toBe(false);
    
    // Take final screenshot
    await page.screenshot({ path: 'color-mode-final.png', fullPage: true });
    
    // Check the actual graph canvas to see if colors changed
    const canvas = await page.locator('canvas').first();
    
    // Get canvas data for comparison
    const canvasScreenshot1 = await canvas.screenshot({ path: 'canvas-node-type.png' });
    
    // Switch to risk score mode
    await riskScoreButton.click();
    await page.waitForTimeout(1000);
    
    const canvasScreenshot2 = await canvas.screenshot({ path: 'canvas-risk-score.png' });
    
    console.log('\nScreenshots saved for visual comparison');
    console.log('Check canvas-node-type.png vs canvas-risk-score.png to see color differences');
  });
});