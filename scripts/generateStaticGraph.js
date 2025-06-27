import { SupplyChainGenerator } from '../src/data/supplyChainGenerator.js'
import fs from 'fs'
import path from 'path'

console.log('Generating 100K node graph with pre-calculated positions...')

const startTime = Date.now()
const graph = SupplyChainGenerator.generateLargeGraph(100000, true)

console.log(`Generated ${graph.nodes.length} nodes and ${graph.edges.length} edges`)
console.log(`Time taken: ${(Date.now() - startTime) / 1000}s`)

// Check if positions were generated
const nodesWithPositions = graph.nodes.filter(n => n.x !== undefined && n.y !== undefined).length
console.log(`Nodes with positions: ${nodesWithPositions}`)

// Save to file
const outputPath = path.join(process.cwd(), 'public/data/samples/sample_100000_static_positions.json')
fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2))

console.log(`Saved to: ${outputPath}`)
console.log('File size:', (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2), 'MB')