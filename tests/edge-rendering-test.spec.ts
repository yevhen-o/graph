import { test, expect } from '@playwright/test'

test.describe('Edge Rendering and Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177')
    await page.waitForSelector('[data-testid="graph-container"]', { timeout: 15000 })
    await page.waitForTimeout(3000) // Wait for Sigma to fully render
  })

  test('edges are visually rendered on canvas', async ({ page }) => {
    // Check that all Sigma canvas layers are present
    const canvases = page.locator('canvas')
    await expect(canvases).toHaveCount(7)

    // Specifically check that the edges canvas exists and has content
    const edgesCanvas = page.locator('canvas.sigma-edges')
    await expect(edgesCanvas).toBeVisible()

    // Take a screenshot to verify edges are visible
    await page.screenshot({ path: 'test-results/edges-rendered.png' })

    // Check if edges canvas has reasonable dimensions
    const edgesCanvasBox = await edgesCanvas.boundingBox()
    expect(edgesCanvasBox).toBeTruthy()
    expect(edgesCanvasBox!.width).toBeGreaterThan(100)
    expect(edgesCanvasBox!.height).toBeGreaterThan(100)

    console.log('Edges canvas dimensions:', edgesCanvasBox)
  })

  test('graph statistics show edge count', async ({ page }) => {
    // Look for graph statistics that should show edge count
    const statsText = page.locator('text=/\\d+ edge/')
    const edgeCountVisible = await statsText.isVisible()
    
    if (edgeCountVisible) {
      const edgeText = await statsText.textContent()
      console.log('Edge count displayed:', edgeText)
      
      // Extract number from text like "257 edges"
      const edgeCount = parseInt(edgeText?.match(/(\d+)\s+edge/)?.[1] || '0')
      expect(edgeCount).toBeGreaterThan(0)
      console.log(`✅ Graph shows ${edgeCount} edges`)
    } else {
      console.log('❌ No edge count visible in UI')
    }
  })

  test('edge selection end-to-end workflow', async ({ page }) => {
    // Capture console logs to monitor edge events
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    // Get the mouse interaction canvas
    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Try clicking in a grid pattern to find edges
    const gridSize = 5
    let edgeFound = false
    let clickCount = 0

    for (let x = 1; x < gridSize; x++) {
      for (let y = 1; y < gridSize; y++) {
        if (edgeFound) break

        const clickX = canvasBox!.x + (canvasBox!.width * x) / gridSize
        const clickY = canvasBox!.y + (canvasBox!.height * y) / gridSize
        
        clickCount++
        console.log(`Click ${clickCount}: (${clickX.toFixed(0)}, ${clickY.toFixed(0)})`)
        
        await page.mouse.click(clickX, clickY)
        await page.waitForTimeout(500)

        // Check if edge was selected
        const edgeText = page.locator('text=/\\d+ edge/')
        const toggleButton = page.locator('button[title*="selected item"]')
        
        if (await edgeText.isVisible() || await toggleButton.isVisible()) {
          console.log('✅ Edge selected!')
          edgeFound = true
          
          // Check if detail panel appears
          if (await toggleButton.isVisible()) {
            await toggleButton.click()
            await page.waitForTimeout(500)
          }
          
          // Verify edge appears in detail panel
          const detailPanel = page.locator('text=Selection Details')
          await expect(detailPanel).toBeVisible()
          
          // Look for edge icon or edge-specific text
          const edgeIcon = page.locator('text=🔗')
          const edgeInPanel = await edgeIcon.isVisible()
          
          if (edgeInPanel) {
            console.log('✅ Edge appears in detail panel')
          } else {
            console.log('❌ Edge not visible in detail panel')
          }
          
          break
        }
      }
    }

    // Print relevant console logs
    console.log('\n=== Relevant Console Logs ===')
    consoleLogs.forEach(log => {
      if (log.includes('edge') || log.includes('Edge') || log.includes('🔗') || log.includes('clicked')) {
        console.log(log)
      }
    })

    if (!edgeFound) {
      console.log(`❌ No edges found after ${clickCount} clicks`)
      
      // Check if any nodes were found instead
      const nodeClicks = consoleLogs.filter(log => log.includes('Node clicked') || log.includes('🔵'))
      if (nodeClicks.length > 0) {
        console.log('✅ But nodes are being detected:', nodeClicks.length)
      }
    }
  })

  test('manual edge hover test', async ({ page }) => {
    // Listen for edge hover events specifically
    const edgeHovers: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('Edge hover') || msg.text().includes('🔗')) {
        edgeHovers.push(msg.text())
      }
    })

    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Move mouse slowly across the canvas to trigger edge hovers
    const startX = canvasBox!.x + 50
    const startY = canvasBox!.y + 50
    const endX = canvasBox!.x + canvasBox!.width - 50
    const endY = canvasBox!.y + canvasBox!.height - 50

    // Move mouse in diagonal line
    await page.mouse.move(startX, startY)
    await page.mouse.move(endX, endY, { steps: 20 })
    await page.waitForTimeout(1000)

    // Move mouse in horizontal line
    await page.mouse.move(startX, canvasBox!.y + canvasBox!.height / 2)
    await page.mouse.move(endX, canvasBox!.y + canvasBox!.height / 2, { steps: 20 })
    await page.waitForTimeout(1000)

    console.log('Edge hover events detected:', edgeHovers.length)
    edgeHovers.forEach(hover => console.log(hover))

    if (edgeHovers.length > 0) {
      console.log('✅ Edge hover events are working')
    } else {
      console.log('❌ No edge hover events detected')
    }
  })

  test('check sigma instance and graph data', async ({ page }) => {
    // Execute JavaScript to check Sigma instance and graph state
    const graphInfo = await page.evaluate(() => {
      // Check if there's a global reference to Sigma or if we can find it in the DOM
      const container = document.querySelector('[data-testid="graph-container"]')
      
      return {
        containerExists: !!container,
        canvasCount: document.querySelectorAll('canvas').length,
        edgesCanvasExists: !!document.querySelector('canvas.sigma-edges'),
        nodesCanvasExists: !!document.querySelector('canvas.sigma-nodes'),
        mouseCanvasExists: !!document.querySelector('canvas.sigma-mouse')
      }
    })

    console.log('Graph info:', graphInfo)
    
    expect(graphInfo.containerExists).toBeTruthy()
    expect(graphInfo.canvasCount).toBe(7)
    expect(graphInfo.edgesCanvasExists).toBeTruthy()
    expect(graphInfo.nodesCanvasExists).toBeTruthy()
    expect(graphInfo.mouseCanvasExists).toBeTruthy()
  })
})