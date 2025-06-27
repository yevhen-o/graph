import { test } from '@playwright/test';

test('debug color mode', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  // Navigate to the app
  await page.goto('http://localhost:5175');
  
  // Wait for app to load
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved as debug-screenshot.png');
});