import { test, expect } from '@playwright/test'

test('Test Sigma.js Graph Rendering', async ({ page }) => {
  console.log('Testing Sigma.js graph rendering...')
  
  // Enable console logging
  const consoleMessages: string[] = []
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`)
  })
  
  // Navigate to the app (should show Sigma.js by default)
  await page.goto('/')
  
  // Wait for initial load
  await page.waitForTimeout(2000)
  
  // Take screenshot of initial state (should be Sigma.js)
  await page.screenshot({ 
    path: 'test-results/sigma-01-initial.png',
    fullPage: true
  })
  
  // Wait for graph to load
  await page.waitForTimeout(3000)
  
  // Take screenshot after graph should be loaded
  await page.screenshot({ 
    path: 'test-results/sigma-02-loaded.png',
    fullPage: true
  })
  
  // Check for canvas elements (Sigma.js creates multiple canvases)
  const canvasCount = await page.locator('canvas').count()
  console.log('Canvas count:', canvasCount)
  
  // Test switching to Cosmos Graph
  const switchButton = page.locator('text=Switch to Cosmos Graph')
  if (await switchButton.isVisible()) {
    console.log('Switching to Cosmos Graph')
    await switchButton.click()
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: 'test-results/sigma-03-switched-to-cosmos.png',
      fullPage: true
    })
    
    // Switch back to Sigma
    const switchBackButton = page.locator('text=Switch to Sigma.js')
    if (await switchBackButton.isVisible()) {
      console.log('Switching back to Sigma.js')
      await switchBackButton.click()
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: 'test-results/sigma-04-back-to-sigma.png',
        fullPage: true
      })
    }
  }
  
  // Test graph controls
  const zoomButton = page.getByText('Zoom to Fit')
  if (await zoomButton.isVisible()) {
    console.log('Testing Zoom to Fit')
    await zoomButton.click()
    await page.waitForTimeout(1000)
    
    await page.screenshot({ 
      path: 'test-results/sigma-05-after-zoom.png',
      fullPage: true
    })
  }
  
  // Test regenerate
  const regenerateButton = page.getByText('Regenerate Graph')
  if (await regenerateButton.isVisible()) {
    console.log('Testing Regenerate Graph')
    await regenerateButton.click()
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: 'test-results/sigma-06-after-regenerate.png',
      fullPage: true
    })
  }
  
  // Print console messages
  console.log('All console messages:')
  consoleMessages.forEach((msg, i) => {
    console.log(`${i + 1}: ${msg}`)
  })
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'test-results/sigma-07-final.png',
    fullPage: true
  })
  
  // Check that we have at least one canvas (Sigma creates multiple)
  expect(canvasCount).toBeGreaterThan(0)
  
  // Check basic UI elements
  await expect(page.getByText('Supply Chain Graph')).toBeVisible()
  await expect(page.getByText('Graph Statistics')).toBeVisible()
})