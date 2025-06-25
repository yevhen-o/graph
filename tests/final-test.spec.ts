import { test, expect } from '@playwright/test'

test('Final Graph Rendering Test', async ({ page }) => {
  console.log('Testing final graph rendering fixes...')
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`)
  })
  
  // Navigate to the app and switch to Cosmos
  await page.goto('/')
  await page.waitForTimeout(1000)
  
  // Switch to Cosmos Graph
  const switchButton = page.locator('text=Switch to Cosmos Graph')
  if (await switchButton.isVisible()) {
    await switchButton.click()
    console.log('Switched to Cosmos Graph')
  }
  
  // Wait for graph initialization
  await page.waitForTimeout(5000)
  
  // Take screenshot of the result
  await page.screenshot({ 
    path: 'test-results/final-cosmos-render.png',
    fullPage: true
  })
  
  // Test zoom to fit
  const zoomButton = page.getByText('Zoom to Fit')
  if (await zoomButton.isVisible()) {
    await zoomButton.click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ 
      path: 'test-results/final-after-zoom.png',
      fullPage: true
    })
  }
  
  // Check canvas exists
  const canvasCount = await page.locator('canvas').count()
  console.log('Canvas count:', canvasCount)
  
  expect(canvasCount).toBeGreaterThan(0)
})