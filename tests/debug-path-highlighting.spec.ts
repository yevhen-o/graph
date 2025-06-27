import { test, expect } from '@playwright/test'

test('debug path highlighting edge visualization', async ({ page }) => {
  // Capture ALL console logs
  const consoleLogs: string[] = []
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`)
  })

  await page.goto('http://localhost:5173')
  await page.waitForSelector('[data-testid="graph-container"]', { timeout: 15000 })
  await page.waitForTimeout(3000)

  const mouseCanvas = page.locator('canvas.sigma-mouse')
  const canvasBox = await mouseCanvas.boundingBox()

  console.log('Selecting first node...')
  await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.3, canvasBox!.y + canvasBox!.height * 0.3)
  await page.waitForTimeout(1500)

  console.log('Selecting second node...')
  await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.7, canvasBox!.y + canvasBox!.height * 0.7)
  await page.waitForTimeout(3000) // Wait longer for path processing

  // Print ALL logs to see what's happening
  console.log('\n=== ALL CONSOLE LOGS ===')
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}: ${log}`)
  })

  // Filter for path-related logs
  console.log('\n=== PATH HIGHLIGHTING LOGS ===')
  consoleLogs.forEach(log => {
    if (log.includes('Paths found') || log.includes('Edge') || log.includes('🔍') || log.includes('🟡') || log.includes('🔴') || log.includes('🟠')) {
      console.log(log)
    }
  })

  // Take screenshot
  await page.screenshot({ 
    path: 'test-results/debug-path-highlighting.png',
    fullPage: true 
  })
  
  console.log('Debug complete - check console logs above')
})