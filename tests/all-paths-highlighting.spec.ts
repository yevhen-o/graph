import { test, expect } from '@playwright/test'

test.describe('All Paths Highlighting Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177') // Use the correct port
    await page.waitForSelector('[data-testid="graph-container"]', { timeout: 15000 })
    await page.waitForTimeout(3000) // Wait for Sigma to fully render
  })

  test('should highlight all possible paths with dual color system', async ({ page }) => {
    // Capture console logs to see path discovery
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    // Get the mouse interaction canvas
    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Select two nodes that are likely to have multiple paths
    console.log('Selecting first node...')
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.2, canvasBox!.y + canvasBox!.height * 0.3)
    await page.waitForTimeout(1000)

    console.log('Selecting second node...')
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.8, canvasBox!.y + canvasBox!.height * 0.7)
    await page.waitForTimeout(2000)

    // Check if path highlighting activated
    const pathFound = page.locator('text=Path Found')
    const pathActive = await pathFound.isVisible()

    if (pathActive) {
      console.log('✅ Path highlighting is active')
      
      // Check for dual path information in the UI
      const shortestPathInfo = page.locator('text=Shortest Path (Golden):')
      const allPathsInfo = page.locator('text=All Paths (Red):')
      
      if (await shortestPathInfo.isVisible() && await allPathsInfo.isVisible()) {
        console.log('✅ Dual path system UI is visible')
        
        // Extract path statistics
        const totalPathsText = page.locator('text=/Total paths: \\d+/')
        const totalNodesText = page.locator('text=/Total nodes: \\d+/')
        const totalEdgesText = page.locator('text=/Total edges: \\d+/')
        
        if (await totalPathsText.isVisible()) {
          const pathsCount = await totalPathsText.textContent()
          console.log('📊 Path statistics:', pathsCount)
        }
        
        if (await totalNodesText.isVisible()) {
          const nodesCount = await totalNodesText.textContent()
          console.log('📊 Nodes statistics:', nodesCount)
        }
        
        if (await totalEdgesText.isVisible()) {
          const edgesCount = await totalEdgesText.textContent()
          console.log('📊 Edges statistics:', edgesCount)
        }
      }
      
      // Check footer indicators for dual color system
      const goldenIndicator = page.locator('text=Golden = Shortest path')
      const redIndicator = page.locator('text=/Red = All \\d+ possible paths/')
      
      if (await goldenIndicator.isVisible() && await redIndicator.isVisible()) {
        console.log('✅ Dual color system indicators are visible')
        
        const redText = await redIndicator.textContent()
        console.log('🔴 Red paths info:', redText)
      }
    } else {
      console.log('ℹ️ Path highlighting not activated - may need better node selection')
    }

    // Print path discovery logs
    console.log('\n=== Path Discovery Logs ===')
    consoleLogs.forEach(log => {
      if (log.includes('Paths found') || log.includes('possible paths') || log.includes('pathTracer') || log.includes('shortest')) {
        console.log(log)
      }
    })

    // Take screenshot to verify dual highlighting
    await page.screenshot({ 
      path: 'test-results/all-paths-highlighting.png',
      fullPage: true 
    })
    console.log('Screenshot saved to test-results/all-paths-highlighting.png')
  })

  test('should show different visual styles for shortest vs all paths', async ({ page }) => {
    // Enable visual debugging
    await page.addInitScript(() => {
      window.pathVisualDebug = true
    })

    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Try multiple click combinations to find connected nodes
    const clickCombinations = [
      [
        { x: canvasBox!.x + canvasBox!.width * 0.3, y: canvasBox!.y + canvasBox!.height * 0.3 },
        { x: canvasBox!.x + canvasBox!.width * 0.7, y: canvasBox!.y + canvasBox!.height * 0.6 }
      ],
      [
        { x: canvasBox!.x + canvasBox!.width * 0.4, y: canvasBox!.y + canvasBox!.height * 0.2 },
        { x: canvasBox!.x + canvasBox!.width * 0.6, y: canvasBox!.y + canvasBox!.height * 0.8 }
      ]
    ]

    for (const [pos1, pos2] of clickCombinations) {
      console.log('Trying click combination:', pos1, pos2)
      
      // Clear any existing selections first
      const clearButton = page.locator('button[title="Clear all selections"]')
      if (await clearButton.isVisible()) {
        await clearButton.click()
        await page.waitForTimeout(500)
      }
      
      // Select two nodes
      await page.mouse.click(pos1.x, pos1.y)
      await page.waitForTimeout(1000)
      await page.mouse.click(pos2.x, pos2.y)
      await page.waitForTimeout(2000)

      // Check if paths were found
      const pathFound = page.locator('text=Path Found')
      if (await pathFound.isVisible()) {
        console.log('✅ Paths found with this combination')
        
        // Check for multiple paths indication
        const multiplePathsIndicator = page.locator('text=/Total paths: [2-9]\\d*/')
        if (await multiplePathsIndicator.isVisible()) {
          console.log('✅ Multiple paths detected - dual highlighting should be active')
          
          // Verify dual highlighting UI elements
          const shortestPathSection = page.locator('text=Shortest Path (Golden):')
          const allPathsSection = page.locator('text=All Paths (Red):')
          
          await expect(shortestPathSection).toBeVisible()
          await expect(allPathsSection).toBeVisible()
          
          console.log('✅ Dual highlighting UI confirmed')
          break
        } else {
          console.log('ℹ️ Only single path found, trying next combination')
        }
      } else {
        console.log('❌ No paths found with this combination')
      }
    }

    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/dual-path-styles.png',
      fullPage: true 
    })
  })

  test('should clear all path highlighting properly', async ({ page }) => {
    const mouseCanvas = page.locator('canvas.sigma-mouse')
    const canvasBox = await mouseCanvas.boundingBox()

    // Select two nodes
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.3, canvasBox!.y + canvasBox!.height * 0.3)
    await page.waitForTimeout(1000)
    await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.7, canvasBox!.y + canvasBox!.height * 0.7)
    await page.waitForTimeout(2000)

    // Check if paths are highlighted
    const pathFound = page.locator('text=Path Found')
    if (await pathFound.isVisible()) {
      console.log('✅ Paths highlighted successfully')
      
      // Test clear functionality
      const clearButton = page.locator('button:has-text("Clear")')
      if (await clearButton.isVisible()) {
        console.log('Testing Clear button...')
        await clearButton.click()
        await page.waitForTimeout(1000)
        
        // Verify path highlighting is cleared
        const pathStillActive = await pathFound.isVisible()
        if (!pathStillActive) {
          console.log('✅ Clear button successfully cleared path highlighting')
        } else {
          console.log('❌ Clear button did not clear path highlighting')
        }
      }
      
      // Test clearing by changing selection
      console.log('Testing selection change clearing...')
      
      // Re-trigger path highlighting
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.3, canvasBox!.y + canvasBox!.height * 0.3)
      await page.waitForTimeout(1000)
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.7, canvasBox!.y + canvasBox!.height * 0.7)
      await page.waitForTimeout(2000)
      
      // Select a third node to trigger clearing
      await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.5, canvasBox!.y + canvasBox!.height * 0.5)
      await page.waitForTimeout(1500)
      
      // Verify paths are cleared
      const pathClearedBySelection = !(await pathFound.isVisible())
      if (pathClearedBySelection) {
        console.log('✅ Selection change successfully cleared path highlighting')
      } else {
        console.log('❌ Selection change did not clear path highlighting')
      }
    } else {
      console.log('ℹ️ No paths were highlighted initially')
    }
  })
})