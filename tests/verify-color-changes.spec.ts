import { test, expect } from '@playwright/test';

test.describe('Verify Color Changes', () => {
  test('should change node colors when switching modes', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5175');
    
    // Wait for the graph to load
    await page.waitForSelector('[data-testid="left-panel-content"]', { timeout: 10000 });
    
    // Load automotive dataset which has risk scores
    const datasetSelect = await page.locator('select').first();
    await datasetSelect.selectOption({ label: 'Realistic Automotive Supply Chain' });
    
    // Wait for dataset to load
    await page.waitForTimeout(3000);
    
    // Scroll to color mode section
    const colorModeSection = await page.locator('[data-testid="color-mode-section"]');
    await colorModeSection.scrollIntoViewIfNeeded();
    
    // Get the canvas element
    const canvas = await page.locator('canvas').first();
    
    // Function to get color at specific point
    const getCanvasColorAtPoint = async (x: number, y: number) => {
      return await page.evaluate(([canvasSelector, xPos, yPos]) => {
        const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        const imageData = ctx.getImageData(xPos, yPos, 1, 1);
        const data = imageData.data;
        
        return {
          r: data[0],
          g: data[1],
          b: data[2],
          a: data[3],
          hex: '#' + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)
        };
      }, ['canvas', x, y]);
    };
    
    // Get canvas center for sampling
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    const centerX = Math.floor(canvasBox.width / 2);
    const centerY = Math.floor(canvasBox.height / 2);
    
    // Sample multiple points in node type mode
    console.log('\nSampling colors in Node Type mode:');
    const nodeTypeColors = [];
    for (let i = 0; i < 5; i++) {
      const x = centerX + (i - 2) * 50;
      const y = centerY + (i - 2) * 50;
      const color = await getCanvasColorAtPoint(x, y);
      if (color && color.a > 0) {
        nodeTypeColors.push(color);
        console.log(`Point ${i}: ${color.hex} (R:${color.r} G:${color.g} B:${color.b})`);
      }
    }
    
    // Switch to risk score mode
    const riskScoreButton = await page.locator('[data-testid="color-mode-risk-score"]');
    await riskScoreButton.click();
    
    // Wait for the change and re-render
    await page.waitForTimeout(2000);
    
    // Sample the same points in risk score mode
    console.log('\nSampling colors in Risk Score mode:');
    const riskScoreColors = [];
    for (let i = 0; i < 5; i++) {
      const x = centerX + (i - 2) * 50;
      const y = centerY + (i - 2) * 50;
      const color = await getCanvasColorAtPoint(x, y);
      if (color && color.a > 0) {
        riskScoreColors.push(color);
        console.log(`Point ${i}: ${color.hex} (R:${color.r} G:${color.g} B:${color.b})`);
      }
    }
    
    // Verify that colors changed
    let colorChanges = 0;
    for (let i = 0; i < Math.min(nodeTypeColors.length, riskScoreColors.length); i++) {
      if (nodeTypeColors[i].hex !== riskScoreColors[i].hex) {
        colorChanges++;
        console.log(`\nColor changed at point ${i}:`);
        console.log(`  Node Type: ${nodeTypeColors[i].hex}`);
        console.log(`  Risk Score: ${riskScoreColors[i].hex}`);
      }
    }
    
    console.log(`\nTotal color changes detected: ${colorChanges} out of ${Math.min(nodeTypeColors.length, riskScoreColors.length)} sampled points`);
    
    // Expect at least some colors to have changed
    expect(colorChanges).toBeGreaterThan(0);
    
    // Check if risk colors follow green-to-red gradient pattern
    const hasGreenishColors = riskScoreColors.some(c => c.g > c.r && c.g > c.b);
    const hasReddishColors = riskScoreColors.some(c => c.r > c.g && c.r > c.b);
    const hasYellowishColors = riskScoreColors.some(c => c.r > 100 && c.g > 100 && c.b < 100);
    
    console.log('\nRisk score color analysis:');
    console.log('Has greenish colors (low risk):', hasGreenishColors);
    console.log('Has reddish colors (high risk):', hasReddishColors);
    console.log('Has yellowish colors (medium risk):', hasYellowishColors);
    
    // For risk score mode, we should have a gradient from green to red
    expect(hasGreenishColors || hasReddishColors || hasYellowishColors).toBe(true);
  });
});