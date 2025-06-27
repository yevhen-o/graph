import { test, expect } from '@playwright/test'

test('debug edge selection', async ({ page }) => {
  // Capture all console logs
  const consoleLogs: string[] = []
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`)
  })

  await page.goto('http://localhost:5177')
  
  // Wait for the graph to be fully loaded
  await page.waitForSelector('[data-testid="graph-container"]', { timeout: 15000 })
  await page.waitForTimeout(3000)
  
  // Check that Sigma rendered
  const canvases = page.locator('canvas')
  await expect(canvases).toHaveCount(7)
  
  // Use the mouse interaction canvas
  const mouseCanvas = page.locator('canvas.sigma-mouse')
  const canvasBox = await mouseCanvas.boundingBox()
  
  console.log('Canvas dimensions:', canvasBox)
  
  // Try clicking in many areas to hit an edge
  const clickPositions = [
    { x: canvasBox!.x + canvasBox!.width * 0.25, y: canvasBox!.y + canvasBox!.height * 0.25 },
    { x: canvasBox!.x + canvasBox!.width * 0.75, y: canvasBox!.y + canvasBox!.height * 0.75 },
    { x: canvasBox!.x + canvasBox!.width * 0.4, y: canvasBox!.y + canvasBox!.height * 0.6 },
    { x: canvasBox!.x + canvasBox!.width * 0.6, y: canvasBox!.y + canvasBox!.height * 0.4 },
    { x: canvasBox!.x + canvasBox!.width * 0.5, y: canvasBox!.y + canvasBox!.height * 0.3 },
    { x: canvasBox!.x + canvasBox!.width * 0.3, y: canvasBox!.y + canvasBox!.height * 0.7 },
    { x: canvasBox!.x + canvasBox!.width * 0.7, y: canvasBox!.y + canvasBox!.height * 0.3 },
    { x: canvasBox!.x + canvasBox!.width * 0.3, y: canvasBox!.y + canvasBox!.height * 0.5 }
  ]
  
  for (let i = 0; i < clickPositions.length; i++) {
    const pos = clickPositions[i]
    console.log(`Clicking position ${i + 1}:`, pos)
    
    await page.mouse.click(pos.x, pos.y)
    await page.waitForTimeout(1000)
    
    // Check if selection panel appeared
    const toggleButton = page.locator('button[title*="selected item"]')
    const detailPanel = page.locator('text=Selection Details')
    
    if (await toggleButton.isVisible() || await detailPanel.isVisible()) {
      console.log(`✅ Something selected at position ${i + 1}!`)
      
      // Check for edge text specifically
      const edgeText = page.locator('text=/\\d+ edge/')
      if (await edgeText.isVisible()) {
        console.log(`🔗 Edge detected in selection!`)
        break
      }
    }
  }
  
  // Print all console logs for debugging
  console.log('\\n=== Console Logs ===')
  consoleLogs.forEach(log => {
    if (log.includes('🔗') || log.includes('Edge') || log.includes('edge') || log.includes('clicked')) {
      console.log(log)
    }
  })
  
  // Wait a bit more to capture any delayed logs
  await page.waitForTimeout(2000)
})