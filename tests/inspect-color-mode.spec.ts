import { test, expect } from '@playwright/test';

test.describe('Color Mode Switch Inspection', () => {
  test('should inspect left panel and color mode section', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5175');
    
    // Wait for the graph to load
    await page.waitForSelector('[data-testid="left-panel-content"]', { timeout: 10000 });
    
    // Check if left panel is visible
    const leftPanel = await page.locator('[data-testid="left-panel-content"]');
    const isLeftPanelVisible = await leftPanel.isVisible();
    console.log('Left panel visible:', isLeftPanelVisible);
    
    // Check if controls section exists
    const controlsSection = await page.locator('[data-testid="controls-section"]');
    const isControlsVisible = await controlsSection.isVisible();
    console.log('Controls section visible:', isControlsVisible);
    
    // Check if color mode section exists
    const colorModeSection = await page.locator('[data-testid="color-mode-section"]');
    const colorModeSectionExists = await colorModeSection.count() > 0;
    const isColorModeVisible = colorModeSectionExists && await colorModeSection.isVisible();
    console.log('Color mode section exists:', colorModeSectionExists);
    console.log('Color mode section visible:', isColorModeVisible);
    
    // Try to scroll the left panel to find color mode section
    if (!isColorModeVisible && isLeftPanelVisible) {
      console.log('Trying to scroll to find color mode section...');
      await leftPanel.scrollIntoViewIfNeeded();
      
      // Scroll down in the left panel
      await leftPanel.evaluate((element) => {
        element.scrollTop = element.scrollHeight / 2;
      });
      
      // Check again after scrolling
      const isVisibleAfterScroll = await colorModeSection.isVisible().catch(() => false);
      console.log('Color mode section visible after scroll:', isVisibleAfterScroll);
    }
    
    // Get all sections in the left panel
    const sections = await page.locator('[data-testid="left-panel-content"] > div').all();
    console.log(`\nFound ${sections.length} sections in left panel:`);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const heading = await section.locator('h3').textContent().catch(() => 'No heading');
      const testId = await section.getAttribute('data-testid');
      console.log(`Section ${i + 1}: ${heading} (test-id: ${testId || 'none'})`);
    }
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'color-mode-debug.png', fullPage: true });
    console.log('\nScreenshot saved as color-mode-debug.png');
    
    // Log the presence of handleColorModeChange prop
    const hasColorModeHandler = await page.evaluate(() => {
      // This will check if the component has the necessary props
      const root = document.querySelector('#root');
      console.log('Root element:', root);
      return true;
    });
    
    // Try to find color mode buttons even if section is not visible
    const colorModeButtons = await page.locator('[data-testid="color-mode-buttons"]').count();
    console.log('\nColor mode buttons found:', colorModeButtons);
    
    const nodeTypeButton = await page.locator('[data-testid="color-mode-node-type"]').count();
    const riskScoreButton = await page.locator('[data-testid="color-mode-risk-score"]').count();
    console.log('Node Type button found:', nodeTypeButton > 0);
    console.log('Risk Score button found:', riskScoreButton > 0);
  });
});