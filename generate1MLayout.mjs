import fs from 'fs';
import path from 'path';

// Helper function to get tier number
function getTierNumber(nodeType) {
  switch (nodeType) {
    case 'raw_materials': return 0;
    case 'supplier': return 1;
    case 'manufacturer': return 2;
    case 'distributor': return 3;
    case 'warehouse': return 3;
    case 'retailer': return 4;
    case 'customer': return 5;
    default: return 0;
  }
}

function generateMassiveGraph(nodeCount = 1000000) {
  console.log('Starting generation of 1M node graph...');
  const nodes = [];
  const edges = [];
  
  // Tier distribution for 1M nodes
  const tierDistribution = {
    'raw_materials': Math.floor(nodeCount * 0.35),    // 350K
    'supplier': Math.floor(nodeCount * 0.25),         // 250K
    'manufacturer': Math.floor(nodeCount * 0.15),     // 150K
    'distributor': Math.floor(nodeCount * 0.10),      // 100K
    'retailer': Math.floor(nodeCount * 0.10),         // 100K
    'warehouse': Math.floor(nodeCount * 0.05)         // 50K
  };
  
  let nodeId = 0;
  const nodesByType = {};
  
  // Generate nodes with optimized hierarchical layout
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count} ${nodeType} nodes...`);
    nodesByType[nodeType] = [];
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 1500; // Larger spacing for 1M nodes
    
    // Calculate grid dimensions for this tier
    const cols = Math.ceil(Math.sqrt(count * 2)); // Wider than tall
    const rows = Math.ceil(count / cols);
    const cellWidth = 8000 / cols;
    const cellHeight = 4000 / rows;
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // Grid position with some randomness
      const x = (col - cols / 2) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.8;
      const y = tier * tierSpacing + (row - rows / 2) * cellHeight / 4 + (Math.random() - 0.5) * cellHeight * 0.2;
      
      const node = {
        id: `n${nodeId}`, // Shorter IDs to save memory
        label: `${nodeType.charAt(0).toUpperCase()}${nodeId}`, // Shorter labels
        type: nodeType,
        tier: tier,
        x: Math.round(x * 10) / 10, // Round to 1 decimal place to save space
        y: Math.round(y * 10) / 10,
        size: Math.random() < 0.8 ? 'small' : 'medium', // Mostly small nodes
        capacity: Math.floor(Math.random() * 5000) + 1000,
        industry: 'Global'
      };
      
      nodes.push(node);
      nodesByType[nodeType].push(node);
      nodeId++;
      
      if (i % 10000 === 0) {
        console.log(`  Progress: ${i}/${count} (${Math.round(i/count*100)}%)`);
      }
    }
  });
  
  console.log(`Total nodes generated: ${nodes.length}`);
  
  // Generate edges with very sparse connectivity
  // For 1M nodes, we'll limit to 500K edges for performance
  const maxEdges = 500000;
  let edgeId = 0;
  
  console.log('Generating edges...');
  
  // Define connections with very low probabilities
  const connections = [
    ['raw_materials', 'supplier', 0.0002],      // ~17.5K edges
    ['supplier', 'manufacturer', 0.0003],       // ~11.25K edges
    ['manufacturer', 'distributor', 0.0005],    // ~7.5K edges
    ['distributor', 'retailer', 0.0008],        // ~8K edges
    ['distributor', 'warehouse', 0.0004],       // ~2K edges
    ['warehouse', 'retailer', 0.001]            // ~5K edges
  ];
  
  connections.forEach(([sourceType, targetType, probability]) => {
    if (edges.length >= maxEdges) return;
    
    const sourceNodes = nodesByType[sourceType] || [];
    const targetNodes = nodesByType[targetType] || [];
    
    console.log(`Connecting ${sourceType} to ${targetType}...`);
    
    // Use sampling for large node sets
    const maxSourceSample = Math.min(sourceNodes.length, 5000);
    const maxTargetSample = Math.min(targetNodes.length, 5000);
    
    for (let i = 0; i < maxSourceSample && edges.length < maxEdges; i++) {
      const sourceIdx = Math.floor(Math.random() * sourceNodes.length);
      const sourceNode = sourceNodes[sourceIdx];
      
      // Each source connects to a few random targets
      const numConnections = Math.ceil(Math.random() * 3);
      
      for (let j = 0; j < numConnections && edges.length < maxEdges; j++) {
        const targetIdx = Math.floor(Math.random() * targetNodes.length);
        const targetNode = targetNodes[targetIdx];
        
        if (Math.random() < probability * 10) { // Adjusted probability
          edges.push({
            id: `e${edgeId++}`,
            source: sourceNode.id,
            target: targetNode.id,
            type: 'flow',
            weight: Math.round(Math.random() * 100)
          });
        }
      }
    }
    
    console.log(`  Current edges: ${edges.length}`);
  });
  
  return {
    nodes,
    edges: edges.slice(0, maxEdges),
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      industry: 'Global Manufacturing',
      region: 'Worldwide',
      layout: 'hierarchical-grid',
      generated: new Date().toISOString()
    }
  };
}

console.log('Generating 1M node graph with pre-calculated positions...');
console.log('This will take a few minutes...\n');

const startTime = Date.now();
const graph = generateMassiveGraph(1000000);

console.log(`\nGeneration complete!`);
console.log(`Total nodes: ${graph.nodes.length}`);
console.log(`Total edges: ${graph.edges.length}`);
console.log(`Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

// Check positions
const nodesWithPositions = graph.nodes.filter(n => n.x !== undefined && n.y !== undefined).length;
console.log(`Nodes with positions: ${nodesWithPositions}`);

// Save to file
console.log('\nSaving to file...');
const outputPath = path.join(process.cwd(), 'public/data/samples/sample_1000000_static_positions.json');

// Use streaming to write large file
const writeStream = fs.createWriteStream(outputPath);
writeStream.write(JSON.stringify(graph, null, 2));
writeStream.end();

writeStream.on('finish', () => {
  const stats = fs.statSync(outputPath);
  console.log(`Saved to: ${outputPath}`);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('\nDone! The 1M node graph is ready to use.');
});