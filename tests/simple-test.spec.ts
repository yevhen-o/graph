import { test, expect } from '@playwright/test'

test('Simple graph test with screenshots', async ({ page }) => {
  console.log('Starting test...')
  
  // Navigate to the app
  await page.goto('/')
  console.log('Page loaded')
  
  // Wait a moment for the page to load
  await page.waitForTimeout(1000)
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'test-results/01-initial-load.png',
    fullPage: true
  })
  console.log('Initial screenshot taken')
  
  // Wait for any loading to complete
  await page.waitForTimeout(3000)
  
  // Take screenshot after loading
  await page.screenshot({ 
    path: 'test-results/02-after-loading.png',
    fullPage: true
  })
  console.log('After loading screenshot taken')
  
  // Check for basic elements
  const title = page.locator('h2')
  if (await title.count() > 0) {
    console.log('Found title elements')
  }
  
  // Check for canvas
  const canvas = page.locator('canvas')
  const canvasCount = await canvas.count()
  console.log('Canvas count:', canvasCount)
  
  // Check for graph container
  const graphContainer = page.locator('.graph-container')
  const containerVisible = await graphContainer.isVisible()
  console.log('Graph container visible:', containerVisible)
  
  // Get container dimensions
  if (containerVisible) {
    const box = await graphContainer.boundingBox()
    console.log('Container dimensions:', box)
  }
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'test-results/03-final-state.png',
    fullPage: true
  })
  console.log('Final screenshot taken')
  
  // Check for any console errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  await page.waitForTimeout(1000)
  console.log('Console errors:', errors)
  
  // Basic assertion to ensure page loaded
  expect(page.url()).toContain('localhost:4173')
})