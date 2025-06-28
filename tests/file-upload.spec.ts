import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.describe('File Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ ERROR: ${msg.text()}`)
      } else if (msg.type() === 'warn') {
        console.log(`⚠️ WARN: ${msg.text()}`)
      } else if (msg.text().includes('Validating uploaded data') || msg.text().includes('Node') || msg.text().includes('structure')) {
        console.log(`🔍 DEBUG: ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:5174/')
    await page.waitForTimeout(3000) // Allow time for graph to initialize
  })

  test('should show custom data upload section', async ({ page }) => {
    console.log('🧪 Testing: Custom data upload UI visibility')
    
    // Check if custom data section exists
    const customDataSection = page.locator('h3:has-text("Custom Data")')
    await expect(customDataSection).toBeVisible()
    
    // Check upload area
    const uploadArea = page.locator('text=Click to select or drag & drop JSON file')
    await expect(uploadArea).toBeVisible()
    
    // Check file size info
    const fileSizeInfo = page.locator('text=max 500MB')
    await expect(fileSizeInfo).toBeVisible()
    
    await page.screenshot({ 
      path: 'test-results/upload-01-ui-visible.png',
      fullPage: true
    })
  })

  test('should create and upload a valid small JSON file', async ({ page }) => {
    console.log('🧪 Testing: Valid small file upload')
    
    // Create a small valid supply chain JSON
    const testData = {
      nodes: [
        {
          id: "node_1",
          label: "Test Supplier",
          type: "supplier",
          tier: 1,
          location: { lat: 40.7128, lng: -74.0060, country: "USA", city: "New York" },
          capacity: 1000,
          leadTime: 7,
          riskScore: 0.3,
          sustainability: 0.8,
          size: "medium",
          industry: "electronics",
          established: 2010
        },
        {
          id: "node_2", 
          label: "Test Manufacturer",
          type: "manufacturer",
          tier: 2,
          location: { lat: 41.8781, lng: -87.6298, country: "USA", city: "Chicago" },
          capacity: 5000,
          leadTime: 14,
          riskScore: 0.2,
          sustainability: 0.9,
          size: "large",
          industry: "electronics",
          established: 2005
        }
      ],
      edges: [
        {
          id: "edge_1",
          source: "node_1",
          target: "node_2", 
          type: "material_flow",
          weight: 0.8,
          volume: 100,
          cost: 5000,
          reliability: 0.95,
          speed: 0.7,
          label: "Component Supply"
        }
      ],
      metadata: {
        totalValue: 1000000,
        totalNodes: 2,
        totalEdges: 1,
        industry: "electronics",
        region: "North America"
      }
    }
    
    // Create temporary file
    const testFilePath = '/tmp/temp-test-data.json'
    fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2))
    
    try {
      // Upload the file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)
      
      console.log('📤 File uploaded, waiting for processing...')
      
      // Wait for processing
      await page.waitForTimeout(5000)
      
      // Take screenshot during processing
      await page.screenshot({ 
        path: 'test-results/upload-02-processing.png',
        fullPage: true
      })
      
      // Check for success or error
      const successMessage = page.locator('text=File loaded successfully!')
      const errorMessage = page.locator('.text-red-400')
      
      // Wait for either success or error
      try {
        await expect(successMessage).toBeVisible({ timeout: 10000 })
        console.log('✅ File upload successful!')
        
        // Check if graph was updated
        const graphStats = await page.locator('text=Displayed Nodes:').locator('..').textContent()
        console.log('📊 Graph stats after upload:', graphStats)
        
      } catch (error) {
        // Check for error message
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent()
          console.log('❌ Upload error:', errorText)
        }
        throw error
      }
      
      await page.screenshot({ 
        path: 'test-results/upload-03-completed.png',
        fullPage: true
      })
      
    } finally {
      // Clean up temp file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('should handle invalid JSON file', async ({ page }) => {
    console.log('🧪 Testing: Invalid JSON file handling')
    
    // Create invalid JSON file
    const invalidData = `{
      "nodes": [
        {
          "id": "test"
          // Missing comma and other required fields
        }
      ]
    }`
    
    const testFilePath = '/tmp/temp-invalid.json'
    fs.writeFileSync(testFilePath, invalidData)
    
    try {
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)
      
      // Wait for error
      const errorMessage = page.locator('.text-red-400')
      await expect(errorMessage).toBeVisible({ timeout: 10000 })
      
      const errorText = await errorMessage.textContent()
      console.log('❌ Expected error for invalid JSON:', errorText)
      
      await page.screenshot({ 
        path: 'test-results/upload-04-invalid-json.png',
        fullPage: true
      })
      
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('should handle file with wrong structure', async ({ page }) => {
    console.log('🧪 Testing: Wrong structure file handling')
    
    // Create file with wrong structure (missing required fields)
    const wrongStructureData = {
      vertices: [ // Wrong key name
        {
          name: "Test Node", // Wrong field names
          category: "supplier",
          level: 1
        }
      ],
      connections: [], // Wrong key name
      info: {} // Wrong key name
    }
    
    const testFilePath = '/tmp/temp-wrong-structure.json'
    fs.writeFileSync(testFilePath, JSON.stringify(wrongStructureData, null, 2))
    
    try {
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)
      
      // Wait for error with detailed debugging
      await page.waitForTimeout(3000)
      
      const errorMessage = page.locator('.text-red-400')
      await expect(errorMessage).toBeVisible({ timeout: 10000 })
      
      const errorText = await errorMessage.textContent()
      console.log('❌ Expected error for wrong structure:', errorText)
      
      await page.screenshot({ 
        path: 'test-results/upload-05-wrong-structure.png',
        fullPage: true
      })
      
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('should test large file simulation', async ({ page }) => {
    console.log('🧪 Testing: Large file simulation')
    
    // Create a larger dataset
    const nodes = []
    const edges = []
    
    // Generate 100 nodes
    for (let i = 0; i < 100; i++) {
      nodes.push({
        id: `node_${i}`,
        label: `Test Node ${i}`,
        type: i % 2 === 0 ? "supplier" : "manufacturer",
        tier: Math.floor(i / 20) + 1,
        location: { 
          lat: 40 + Math.random() * 10, 
          lng: -80 + Math.random() * 10, 
          country: "USA", 
          city: `City ${i}` 
        },
        capacity: Math.floor(Math.random() * 10000) + 1000,
        leadTime: Math.floor(Math.random() * 30) + 1,
        riskScore: Math.random(),
        sustainability: Math.random(),
        size: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
        industry: "electronics",
        established: 2000 + Math.floor(Math.random() * 24)
      })
    }
    
    // Generate 150 edges
    for (let i = 0; i < 150; i++) {
      const sourceIdx = Math.floor(Math.random() * nodes.length)
      let targetIdx = Math.floor(Math.random() * nodes.length)
      while (targetIdx === sourceIdx) {
        targetIdx = Math.floor(Math.random() * nodes.length)
      }
      
      edges.push({
        id: `edge_${i}`,
        source: nodes[sourceIdx].id,
        target: nodes[targetIdx].id,
        type: "material_flow",
        weight: Math.random(),
        volume: Math.floor(Math.random() * 1000) + 100,
        cost: Math.floor(Math.random() * 50000) + 5000,
        reliability: Math.random(),
        speed: Math.random(),
        label: `Connection ${i}`
      })
    }
    
    const largeData = {
      nodes,
      edges,
      metadata: {
        totalValue: 50000000,
        totalNodes: nodes.length,
        totalEdges: edges.length,
        industry: "electronics",
        region: "Global"
      }
    }
    
    const testFilePath = '/tmp/temp-large-data.json'
    fs.writeFileSync(testFilePath, JSON.stringify(largeData, null, 2))
    
    console.log(`📊 Created test file with ${nodes.length} nodes and ${edges.length} edges`)
    console.log(`📏 File size: ${(fs.statSync(testFilePath).size / 1024).toFixed(1)} KB`)
    
    try {
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)
      
      console.log('📤 Large file uploaded, waiting for processing...')
      
      // Wait longer for large file processing
      await page.waitForTimeout(10000)
      
      // Check for completion (success or error)
      const successMessage = page.locator('text=File loaded successfully!')
      const errorMessage = page.locator('.text-red-400')
      const warningMessage = page.locator('div:has-text("Large dataset")')
      
      if (await successMessage.isVisible()) {
        console.log('✅ Large file upload successful!')
        
        // Check if performance warning appeared
        if (await warningMessage.isVisible()) {
          const warningText = await warningMessage.textContent()
          console.log('⚠️ Performance warning:', warningText)
        }
        
        // Verify graph was updated
        const nodeStats = await page.locator('text=Displayed Nodes:').locator('..').textContent()
        console.log('📊 Final graph stats:', nodeStats)
        
      } else if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent()
        console.log('❌ Large file error:', errorText)
      }
      
      await page.screenshot({ 
        path: 'test-results/upload-06-large-file.png',
        fullPage: true
      })
      
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })
})