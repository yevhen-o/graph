import { test, expect } from '@playwright/test'

test('Debug Cosmos Graph Rendering', async ({ page }) => {
  console.log('Starting Cosmos debug test...')
  
  // Navigate to the app
  await page.goto('/')
  
  // Wait for initial load
  await page.waitForTimeout(2000)
  
  // Check console for errors
  const consoleMessages: string[] = []
  const errors: string[] = []
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  // Wait longer for graph initialization
  await page.waitForTimeout(5000)
  
  // Check canvas properties
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return { found: false }
    
    return {
      found: true,
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      style: {
        width: canvas.style.width,
        height: canvas.style.height,
        display: canvas.style.display
      },
      context: {
        webgl: !!canvas.getContext('webgl'),
        webgl2: !!canvas.getContext('webgl2'),
        experimental: !!canvas.getContext('experimental-webgl')
      }
    }
  })
  
  console.log('Canvas info:', JSON.stringify(canvasInfo, null, 2))
  
  // Check if Graph class is available
  const cosmosInfo = await page.evaluate(() => {
    // @ts-ignore
    return {
      cosmosAvailable: typeof window.Graph !== 'undefined',
      // @ts-ignore
      globalGraph: !!window.Graph
    }
  })
  
  console.log('Cosmos info:', cosmosInfo)
  
  // Check DOM structure
  const domInfo = await page.evaluate(() => {
    const container = document.querySelector('.graph-container')
    if (!container) return { containerFound: false }
    
    return {
      containerFound: true,
      children: container.children.length,
      innerHTML: container.innerHTML.substring(0, 200),
      boundingRect: container.getBoundingClientRect()
    }
  })
  
  console.log('DOM info:', JSON.stringify(domInfo, null, 2))
  
  // Take screenshot for debugging
  await page.screenshot({ 
    path: 'test-results/cosmos-debug.png',
    fullPage: true
  })
  
  // Check for specific error patterns
  const hasWebGLErrors = errors.some(error => 
    error.includes('WebGL') || 
    error.includes('webgl') || 
    error.includes('context')
  )
  
  const hasCosmosErrors = errors.some(error => 
    error.includes('cosmos') || 
    error.includes('Graph') ||
    error.includes('setPointPositions')
  )
  
  console.log('Console messages:', consoleMessages)
  console.log('Errors:', errors)
  console.log('Has WebGL errors:', hasWebGLErrors)
  console.log('Has Cosmos errors:', hasCosmosErrors)
  
  // Basic checks
  expect(canvasInfo.found).toBe(true)
  expect(canvasInfo.context.webgl || canvasInfo.context.webgl2).toBe(true)
})