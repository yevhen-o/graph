import { test, expect } from '@playwright/test'

test.describe('Sigma.js vs Cosmos Graph Comparison', () => {
  test('should compare both graph implementations side by side', async ({ page }) => {
    console.log('🔬 Testing: Comprehensive comparison of Sigma.js vs Cosmos Graph')
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ ERROR: ${msg.text()}`)
      } else {
        console.log(`📝 ${msg.type()}: ${msg.text()}`)
      }
    })

    await page.goto('/')
    await page.waitForTimeout(2000)

    // === SIGMA.JS TESTING ===
    console.log('📊 Testing Sigma.js Implementation')
    
    // Ensure we're on Sigma.js
    const switchToCosmosButton = page.locator('text=Switch to Cosmos Graph')
    if (await switchToCosmosButton.isVisible()) {
      console.log('✅ Already on Sigma.js')
    } else {
      const switchToSigmaButton = page.locator('text=Switch to Sigma.js')
      if (await switchToSigmaButton.isVisible()) {
        await switchToSigmaButton.click()
        await page.waitForTimeout(2000)
        console.log('🔄 Switched to Sigma.js')
      }
    }

    // Wait for Sigma to fully load
    await page.waitForTimeout(4000)

    // Take Sigma screenshot
    await page.screenshot({ 
      path: 'test-results/comparison-01-sigma-full.png',
      fullPage: true
    })

    // Get Sigma statistics
    const sigmaStats = await page.evaluate(() => {
      const getStatValue = (label: string) => {
        const elements = Array.from(document.querySelectorAll('*'))
        const statElement = elements.find(el => el.textContent?.includes(label))
        return statElement?.textContent?.match(/(\d+)/) ? statElement.textContent.match(/(\d+)/)![1] : '0'
      }

      return {
        nodes: parseInt(getStatValue('Displayed Nodes:')),
        edges: parseInt(getStatValue('Displayed Edges:')),
        canvasCount: document.querySelectorAll('canvas').length
      }
    })

    console.log(`📊 Sigma Stats: ${sigmaStats.nodes} nodes, ${sigmaStats.edges} edges, ${sigmaStats.canvasCount} canvases`)

    // Test Sigma regeneration
    const regenerateButton = page.getByText('Regenerate Graph')
    await regenerateButton.click()
    console.log('🔄 Regenerated Sigma graph')
    await page.waitForTimeout(3000)

    await page.screenshot({ 
      path: 'test-results/comparison-02-sigma-regenerated.png',
      fullPage: true
    })

    // === COSMOS GRAPH TESTING ===
    console.log('🚀 Testing Cosmos Graph Implementation')
    
    // Switch to Cosmos
    const switchToCosmos = page.locator('text=Switch to Cosmos Graph')
    await expect(switchToCosmos).toBeVisible()
    await switchToCosmos.click()
    console.log('🔄 Switched to Cosmos Graph')

    // Wait for Cosmos to fully load
    await page.waitForTimeout(5000)

    // Take Cosmos screenshot
    await page.screenshot({ 
      path: 'test-results/comparison-03-cosmos-full.png',
      fullPage: true
    })

    // Get Cosmos statistics
    const cosmosStats = await page.evaluate(() => {
      const getStatValue = (label: string) => {
        const elements = Array.from(document.querySelectorAll('*'))
        const statElement = elements.find(el => el.textContent?.includes(label))
        return statElement?.textContent?.match(/(\d+)/) ? statElement.textContent.match(/(\d+)/)![1] : '0'
      }

      return {
        nodes: parseInt(getStatValue('Displayed Nodes:')),
        edges: parseInt(getStatValue('Displayed Edges:')),
        canvasCount: document.querySelectorAll('canvas').length
      }
    })

    console.log(`🚀 Cosmos Stats: ${cosmosStats.nodes} nodes, ${cosmosStats.edges} edges, ${cosmosStats.canvasCount} canvases`)

    // Test Cosmos regeneration
    const cosmosRegenerateButton = page.getByText('Regenerate Graph')
    await cosmosRegenerateButton.click()
    console.log('🔄 Regenerated Cosmos graph')
    await page.waitForTimeout(4000)

    await page.screenshot({ 
      path: 'test-results/comparison-04-cosmos-regenerated.png',
      fullPage: true
    })

    // Test Cosmos zoom to fit
    const zoomButton = page.getByText('Zoom to Fit')
    await zoomButton.click()
    console.log('🔍 Applied Zoom to Fit')
    await page.waitForTimeout(2000)

    await page.screenshot({ 
      path: 'test-results/comparison-05-cosmos-zoomed.png',
      fullPage: true
    })

    // === COMPARISON SUMMARY ===
    console.log('📈 COMPARISON SUMMARY:')
    console.log(`   Sigma.js: ${sigmaStats.nodes} nodes, ${sigmaStats.edges} edges, ${sigmaStats.canvasCount} canvases`)
    console.log(`   Cosmos:   ${cosmosStats.nodes} nodes, ${cosmosStats.edges} edges, ${cosmosStats.canvasCount} canvases`)

    // === SWITCH BACK TO SIGMA FOR FINAL TEST ===
    const switchBackToSigma = page.locator('text=Switch to Sigma.js')
    if (await switchBackToSigma.isVisible()) {
      await switchBackToSigma.click()
      console.log('🔄 Switched back to Sigma.js for final verification')
      await page.waitForTimeout(3000)

      await page.screenshot({ 
        path: 'test-results/comparison-06-final-sigma.png',
        fullPage: true
      })
    }

    // Verify both implementations work
    expect(sigmaStats.nodes).toBeGreaterThan(0)
    expect(sigmaStats.edges).toBeGreaterThan(0)
    expect(sigmaStats.canvasCount).toBeGreaterThan(0)
    
    expect(cosmosStats.nodes).toBeGreaterThan(0)
    expect(cosmosStats.edges).toBeGreaterThan(0)
    expect(cosmosStats.canvasCount).toBeGreaterThan(0)

    console.log('✅ Both graph implementations are functional!')
  })
})