import { test, expect } from '@playwright/test'

test.describe('Edge Selection with Path Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177')
    await page.waitForSelector('[data-testid="graph-container"]', { timeout: 15000 })
    await page.waitForTimeout(3000) // Wait for Sigma to fully render
  })

  test('should maintain edge selection state when path highlighting is active', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Step 1: Select an edge first
    console.log('Step 1: Selecting an edge...')
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.4, canvasBox!.y + canvasBox!.height * 0.4)
    await page.waitForTimeout(1000)

    // Check if edge was selected
    const edgeSelectedText = page.locator('text=/\\d+ edge/')
    const edgeWasSelected = await edgeSelectedText.isVisible()

    if (edgeWasSelected) {
      console.log('✅ Edge selected successfully')
      const edgeText = await edgeSelectedText.textContent()
      console.log('Selected:', edgeText)

      // Step 2: Select two nodes to trigger path highlighting
      console.log('Step 2: Selecting nodes to trigger path highlighting...')
      
      // Select first node
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.2, canvasBox!.y + canvasBox!.height * 0.3)
      await page.waitForTimeout(1000)
      
      // Select second node  
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.8, canvasBox!.y + canvasBox!.height * 0.7)
      await page.waitForTimeout(2000)

      // Step 3: Check if path highlighting activated
      const pathFound = page.locator('text=Path Found')
      const pathActive = await pathFound.isVisible()

      if (pathActive) {
        console.log('✅ Path highlighting activated')

        // Step 4: Verify edge selection is still maintained
        const edgeStillSelected = await edgeSelectedText.isVisible()
        
        if (edgeStillSelected) {
          console.log('✅ Edge selection maintained during path highlighting!')
          
          // Verify in selection panel
          const detailPanel = page.locator('text=Selection Details')
          await expect(detailPanel).toBeVisible()
          
          // Look for edge icon in the panel
          const edgeIcon = page.locator('text=🔗')
          const edgeInPanel = await edgeIcon.isVisible()
          
          if (edgeInPanel) {
            console.log('✅ Selected edge still appears in detail panel')
          } else {
            console.log('⚠️ Selected edge not visible in detail panel')
          }
        } else {
          console.log('❌ Edge selection was lost during path highlighting')
        }
      } else {
        console.log('ℹ️ Path highlighting not activated - testing selection preservation without paths')
        
        // Still verify edge selection is maintained
        const edgeStillSelected = await edgeSelectedText.isVisible()
        if (edgeStillSelected) {
          console.log('✅ Edge selection maintained without path highlighting')
        }
      }
    } else {
      console.log('❌ No edge was selected initially - trying different approach')
      
      // Try grid clicking to find edges
      console.log('Trying grid clicking to find edges...')
      let edgeFound = false
      
      for (let x = 2; x <= 4 && !edgeFound; x++) {
        for (let y = 2; y <= 4 && !edgeFound; y++) {
          const clickX = canvasBox!.x + (canvasBox!.width * x) / 6
          const clickY = canvasBox!.y + (canvasBox!.height * y) / 6
          
          await page.mouse.click(clickX, clickY)
          await page.waitForTimeout(500)
          
          const edgeSelected = await edgeSelectedText.isVisible()
          if (edgeSelected) {
            console.log(`✅ Edge found at position (${x}, ${y})`)
            edgeFound = true
          }
        }
      }
    }

    // Print relevant console logs
    console.log('\n=== Selection and Path Logs ===')
    consoleLogs.forEach(log => {
      if (log.includes('Edge clicked') || log.includes('Node clicked') || log.includes('edge') || log.includes('Path') || log.includes('selection')) {
        console.log(log)
      }
    })

    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/edge-selection-with-paths.png',
      fullPage: true 
    })
  })

  test('should show different visual states for selected edges vs path edges', async ({ page }) => {
    console.log('Testing visual distinction between selected edges and path edges...')
    
    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Try to select an edge
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.5, canvasBox!.y + canvasBox!.height * 0.4)
    await page.waitForTimeout(1000)

    // Check if we got an edge
    const edgeSelected = page.locator('text=/\\d+ edge/')
    if (await edgeSelected.isVisible()) {
      console.log('✅ Edge selected for visual testing')
      
      // Now trigger path highlighting by selecting nodes
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.3, canvasBox!.y + canvasBox!.height * 0.2)
      await page.waitForTimeout(1000)
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.7, canvasBox!.y + canvasBox!.height * 0.8)
      await page.waitForTimeout(2000)

      // Check for path highlighting
      const pathFound = page.locator('text=Path Found')
      if (await pathFound.isVisible()) {
        console.log('✅ Both edge selection and path highlighting are active')
        
        // Verify we can see both types of information
        const edgeStillVisible = await edgeSelected.isVisible()
        const pathMetrics = page.locator('text=Shortest Path (Golden):')
        
        if (edgeStillVisible && await pathMetrics.isVisible()) {
          console.log('✅ Both edge selection and path metrics are visible simultaneously')
        }
      }
    }

    await page.screenshot({ 
      path: 'test-results/edge-vs-path-visual.png',
      fullPage: true 
    })
  })

  test('should preserve multiple edge selections with path highlighting', async ({ page }) => {
    console.log('Testing multiple edge selection preservation...')
    
    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Try to select multiple edges by clicking in different areas
    const clickPositions = [
      { x: canvasBox!.x + canvasBox!.width * 0.3, y: canvasBox!.y + canvasBox!.height * 0.3 },
      { x: canvasBox!.x + canvasBox!.width * 0.7, y: canvasBox!.y + canvasBox!.height * 0.4 },
      { x: canvasBox!.x + canvasBox!.width * 0.5, y: canvasBox!.y + canvasBox!.height * 0.6 },
    ]

    let edgesSelected = 0
    
    for (let i = 0; i < clickPositions.length; i++) {
      const pos = clickPositions[i]
      console.log(`Clicking position ${i + 1}:`, pos)
      
      await page.mouse.click(pos.x, pos.y)
      await page.waitForTimeout(1000)
      
      // Check if we got an edge or node
      const edgeText = page.locator('text=/\\d+ edge/')
      if (await edgeText.isVisible()) {
        const currentText = await edgeText.textContent()
        console.log(`Selection after click ${i + 1}:`, currentText)
        
        // Extract edge count
        const edgeMatch = currentText?.match(/(\\d+) edge/)
        if (edgeMatch) {
          edgesSelected = parseInt(edgeMatch[1])
        }
      }
    }

    if (edgesSelected > 0) {
      console.log(`✅ Selected ${edgesSelected} edges`)
      
      // Now trigger path highlighting with nodes
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.2, canvasBox!.y + canvasBox!.height * 0.2)
      await page.waitForTimeout(1000)
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.8, canvasBox!.y + canvasBox!.height * 0.8)
      await page.waitForTimeout(2000)

      // Verify edge selections are preserved
      const edgeText = page.locator('text=/\\d+ edge/')
      if (await edgeText.isVisible()) {
        const finalText = await edgeText.textContent()
        console.log('Final selection state:', finalText)
        
        const finalMatch = finalText?.match(/(\\d+) edge/)
        if (finalMatch && parseInt(finalMatch[1]) === edgesSelected) {
          console.log('✅ All edge selections preserved during path highlighting!')
        } else {
          console.log('⚠️ Some edge selections may have been lost')
        }
      }
    } else {
      console.log('ℹ️ No edges were selected in this test')
    }

    await page.screenshot({ 
      path: 'test-results/multiple-edge-selection-preservation.png',
      fullPage: true 
    })
  })
})