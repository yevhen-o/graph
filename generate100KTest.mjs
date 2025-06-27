import fs from 'fs';
import path from 'path';

function getTierNumber(nodeType) {
  switch (nodeType) {
    case 'r': return 0; // raw_materials (shortened)
    case 's': return 1; // supplier
    case 'm': return 2; // manufacturer
    case 'd': return 3; // distributor
    case 'w': return 3; // warehouse
    case 't': return 4; // retailer (t for retail)
    default: return 0;
  }
}

function getFullNodeType(short) {
  switch (short) {
    case 'r': return 'raw_materials';
    case 's': return 'supplier';
    case 'm': return 'manufacturer';
    case 'd': return 'distributor';
    case 'w': return 'warehouse';
    case 't': return 'retailer';
    default: return 'raw_materials';
  }
}

function generateTestGraph(nodeCount = 100000) {
  console.log('Starting generation of 100K test graph with larger coordinates...');
  
  const tierDistribution = {
    'r': Math.floor(nodeCount * 0.5),    // 50K raw materials
    's': Math.floor(nodeCount * 0.25),   // 25K suppliers
    'm': Math.floor(nodeCount * 0.1),    // 10K manufacturers
    'd': Math.floor(nodeCount * 0.08),   // 8K distributors
    't': Math.floor(nodeCount * 0.05),   // 5K retailers
    'w': Math.floor(nodeCount * 0.02)    // 2K warehouses
  };
  
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  
  // Generate nodes with MUCH larger coordinate range
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count} ${getFullNodeType(nodeType)} nodes...`);
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 5000; // Much larger spacing
    
    // Large grid for proper distribution
    const cols = Math.ceil(Math.sqrt(count * 2));
    const rows = Math.ceil(count / cols);
    const cellWidth = 50000 / cols; // 50K wide grid
    const cellHeight = 20000 / rows; // 20K tall grid
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // Large coordinate space
      const x = Math.round(((col - cols / 2) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.8) * 10) / 10;
      const y = Math.round((tier * tierSpacing + (row - rows / 2) * cellHeight / 4 + (Math.random() - 0.5) * cellHeight * 0.2) * 10) / 10;
      
      const node = {
        id: `${nodeType}${nodeId}`,
        type: getFullNodeType(nodeType),
        tier: tier,
        x: x,
        y: y,
        size: 'small'
      };
      
      nodes.push(node);
      nodeId++;
    }
  });
  
  console.log(`Total nodes generated: ${nodeId}`);
  
  // Generate minimal edges
  for (let i = 0; i < 1000; i++) {
    const sourceId = Math.floor(Math.random() * nodeId);
    const targetId = Math.floor(Math.random() * nodeId);
    
    if (sourceId !== targetId) {
      edges.push({
        id: `e${i}`,
        source: `r${sourceId}`,
        target: `s${targetId}`,
        type: 'flow'
      });
    }
  }
  
  return {
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      industry: 'Global Manufacturing',
      region: 'Worldwide',
      layout: 'large-hierarchical-grid',
      generated: new Date().toISOString()
    }
  };
}

console.log('Generating 100K test graph with larger coordinates...');
const startTime = Date.now();

const graph = generateTestGraph(100000);

console.log(`Generated ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
console.log(`Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

// Check coordinate ranges
const xCoords = graph.nodes.map(n => n.x);
const yCoords = graph.nodes.map(n => n.y);
console.log(`X range: ${Math.min(...xCoords)} to ${Math.max(...xCoords)}`);
console.log(`Y range: ${Math.min(...yCoords)} to ${Math.max(...yCoords)}`);

// Save to file
const outputPath = path.join(process.cwd(), 'public/data/samples/sample_100000_large_coords.json');
fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));

const stats = fs.statSync(outputPath);
console.log(`Saved to: ${outputPath}`);
console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log('Done!');