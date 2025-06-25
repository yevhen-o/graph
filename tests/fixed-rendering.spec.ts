import { test, expect } from '@playwright/test'

test('Test Fixed Graph Rendering', async ({ page }) => {
  console.log('Testing fixed graph rendering...')
  
  // Enable console logging
  const consoleMessages: string[] = []
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`)
  })
  
  // Navigate to the app
  await page.goto('/')
  
  // Wait for initial load
  await page.waitForTimeout(2000)
  
  // Take screenshot of initial state
  await page.screenshot({ 
    path: 'test-results/fixed-01-initial.png',
    fullPage: true
  })
  
  // Wait longer for graph initialization and simulation
  await page.waitForTimeout(5000)
  
  // Take screenshot after graph should be initialized
  await page.screenshot({ 
    path: 'test-results/fixed-02-after-init.png',
    fullPage: true
  })
  
  // Check for canvas and verify it has content
  const canvasData = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) return { found: false }
    
    // Get canvas image data to check if anything is drawn
    const ctx = canvas.getContext('2d')
    if (!ctx) return { found: true, hasContent: false, error: 'No 2D context' }
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Check if canvas has any non-black pixels
    let hasContent = false
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      
      // If we find any non-transparent pixel that's not black
      if (a > 0 && (r > 0 || g > 0 || b > 0)) {
        hasContent = true
        break
      }
    }
    
    return {
      found: true,
      hasContent,
      dimensions: { width: canvas.width, height: canvas.height },
      clientDimensions: { width: canvas.clientWidth, height: canvas.clientHeight }
    }
  })
  
  console.log('Canvas data:', JSON.stringify(canvasData, null, 2))
  
  // Test the Zoom to Fit button
  const zoomButton = page.getByText('Zoom to Fit')
  if (await zoomButton.isVisible()) {
    console.log('Clicking Zoom to Fit')
    await zoomButton.click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ 
      path: 'test-results/fixed-03-after-zoom.png',
      fullPage: true
    })
  }
  
  // Test the regenerate button
  const regenerateButton = page.getByText('Regenerate Graph')
  if (await regenerateButton.isVisible()) {
    console.log('Clicking Regenerate Graph')
    await regenerateButton.click()
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: 'test-results/fixed-04-after-regenerate.png',
      fullPage: true
    })
  }
  
  // Print all console messages for debugging
  console.log('All console messages:')
  consoleMessages.forEach((msg, i) => {
    console.log(`${i + 1}: ${msg}`)
  })
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'test-results/fixed-05-final.png',
    fullPage: true
  })
  
  // Check basic functionality
  expect(canvasData.found).toBe(true)
  
  // The test passes if we can see the UI elements properly
  await expect(page.getByText('Supply Chain Graph')).toBeVisible()
  await expect(page.getByText('Graph Statistics')).toBeVisible()
})