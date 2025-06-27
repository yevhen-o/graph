import { test, expect } from '@playwright/test'

test('detailed edge debugging', async ({ page }) => {
  // Capture ALL console logs
  const consoleLogs: string[] = []
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`)
  })

  await page.goto('http://localhost:5177')
  await page.waitForSelector('[data-testid="graph-container"]', { timeout: 15000 })
  await page.waitForTimeout(4000) // Wait longer for full initialization

  // Print all console logs to see what's happening
  console.log('\n=== ALL CONSOLE LOGS ===')
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}: ${log}`)
  })

  // Filter for important logs
  console.log('\n=== GRAPH INITIALIZATION LOGS ===')
  consoleLogs.forEach(log => {
    if (log.includes('Initializing Sigma') || 
        log.includes('Created Graphology') || 
        log.includes('Nodes:') || 
        log.includes('Edges:') ||
        log.includes('Edge list:') ||
        log.includes('edge attributes:')) {
      console.log(log)
    }
  })

  // Check if there are any error logs
  console.log('\n=== ERROR LOGS ===')
  const errorLogs = consoleLogs.filter(log => log.includes('error:') || log.includes('Error'))
  if (errorLogs.length > 0) {
    errorLogs.forEach(log => console.log(log))
  } else {
    console.log('No error logs found')
  }

  // Take a screenshot for visual inspection
  await page.screenshot({ 
    path: 'test-results/graph-state.png',
    fullPage: true 
  })

  console.log('Screenshot saved to test-results/graph-state.png')
})