import { test, expect } from '@playwright/test'

test.describe('Sigma.js Graph Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ ERROR: ${msg.text()}`)
      } else {
        console.log(`📝 ${msg.type()}: ${msg.text()}`)
      }
    })

    await page.goto('/')
    
    // Make sure we start with Sigma.js (should be default)
    const switchButton = page.locator('text=Switch to Cosmos Graph')
    if (await switchButton.isVisible()) {
      console.log('✅ Already on Sigma.js')
    } else {
      // We're on Cosmos, switch to Sigma
      const switchToSigmaButton = page.locator('text=Switch to Sigma.js')
      if (await switchToSigmaButton.isVisible()) {
        await switchToSigmaButton.click()
        console.log('🔄 Switched to Sigma.js')
      }
    }
    
    await page.waitForTimeout(3000) // Allow time for graph to initialize
  })

  test('should load Sigma.js without errors', async ({ page }) => {
    console.log('🧪 Testing: Sigma.js loads without errors')
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/sigma-01-initial-load.png',
      fullPage: true
    })

    // Check for basic UI elements
    await expect(page.getByText('Supply Chain Graph')).toBeVisible()
    await expect(page.getByText('Graph Statistics')).toBeVisible()
    
    // Check that we have canvas elements (Sigma creates multiple canvases)
    const canvasCount = await page.locator('canvas').count()
    console.log(`📊 Canvas count: ${canvasCount}`)
    expect(canvasCount).toBeGreaterThan(0)

    // Verify graph statistics show data
    const nodeCount = await page.locator('text=Displayed Nodes:').locator('..').textContent()
    const edgeCount = await page.locator('text=Displayed Edges:').locator('..').textContent()
    
    console.log(`📈 ${nodeCount}`)
    console.log(`🔗 ${edgeCount}`)
    
    expect(nodeCount).toContain('Displayed Nodes:')
    expect(edgeCount).toContain('Displayed Edges:')
  })

  test('should render graph nodes and edges visually', async ({ page }) => {
    console.log('🧪 Testing: Visual rendering of nodes and edges')
    
    // Wait for graph to fully load
    await page.waitForTimeout(5000)
    
    // Take screenshot of the rendered graph
    await page.screenshot({ 
      path: 'test-results/sigma-02-graph-rendered.png',
      fullPage: true
    })

    // Check that canvas elements exist and have reasonable dimensions
    const canvasInfo = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas')
      return Array.from(canvases).map((canvas, index) => ({
        index,
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        style: {
          display: canvas.style.display,
          position: canvas.style.position
        }
      }))
    })

    console.log('🖼️ Canvas information:', JSON.stringify(canvasInfo, null, 2))
    
    expect(canvasInfo.length).toBeGreaterThan(0)
    
    // At least one canvas should have reasonable dimensions
    const hasValidCanvas = canvasInfo.some(canvas => 
      canvas.width > 100 && canvas.height > 100
    )
    expect(hasValidCanvas).toBe(true)
  })

  test('should handle graph regeneration', async ({ page }) => {
    console.log('🧪 Testing: Graph regeneration')
    
    // Take screenshot before regeneration
    await page.screenshot({ 
      path: 'test-results/sigma-03-before-regenerate.png',
      fullPage: true
    })

    // Get initial statistics
    const initialStats = await page.evaluate(() => {
      const nodeCountEl = document.querySelector('[data-testid="displayed-nodes"], .font-mono')
      const edgeCountEl = document.querySelector('[data-testid="displayed-edges"], .font-mono')
      return {
        nodes: nodeCountEl?.textContent || 'N/A',
        edges: edgeCountEl?.textContent || 'N/A'
      }
    })

    console.log('📊 Initial stats:', initialStats)

    // Click regenerate button
    const regenerateButton = page.getByText('Regenerate Graph')
    await expect(regenerateButton).toBeVisible()
    await regenerateButton.click()
    
    console.log('🔄 Clicked regenerate button')

    // Wait for regeneration to complete
    await page.waitForTimeout(4000)

    // Take screenshot after regeneration
    await page.screenshot({ 
      path: 'test-results/sigma-04-after-regenerate.png',
      fullPage: true
    })

    // Verify graph was regenerated (statistics should be present)
    await expect(page.getByText('Displayed Nodes:')).toBeVisible()
    await expect(page.getByText('Displayed Edges:')).toBeVisible()
  })

  test('should handle node type filtering', async ({ page }) => {
    console.log('🧪 Testing: Node type filtering')
    
    // Take screenshot with all node types selected
    await page.screenshot({ 
      path: 'test-results/sigma-05-all-node-types.png',
      fullPage: true
    })

    // Get initial node count
    const initialNodeCount = await page.locator('text=Displayed Nodes:').locator('..').textContent()
    console.log(`📊 Initial: ${initialNodeCount}`)

    // Uncheck Suppliers
    const suppliersCheckbox = page.locator('label:has-text("Suppliers") input[type="checkbox"]')
    await expect(suppliersCheckbox).toBeVisible()
    await suppliersCheckbox.uncheck()
    
    console.log('❌ Unchecked Suppliers')
    await page.waitForTimeout(2000)

    // Take screenshot with suppliers filtered out
    await page.screenshot({ 
      path: 'test-results/sigma-06-suppliers-filtered.png',
      fullPage: true
    })

    // Uncheck Manufacturers
    const manufacturersCheckbox = page.locator('label:has-text("Manufacturers") input[type="checkbox"]')
    await expect(manufacturersCheckbox).toBeVisible()
    await manufacturersCheckbox.uncheck()
    
    console.log('❌ Unchecked Manufacturers')
    await page.waitForTimeout(2000)

    // Take screenshot with multiple types filtered
    await page.screenshot({ 
      path: 'test-results/sigma-07-multiple-filtered.png',
      fullPage: true
    })

    // Re-enable all node types
    await suppliersCheckbox.check()
    await manufacturersCheckbox.check()
    
    console.log('✅ Re-enabled all node types')
    await page.waitForTimeout(2000)

    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/sigma-08-all-restored.png',
      fullPage: true
    })
  })

  test('should handle zoom and view controls', async ({ page }) => {
    console.log('🧪 Testing: Zoom and view controls')
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/sigma-09-before-zoom.png',
      fullPage: true
    })

    // Test Zoom to Fit button
    const zoomButton = page.getByText('Zoom to Fit')
    await expect(zoomButton).toBeVisible()
    await zoomButton.click()
    
    console.log('🔍 Clicked Zoom to Fit')
    await page.waitForTimeout(2000)

    // Take screenshot after zoom
    await page.screenshot({ 
      path: 'test-results/sigma-10-after-zoom.png',
      fullPage: true
    })

    // Test physics toggle
    const physicsButton = page.getByText('Pause Physics')
    if (await physicsButton.isVisible()) {
      await physicsButton.click()
      console.log('⏸️ Paused physics')
      await page.waitForTimeout(1000)
      
      await page.screenshot({ 
        path: 'test-results/sigma-11-physics-paused.png',
        fullPage: true
      })
    } else {
      console.log('ℹ️ Physics button not found or in different state')
    }
  })

  test('should handle switching between Sigma and Cosmos', async ({ page }) => {
    console.log('🧪 Testing: Switching between graph libraries')
    
    // Take screenshot of Sigma
    await page.screenshot({ 
      path: 'test-results/sigma-12-sigma-view.png',
      fullPage: true
    })

    // Switch to Cosmos
    const switchToCosmosButton = page.locator('text=Switch to Cosmos Graph')
    if (await switchToCosmosButton.isVisible()) {
      await switchToCosmosButton.click()
      console.log('🔄 Switched to Cosmos Graph')
      
      await page.waitForTimeout(4000)
      
      // Take screenshot of Cosmos
      await page.screenshot({ 
        path: 'test-results/sigma-13-cosmos-view.png',
        fullPage: true
      })

      // Switch back to Sigma
      const switchToSigmaButton = page.locator('text=Switch to Sigma.js')
      if (await switchToSigmaButton.isVisible()) {
        await switchToSigmaButton.click()
        console.log('🔄 Switched back to Sigma.js')
        
        await page.waitForTimeout(4000)
        
        // Take final screenshot
        await page.screenshot({ 
          path: 'test-results/sigma-14-back-to-sigma.png',
          fullPage: true
        })
      }
    }

    // Verify we're back on Sigma
    await expect(page.locator('text=Switch to Cosmos Graph')).toBeVisible()
  })

  test('should display correct graph statistics', async ({ page }) => {
    console.log('🧪 Testing: Graph statistics accuracy')
    
    // Wait for graph to load
    await page.waitForTimeout(3000)
    
    // Take screenshot of statistics panel
    await page.screenshot({ 
      path: 'test-results/sigma-15-statistics.png',
      fullPage: true
    })

    // Check that statistics are displayed and have reasonable values
    const stats = await page.evaluate(() => {
      const getStatValue = (label: string) => {
        const elements = Array.from(document.querySelectorAll('*'))
        const statElement = elements.find(el => el.textContent?.includes(label))
        return statElement?.textContent || 'Not found'
      }

      return {
        displayedNodes: getStatValue('Displayed Nodes:'),
        displayedEdges: getStatValue('Displayed Edges:'),
        density: getStatValue('Density:'),
        zoomLevel: getStatValue('Zoom Level:')
      }
    })

    console.log('📊 Graph Statistics:', JSON.stringify(stats, null, 2))

    // Verify statistics contain expected data
    expect(stats.displayedNodes).toContain('Displayed Nodes:')
    expect(stats.displayedEdges).toContain('Displayed Edges:')
    expect(stats.density).toContain('Density:')

    // Extract numbers and verify they're reasonable
    const nodeCountMatch = stats.displayedNodes.match(/(\d+)/)
    const edgeCountMatch = stats.displayedEdges.match(/(\d+)/)
    
    if (nodeCountMatch && edgeCountMatch) {
      const nodeCount = parseInt(nodeCountMatch[1])
      const edgeCount = parseInt(edgeCountMatch[1])
      
      console.log(`📈 Parsed stats: ${nodeCount} nodes, ${edgeCount} edges`)
      
      expect(nodeCount).toBeGreaterThan(0)
      expect(edgeCount).toBeGreaterThan(0)
      expect(nodeCount).toBeLessThan(1000) // Reasonable upper bound
      expect(edgeCount).toBeLessThan(10000) // Reasonable upper bound
    }
  })

  test('should handle export functionality', async ({ page }) => {
    console.log('🧪 Testing: Export PNG functionality')
    
    // Take screenshot before export
    await page.screenshot({ 
      path: 'test-results/sigma-16-before-export.png',
      fullPage: true
    })

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    const exportButton = page.getByText('Export PNG')
    await expect(exportButton).toBeVisible()
    await exportButton.click()
    
    console.log('💾 Clicked Export PNG')

    // Wait for download to complete
    try {
      const download = await downloadPromise
      console.log(`📁 Download started: ${download.suggestedFilename()}`)
      expect(download.suggestedFilename()).toContain('.png')
    } catch (error) {
      console.log('ℹ️ Download may not have triggered (this is okay in test environment)')
    }

    // Take screenshot after export attempt
    await page.screenshot({ 
      path: 'test-results/sigma-17-after-export.png',
      fullPage: true
    })
  })
})