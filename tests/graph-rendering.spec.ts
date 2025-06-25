import { test, expect } from '@playwright/test'

test.describe('Supply Chain Graph Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application and display basic UI', async ({ page }) => {
    // Check if the main container is present
    await expect(page.locator('div')).toBeVisible()
    
    // Check for graph controls panel
    await expect(page.getByText('Supply Chain Graph')).toBeVisible()
    
    // Take a screenshot of the initial state
    await page.screenshot({ 
      path: 'test-results/initial-load.png',
      fullPage: true
    })
  })

  test('should display graph statistics panel', async ({ page }) => {
    // Wait for the statistics to load
    await page.waitForTimeout(2000)
    
    // Check for graph statistics
    await expect(page.getByText('Graph Statistics')).toBeVisible()
    await expect(page.getByText('Displayed Nodes:')).toBeVisible()
    await expect(page.getByText('Displayed Edges:')).toBeVisible()
    
    // Take a screenshot of the statistics panel
    await page.screenshot({ 
      path: 'test-results/statistics-panel.png',
      fullPage: true
    })
  })

  test('should render graph canvas/container', async ({ page }) => {
    // Wait for graph to initialize
    await page.waitForTimeout(3000)
    
    // Check if graph container exists
    const graphContainer = page.locator('.graph-container')
    await expect(graphContainer).toBeVisible()
    
    // Check for canvas element (WebGL canvas)
    const canvas = page.locator('canvas')
    if (await canvas.count() > 0) {
      await expect(canvas.first()).toBeVisible()
      console.log('Canvas found!')
    } else {
      console.log('No canvas found - this might be the issue')
    }
    
    // Take a screenshot of the graph area
    await page.screenshot({ 
      path: 'test-results/graph-area.png',
      fullPage: true
    })
    
    // Take a focused screenshot of just the graph container
    await graphContainer.screenshot({ 
      path: 'test-results/graph-container-only.png'
    })
  })

  test('should display controls and buttons', async ({ page }) => {
    // Wait for UI to load
    await page.waitForTimeout(1000)
    
    // Check for control buttons
    await expect(page.getByText('Regenerate Graph')).toBeVisible()
    await expect(page.getByText('Zoom to Fit')).toBeVisible()
    await expect(page.getByText('Export PNG')).toBeVisible()
    
    // Check for node type filters
    await expect(page.getByText('Node Types')).toBeVisible()
    await expect(page.getByText('Suppliers')).toBeVisible()
    await expect(page.getByText('Manufacturers')).toBeVisible()
    
    // Take a screenshot of the controls
    await page.screenshot({ 
      path: 'test-results/controls-panel.png',
      fullPage: true
    })
  })

  test('should handle loading state', async ({ page }) => {
    // Reload to catch the loading state
    await page.reload()
    
    // Check for loading indicator
    const loadingText = page.getByText('Generating graph with')
    if (await loadingText.isVisible()) {
      await page.screenshot({ 
        path: 'test-results/loading-state.png',
        fullPage: true
      })
      
      // Wait for loading to complete
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
    }
    
    // Take final screenshot after loading
    await page.screenshot({ 
      path: 'test-results/after-loading.png',
      fullPage: true
    })
  })

  test('should check for WebGL support and errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Wait for graph initialization
    await page.waitForTimeout(5000)
    
    // Check WebGL context
    const webglSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    })
    
    console.log('WebGL Support:', webglSupport)
    console.log('Console Errors:', errors)
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/webgl-debug.png',
      fullPage: true
    })
    
    // Check if there are any canvas elements
    const canvasCount = await page.locator('canvas').count()
    console.log('Canvas count:', canvasCount)
    
    // Check for graph library specific elements
    const cosmosElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      const cosmosRelated = []
      for (const el of elements) {
        if (el.className && el.className.includes && el.className.includes('cosmos')) {
          cosmosRelated.push(el.tagName + '.' + el.className)
        }
      }
      return cosmosRelated
    })
    
    console.log('Cosmos-related elements:', cosmosElements)
    
    expect(webglSupport).toBe(true)
  })

  test('should test graph generation with different node counts', async ({ page }) => {
    // Test with small graph first
    await page.waitForTimeout(2000)
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/default-graph.png',
      fullPage: true
    })
    
    // Click regenerate to see if it works
    await page.getByText('Regenerate Graph').click()
    
    // Wait for regeneration
    await page.waitForTimeout(3000)
    
    // Take screenshot after regeneration
    await page.screenshot({ 
      path: 'test-results/after-regenerate.png',
      fullPage: true
    })
  })

  test('should check DOM structure for debugging', async ({ page }) => {
    await page.waitForTimeout(3000)
    
    // Get the full DOM structure of the graph container
    const containerHTML = await page.locator('.graph-container').innerHTML()
    console.log('Graph container HTML:', containerHTML)
    
    // Check if the container has any children
    const childCount = await page.locator('.graph-container > *').count()
    console.log('Graph container child count:', childCount)
    
    // Get computed styles of the container
    const containerStyles = await page.locator('.graph-container').evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        width: styles.width,
        height: styles.height,
        display: styles.display,
        position: styles.position,
        overflow: styles.overflow
      }
    })
    console.log('Graph container styles:', containerStyles)
    
    // Take a screenshot for visual debugging
    await page.screenshot({ 
      path: 'test-results/dom-debug.png',
      fullPage: true
    })
  })
})