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
    case 'c': return 5;
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

function generate2MGraph() {
  console.log('🎯 Generating 2M nodes with 2M edges - ULTRA WIDE & MIXED!');
  console.log('Target: Maximum spread, perfect mixing, optimal browser performance');
  
  const nodeCount = 2000000;
  // Ultra-balanced distribution for maximum mixing
  const tierDistribution = {
    'r': Math.floor(nodeCount * 0.18),    // 360K raw materials
    's': Math.floor(nodeCount * 0.2),     // 400K suppliers  
    'm': Math.floor(nodeCount * 0.17),    // 340K manufacturers
    'd': Math.floor(nodeCount * 0.15),    // 300K distributors
    'w': Math.floor(nodeCount * 0.12),    // 240K warehouses
    't': Math.floor(nodeCount * 0.13),    // 260K retailers
    'c': Math.floor(nodeCount * 0.05)     // 100K customers (premium focus)
  };
  
  const outputPath = path.join(process.cwd(), 'public/data/samples/sample_2000000_ultra_wide.json');
  const writeStream = fs.createWriteStream(outputPath);
  
  writeStream.write('{"nodes":[');
  
  let nodeId = 0;
  let firstNode = true;
  const nodesByType = {};
  
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count.toLocaleString()} ${getFullNodeType(nodeType)} nodes...`);
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 25000; // ULTRA-wide tier spacing for maximum spread
    
    // Create ultra-wide, highly mixed layout
    const cols = Math.ceil(Math.sqrt(count * 5)); // ULTRA-wide grid ratio (5:1)
    const rows = Math.ceil(count / cols);
    const cellWidth = 300000 / cols; // MASSIVE 300K wide grid
    const cellHeight = 120000 / rows; // 120K tall grid
    
    nodesByType[nodeType] = [];
    const batchSize = 15000;
    
    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Ultra-wide randomness for maximum organic spread
        const randomX = (Math.random() - 0.5) * cellWidth * 2.5; // 2.5x random spread
        const randomY = (Math.random() - 0.5) * cellHeight;
        
        // Maximum tier mixing for flowing organic boundaries
        const tierMixing = (Math.random() - 0.5) * tierSpacing * 0.6; // 60% tier mixing
        const flowPattern = Math.sin(col / cols * Math.PI * 6) * tierSpacing * 0.3; // Complex sine wave
        const spiralPattern = Math.cos(row / rows * Math.PI * 4) * tierSpacing * 0.2; // Spiral overlay
        
        const x = Math.round((col - cols / 2) * cellWidth + randomX);
        const y = Math.round(tier * tierSpacing + (row - rows / 2) * cellHeight / 12 + randomY + tierMixing + flowPattern + spiralPattern);
        
        const nodeIdStr = `${nodeType}${nodeId}`;
        const node = {
          id: nodeIdStr,
          type: getFullNodeType(nodeType),
          tier: tier,
          x: x,
          y: y
        };
        
        nodesByType[nodeType].push(nodeIdStr);
        
        if (!firstNode) writeStream.write(',');
        writeStream.write(JSON.stringify(node));
        firstNode = false;
        nodeId++;
      }
      
      console.log(`  Progress: ${batchEnd.toLocaleString()}/${count.toLocaleString()} (${Math.round(batchEnd/count*100)}%)`);
    }
  });
  
  console.log(`\n🔗 Generating 2M edges with MAXIMUM connectivity & mixing...`);
  writeStream.write('],"edges":[');
  
  let edgeId = 0;
  let firstEdge = true;
  const targetEdges = 2000000;
  
  // Ultra-aggressive connection patterns for maximum connectivity and mixing
  const connections = [
    // Heavy primary flows
    { from: 'r', to: 's', prob: 0.95, weight: 450000 },    // Raw → Supplier (ultra-heavy)
    { from: 's', to: 'm', prob: 0.9, weight: 400000 },    // Supplier → Manufacturer (ultra-heavy)
    { from: 'm', to: 'd', prob: 0.85, weight: 350000 },   // Manufacturer → Distributor (very heavy)
    { from: 'd', to: 't', prob: 0.8, weight: 250000 },    // Distributor → Retailer (heavy)
    { from: 't', to: 'c', prob: 0.95, weight: 200000 },   // Retailer → Customer (ultra-heavy)
    
    // Warehouse flows with high connectivity
    { from: 'd', to: 'w', prob: 0.7, weight: 180000 },    // Distributor → Warehouse (heavy)
    { from: 'w', to: 't', prob: 0.85, weight: 200000 },   // Warehouse → Retailer (very heavy)
    { from: 'w', to: 'c', prob: 0.4, weight: 80000 },     // Direct warehouse → customer
    
    // Cross-tier shortcuts for ultra-mixed topology
    { from: 'r', to: 'm', prob: 0.3, weight: 100000 },    // Direct raw → manufacturer
    { from: 's', to: 'd', prob: 0.35, weight: 140000 },   // Skip manufacturer (heavy mixing)
    { from: 'm', to: 't', prob: 0.25, weight: 80000 },    // Direct manufacturer → retailer
    { from: 's', to: 'w', prob: 0.15, weight: 60000 },    // Supplier → warehouse
    { from: 'm', to: 'c', prob: 0.08, weight: 30000 },    // Direct manufacturer → customer
    
    // Ultra-complex modern flows (maximum mixing)
    { from: 's', to: 't', prob: 0.12, weight: 50000 },    // Direct supplier → retailer
    { from: 's', to: 'c', prob: 0.05, weight: 20000 },    // Direct supplier → customer
    { from: 'r', to: 'd', prob: 0.08, weight: 30000 },    // Raw materials → distributor
    { from: 'r', to: 'w', prob: 0.06, weight: 25000 },    // Raw materials → warehouse
    { from: 'r', to: 't', prob: 0.03, weight: 15000 },    // Raw materials → retailer
  ];
  
  connections.forEach(({ from, to, prob, weight }) => {
    if (edgeId >= targetEdges) return;
    
    console.log(`Connecting ${getFullNodeType(from)} → ${getFullNodeType(to)}...`);
    
    const fromNodes = nodesByType[from] || [];
    const toNodes = nodesByType[to] || [];
    
    let connectionsMade = 0;
    const maxConnections = Math.min(weight, targetEdges - edgeId);
    
    // Ultra-smart sampling for maximum connectivity
    const sampleRatio = Math.min(1.0, maxConnections / (fromNodes.length * prob * 2));
    const sampleSize = Math.ceil(fromNodes.length * sampleRatio);
    
    for (let i = 0; i < sampleSize && connectionsMade < maxConnections; i++) {
      const fromNode = fromNodes[Math.floor(Math.random() * fromNodes.length)];
      
      // Each from node makes multiple connections (ultra-realistic hub behavior)
      const connectionsPerNode = Math.ceil(Math.random() * 12) + 3; // 3-15 connections per node
      
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
    
    console.log(`  Created ${connectionsMade.toLocaleString()} connections (${edgeId.toLocaleString()} total edges)`);
  });
  
  writeStream.write('],"metadata":{');
  writeStream.write(`"totalNodes":${nodeId},"totalEdges":${edgeId},"industry":"Global Manufacturing","region":"Worldwide","layout":"ultra-wide-mixed-organic","generated":"${new Date().toISOString()}"`);
  writeStream.write('}}');
  
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      console.log(`\n🎉 2M ULTRA WIDE & MIXED generation complete!`);
      console.log(`📊 Total nodes: ${nodeId.toLocaleString()}`);
      console.log(`🔗 Total edges: ${edgeId.toLocaleString()}`);
      console.log(`📁 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📐 Layout: Ultra-wide organic (300K x 120K) with maximum mixing`);
      console.log(`⚡ Connectivity ratio: ${(edgeId/nodeId).toFixed(1)} edges per node`);
      resolve();
    });
  });
}

generate2MGraph().then(() => {
  console.log('✅ 2M ultra wide & mixed graph completed!');
}).catch(err => {
  console.error('❌ Failed:', err);
});