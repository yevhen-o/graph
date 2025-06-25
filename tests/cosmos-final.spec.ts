import { test, expect } from '@playwright/test'

test('Final Cosmos Graph Test', async ({ page }) => {
  console.log('Testing final Cosmos Graph...')
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`${msg.type()}: ${msg.text()}`)
  })
  
  // Navigate and switch to Cosmos
  await page.goto('/')
  await page.waitForTimeout(1000)
  
  const switchButton = page.locator('text=Switch to Cosmos Graph')
  if (await switchButton.isVisible()) {
    await switchButton.click()
    console.log('Switched to Cosmos Graph')
  }
  
  // Wait for graph to load
  await page.waitForTimeout(5000)
  
  // Take screenshot
  await page.screenshot({ 
    path: 'test-results/cosmos-final.png',
    fullPage: true
  })
  
  // Test regenerate a few times to see different layouts
  for (let i = 0; i < 3; i++) {
    const regenerateButton = page.getByText('Regenerate Graph')
    if (await regenerateButton.isVisible()) {
      await regenerateButton.click()
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: `test-results/cosmos-regenerate-${i + 1}.png`,
        fullPage: true
      })
    }
  }
  
  // Test zoom to fit
  const zoomButton = page.getByText('Zoom to Fit')
  if (await zoomButton.isVisible()) {
    await zoomButton.click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ 
      path: 'test-results/cosmos-zoom-fit.png',
      fullPage: true
    })
  }
  
  // Check canvas exists
  const canvasCount = await page.locator('canvas').count()
  console.log('Canvas count:', canvasCount)
  
  expect(canvasCount).toBeGreaterThan(0)
})