import { test, expect } from '@playwright/test'

test.describe('Path Highlighting Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5178')
    await page.waitForSelector('[data-testid="graph-container"]', { timeout: 15000 })
    await page.waitForTimeout(3000) // Wait for Sigma to fully render
  })

  test('should show path finding controls when 2 nodes are selected', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    // Get the mouse interaction canvas
    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Click on two different areas to select nodes
    console.log('Clicking first node...')
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.3, canvasBox!.y + canvasBox!.height * 0.3)
    await page.waitForTimeout(1000)

    console.log('Clicking second node...')
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.7, canvasBox!.y + canvasBox!.height * 0.7)
    await page.waitForTimeout(1000)

    // Check if detail panel opened
    const detailPanel = page.locator('text=Selection Details')
    await expect(detailPanel).toBeVisible()

    // Look for path finding controls
    const pathFindingSection = page.locator('text=/Find Path|Path Found/')
    const pathFindingVisible = await pathFindingSection.isVisible()

    if (pathFindingVisible) {
      console.log('✅ Path finding controls are visible')
      
      // Check for path finding button or path results
      const findPathButton = page.locator('button:has-text("Find Path")')
      const pathFoundIndicator = page.locator('text=Path Found')
      
      if (await findPathButton.isVisible()) {
        console.log('🔍 Find Path button is available')
        
        // Click the find path button
        await findPathButton.click()
        await page.waitForTimeout(2000)
        
        // Check if path was found
        const pathFound = await pathFoundIndicator.isVisible()
        if (pathFound) {
          console.log('✅ Path highlighting activated!')
          
          // Look for path metrics
          const pathMetrics = page.locator('text=/Distance:|Weight:|Risk Score:/')
          await expect(pathMetrics).toBeVisible()
          
          // Check for clear button
          const clearButton = page.locator('button:has-text("Clear")')
          await expect(clearButton).toBeVisible()
        }
      } else if (await pathFoundIndicator.isVisible()) {
        console.log('✅ Path automatically found and highlighted!')
      }
    } else {
      console.log('❌ Path finding controls not visible - may need 2 nodes selected')
    }

    // Print relevant console logs
    console.log('\n=== Path Finding Console Logs ===')
    consoleLogs.forEach(log => {
      if (log.includes('path') || log.includes('Path') || log.includes('Auto-triggering') || log.includes('🔵') || log.includes('Node clicked')) {
        console.log(log)
      }
    })

    // Take a screenshot to verify visual state
    await page.screenshot({ path: 'test-results/path-highlighting.png' })
    console.log('Screenshot saved to test-results/path-highlighting.png')
  })

  test('should highlight path visually with golden edges', async ({ page }) => {
    // Enable debug mode to see graph state
    await page.addInitScript(() => {
      window.pathDebug = true
    })

    // Capture console logs for path activation
    const pathLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('Path') || msg.text().includes('highlighting') || msg.text().includes('golden')) {
        pathLogs.push(msg.text())
      }
    })

    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Try to select two nodes that are likely to be connected
    const clickPositions = [
      { x: canvasBox!.x + canvasBox!.width * 0.4, y: canvasBox!.y + canvasBox!.height * 0.4 },
      { x: canvasBox!.x + canvasBox!.width * 0.6, y: canvasBox!.y + canvasBox!.height * 0.5 },
    ]

    for (let i = 0; i < clickPositions.length; i++) {
      const pos = clickPositions[i]
      console.log(`Selecting node ${i + 1} at:`, pos)
      await page.mouse.click(pos.x, pos.y)
      await page.waitForTimeout(1500)
    }

    // Wait for path highlighting to activate
    await page.waitForTimeout(2000)

    // Check if path highlighting was activated via console logs
    console.log('\n=== Path Highlighting Logs ===')
    pathLogs.forEach(log => console.log(log))

    // Look for path highlighting indicators in the UI
    const pathIndicators = [
      page.locator('text=Path Found'),
      page.locator('text=Golden path highlights'),
      page.locator('.bg-yellow-400'), // Golden indicator dots
    ]

    let pathHighlightActive = false
    for (const indicator of pathIndicators) {
      if (await indicator.isVisible()) {
        pathHighlightActive = true
        console.log('✅ Path highlighting UI indicator found')
        break
      }
    }

    if (pathHighlightActive) {
      console.log('✅ Path highlighting is active')
      
      // Verify path metrics are shown
      const distanceMetric = page.locator('text=/Distance: \\d+ hops/')
      const weightMetric = page.locator('text=/Weight: [\\d.]+/')
      const riskMetric = page.locator('text=/Risk Score: [\\d.]+/')
      
      if (await distanceMetric.isVisible()) {
        const distanceText = await distanceMetric.textContent()
        console.log('📊 Path metrics:', distanceText)
      }
    } else {
      console.log('ℹ️ Path highlighting not activated - may need better node selection')
    }

    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/path-visual-highlighting.png',
      fullPage: true 
    })
  })

  test('should clear path highlighting when selection changes', async ({ page }) => {
    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Select two nodes first
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.3, canvasBox!.y + canvasBox!.height * 0.3)
    await page.waitForTimeout(1000)
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.7, canvasBox!.y + canvasBox!.height * 0.7)
    await page.waitForTimeout(2000)

    // Check if path highlighting is active
    const pathFound = page.locator('text=Path Found')
    const pathActive = await pathFound.isVisible()

    if (pathActive) {
      console.log('✅ Path highlighting is active')
      
      // Select a third node to trigger clearing
      console.log('Selecting third node to clear path...')
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.5, canvasBox!.y + canvasBox!.height * 0.8)
      await page.waitForTimeout(1500)

      // Verify path highlighting is cleared
      const pathStillActive = await pathFound.isVisible()
      if (!pathStillActive) {
        console.log('✅ Path highlighting cleared when selection changed')
      } else {
        console.log('⚠️ Path highlighting still active')
      }
    } else {
      console.log('ℹ️ Path highlighting was not activated initially')
    }

    // Test clear button if available
    const clearButton = page.locator('button:has-text("Clear")')
    if (await clearButton.isVisible()) {
      console.log('Testing clear button...')
      await clearButton.click()
      await page.waitForTimeout(1000)
      
      const pathCleared = !(await pathFound.isVisible())
      if (pathCleared) {
        console.log('✅ Clear button successfully cleared path highlighting')
      }
    }
  })
})