import { test, expect } from '@playwright/test'

test('Test Fixed Sigma.js Graph', async ({ page }) => {
  console.log('Testing fixed Sigma.js implementation...')
  
  // Enable console logging
  const consoleMessages: string[] = []
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    if (msg.type() === 'error') {
      console.log(`ERROR: ${msg.text()}`)
    } else {
      console.log(`${msg.type()}: ${msg.text()}`)
    }
  })
  
  // Navigate to the app (should show Sigma.js by default)
  await page.goto('/')
  
  // Wait for initial load
  await page.waitForTimeout(3000)
  
  // Take screenshot of Sigma.js graph
  await page.screenshot({ 
    path: 'test-results/sigma-fixed-01.png',
    fullPage: true
  })
  
  // Test switching to Cosmos Graph
  const switchButton = page.locator('text=Switch to Cosmos Graph')
  if (await switchButton.isVisible()) {
    console.log('Switching to Cosmos Graph')
    await switchButton.click()
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: 'test-results/sigma-fixed-02-cosmos.png',
      fullPage: true
    })
    
    // Switch back to Sigma
    const switchBackButton = page.locator('text=Switch to Sigma.js')
    if (await switchBackButton.isVisible()) {
      console.log('Switching back to Sigma.js')
      await switchBackButton.click()
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: 'test-results/sigma-fixed-03-back-to-sigma.png',
        fullPage: true
      })
    }
  }
  
  // Count canvas elements
  const canvasCount = await page.locator('canvas').count()
  console.log('Canvas count:', canvasCount)
  
  // Check for errors
  const errorMessages = consoleMessages.filter(msg => msg.includes('error:'))
  console.log('Error count:', errorMessages.length)
  
  if (errorMessages.length > 0) {
    console.log('Errors found:')
    errorMessages.forEach(error => console.log(error))
  }
  
  // The test should pass if we have at least one canvas and no duplicate edge errors
  expect(canvasCount).toBeGreaterThan(0)
  
  // Check that we don't have the duplicate edge error
  const hasDuplicateEdgeError = errorMessages.some(msg => 
    msg.includes('already exists') || msg.includes('UsageGraphError')
  )
  expect(hasDuplicateEdgeError).toBe(false)
})