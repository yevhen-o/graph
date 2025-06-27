import fs from 'fs';
import path from 'path';

function getTierNumber(nodeType) {
  switch (nodeType) {
    case 'r': return 0;
    case 's': return 1;
    case 'm': return 2;
    case 'd': return 3;
    case 'w': return 3;
    case 't': return 4;
    case 'c': return 5; // customers
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
    case 'c': return 'customer';
    default: return 'raw_materials';
  }
}

function generate7MGraph() {
  console.log('🚀 Generating 7M nodes with 7M edges - WIDE & MIXED layout!');
  console.log('Target: More connectivity, wider spread, mixed distribution');
  
  const nodeCount = 7000000;
  // More balanced distribution with customers
  const tierDistribution = {
    'r': Math.floor(nodeCount * 0.25),   // 1.75M raw materials
    's': Math.floor(nodeCount * 0.2),    // 1.4M suppliers  
    'm': Math.floor(nodeCount * 0.15),   // 1.05M manufacturers
    'd': Math.floor(nodeCount * 0.12),   // 840K distributors
    'w': Math.floor(nodeCount * 0.08),   // 560K warehouses
    't': Math.floor(nodeCount * 0.1),    // 700K retailers
    'c': Math.floor(nodeCount * 0.1)     // 700K customers
  };
  
  const outputPath = path.join(process.cwd(), 'public/data/samples/sample_7000000_wide_mixed.json');
  const writeStream = fs.createWriteStream(outputPath);
  
  writeStream.write('{"nodes":[');
  
  let nodeId = 0;
  let firstNode = true;
  const nodesByType = {}; // Track nodes for edge generation
  
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count} ${getFullNodeType(nodeType)} nodes...`);
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 15000; // MUCH wider spacing
    
    // Create more spread out, organic layout
    const cols = Math.ceil(Math.sqrt(count * 3)); // Even wider grid
    const rows = Math.ceil(count / cols);
    const cellWidth = 150000 / cols; // MASSIVE 150K wide grid
    const cellHeight = 80000 / rows;  // 80K tall grid
    
    nodesByType[nodeType] = [];
    const batchSize = 25000;
    
    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Add more randomness for organic feel
        const randomX = (Math.random() - 0.5) * cellWidth * 1.5; // More random spread
        const randomY = (Math.random() - 0.5) * cellHeight * 0.8;
        
        // Mix tiers slightly for more organic layout
        const tierMixing = (Math.random() - 0.5) * tierSpacing * 0.3;
        
        const x = Math.round((col - cols / 2) * cellWidth + randomX);
        const y = Math.round(tier * tierSpacing + (row - rows / 2) * cellHeight / 8 + randomY + tierMixing);
        
        const nodeIdStr = `${nodeType}${nodeId}`;
        const node = {
          id: nodeIdStr,
          type: getFullNodeType(nodeType),
          tier: tier,
          x: x,
          y: y
        };
        
        // Store for edge generation
        nodesByType[nodeType].push(nodeIdStr);
        
        if (!firstNode) writeStream.write(',');
        writeStream.write(JSON.stringify(node));
        firstNode = false;
        nodeId++;
      }
      
      console.log(`  Progress: ${batchEnd}/${count} (${Math.round(batchEnd/count*100)}%)`);
    }
  });
  
  console.log(`\nGenerating 7M edges with realistic supply chain connections...`);
  writeStream.write('],"edges":[');
  
  let edgeId = 0;
  let firstEdge = true;
  const targetEdges = 7000000;
  
  // Connection patterns with higher probabilities for more edges
  const connections = [
    // Primary flow
    { from: 'r', to: 's', prob: 0.8, weight: 3000000 },   // Raw → Supplier (heavy)
    { from: 's', to: 'm', prob: 0.7, weight: 2000000 },   // Supplier → Manufacturer (heavy)
    { from: 'm', to: 'd', prob: 0.6, weight: 1500000 },   // Manufacturer → Distributor (heavy)
    { from: 'd', to: 't', prob: 0.5, weight: 800000 },    // Distributor → Retailer
    { from: 'd', to: 'w', prob: 0.4, weight: 600000 },    // Distributor → Warehouse
    { from: 'w', to: 't', prob: 0.6, weight: 500000 },    // Warehouse → Retailer
    { from: 't', to: 'c', prob: 0.8, weight: 1200000 },   // Retailer → Customer (heavy)
    
    // Cross connections for complexity
    { from: 'r', to: 'm', prob: 0.1, weight: 200000 },    // Direct raw → manufacturer
    { from: 's', to: 'd', prob: 0.15, weight: 300000 },   // Skip manufacturer
    { from: 'm', to: 't', prob: 0.1, weight: 150000 },    // Direct manufacturer → retailer
    { from: 's', to: 'w', prob: 0.05, weight: 100000 },   // Supplier → warehouse
    { from: 'w', to: 'c', prob: 0.1, weight: 100000 },    // Direct warehouse → customer
  ];
  
  connections.forEach(({ from, to, prob, weight }) => {
    if (edgeId >= targetEdges) return;
    
    console.log(`Connecting ${getFullNodeType(from)} → ${getFullNodeType(to)}...`);
    
    const fromNodes = nodesByType[from] || [];
    const toNodes = nodesByType[to] || [];
    
    let connectionsMade = 0;
    const maxConnections = Math.min(weight, targetEdges - edgeId);
    
    // Create connections with sampling for performance
    const sampleSize = Math.min(fromNodes.length, Math.ceil(maxConnections / (prob * 10)));
    
    for (let i = 0; i < sampleSize && connectionsMade < maxConnections; i++) {
      const fromNode = fromNodes[Math.floor(Math.random() * fromNodes.length)];
      
      // Each from node connects to multiple to nodes
      const connectionsPerNode = Math.ceil(Math.random() * 5) + 1;
      
      for (let j = 0; j < connectionsPerNode && connectionsMade < maxConnections; j++) {
        if (Math.random() < prob) {
          const toNode = toNodes[Math.floor(Math.random() * toNodes.length)];
          
          if (fromNode !== toNode) {
            const edge = {
              id: `e${edgeId}`,
              source: fromNode,
              target: toNode,
              type: 'flow'
            };
            
            if (!firstEdge) writeStream.write(',');
            writeStream.write(JSON.stringify(edge));
            firstEdge = false;
            edgeId++;
            connectionsMade++;
          }
        }
      }
    }
    
    console.log(`  Created ${connectionsMade} connections (${edgeId} total edges)`);
  });
  
  writeStream.write('],"metadata":{');
  writeStream.write(`"totalNodes":${nodeId},"totalEdges":${edgeId},"industry":"Global Manufacturing","region":"Worldwide","layout":"wide-mixed-organic","generated":"${new Date().toISOString()}"`);
  writeStream.write('}}');
  
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      console.log(`\n🎉 7M WIDE & MIXED generation complete!`);
      console.log(`📊 Total nodes: ${nodeId.toLocaleString()}`);
      console.log(`🔗 Total edges: ${edgeId.toLocaleString()}`);
      console.log(`📁 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📐 Layout: Ultra-wide (150K x 80K) with organic mixing`);
      resolve();
    });
  });
}

generate7MGraph().then(() => {
  console.log('✅ 7M wide & mixed graph completed!');
}).catch(err => {
  console.error('❌ Failed:', err);
});