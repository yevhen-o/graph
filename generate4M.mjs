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

function generate4MGraph() {
  console.log('🎯 Generating 4M nodes with 4M edges - OPTIMAL SCALE!');
  console.log('Target: Maximum connectivity, ultra-wide spread, perfect browser compatibility');
  
  const nodeCount = 4000000;
  // Highly balanced distribution for realistic supply chain
  const tierDistribution = {
    'r': Math.floor(nodeCount * 0.2),    // 800K raw materials
    's': Math.floor(nodeCount * 0.22),   // 880K suppliers  
    'm': Math.floor(nodeCount * 0.18),   // 720K manufacturers
    'd': Math.floor(nodeCount * 0.15),   // 600K distributors
    'w': Math.floor(nodeCount * 0.1),    // 400K warehouses
    't': Math.floor(nodeCount * 0.1),    // 400K retailers
    'c': Math.floor(nodeCount * 0.05)    // 200K customers (premium focus)
  };
  
  const outputPath = path.join(process.cwd(), 'public/data/samples/sample_4000000_optimal.json');
  const writeStream = fs.createWriteStream(outputPath);
  
  writeStream.write('{"nodes":[');
  
  let nodeId = 0;
  let firstNode = true;
  const nodesByType = {};
  
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count.toLocaleString()} ${getFullNodeType(nodeType)} nodes...`);
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 20000; // ULTRA-wide tier spacing
    
    // Create organic, flowing layout
    const cols = Math.ceil(Math.sqrt(count * 4)); // Very wide grid ratio
    const rows = Math.ceil(count / cols);
    const cellWidth = 200000 / cols; // MASSIVE 200K wide grid
    const cellHeight = 100000 / rows; // 100K tall grid
    
    nodesByType[nodeType] = [];
    const batchSize = 20000;
    
    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Maximum randomness for organic clustering
        const randomX = (Math.random() - 0.5) * cellWidth * 2; // Double random spread
        const randomY = (Math.random() - 0.5) * cellHeight;
        
        // Organic tier mixing (create flowing boundaries)
        const tierMixing = (Math.random() - 0.5) * tierSpacing * 0.4;
        const flowPattern = Math.sin(col / cols * Math.PI * 4) * tierSpacing * 0.2; // Sine wave flow
        
        const x = Math.round((col - cols / 2) * cellWidth + randomX);
        const y = Math.round(tier * tierSpacing + (row - rows / 2) * cellHeight / 10 + randomY + tierMixing + flowPattern);
        
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
  
  console.log(`\n🔗 Generating 4M edges with MAXIMUM connectivity...`);
  writeStream.write('],"edges":[');
  
  let edgeId = 0;
  let firstEdge = true;
  const targetEdges = 4000000;
  
  // Aggressive connection patterns for maximum connectivity
  const connections = [
    // Heavy primary flows
    { from: 'r', to: 's', prob: 0.9, weight: 800000 },    // Raw → Supplier (very heavy)
    { from: 's', to: 'm', prob: 0.85, weight: 700000 },   // Supplier → Manufacturer (very heavy)
    { from: 'm', to: 'd', prob: 0.8, weight: 600000 },    // Manufacturer → Distributor (heavy)
    { from: 'd', to: 't', prob: 0.7, weight: 400000 },    // Distributor → Retailer (heavy)
    { from: 't', to: 'c', prob: 0.9, weight: 350000 },    // Retailer → Customer (very heavy)
    
    // Warehouse flows
    { from: 'd', to: 'w', prob: 0.6, weight: 300000 },    // Distributor → Warehouse
    { from: 'w', to: 't', prob: 0.8, weight: 320000 },    // Warehouse → Retailer (heavy)
    { from: 'w', to: 'c', prob: 0.3, weight: 120000 },    // Direct warehouse → customer
    
    // Cross-tier shortcuts (realistic modern supply chains)
    { from: 'r', to: 'm', prob: 0.2, weight: 160000 },    // Direct raw → manufacturer
    { from: 's', to: 'd', prob: 0.25, weight: 220000 },   // Skip manufacturer
    { from: 'm', to: 't', prob: 0.15, weight: 100000 },   // Direct manufacturer → retailer
    { from: 's', to: 'w', prob: 0.1, weight: 80000 },     // Supplier → warehouse
    { from: 'm', to: 'c', prob: 0.05, weight: 40000 },    // Direct manufacturer → customer
    
    // Complex modern flows (e-commerce, direct sales)
    { from: 's', to: 't', prob: 0.08, weight: 70000 },    // Direct supplier → retailer
    { from: 's', to: 'c', prob: 0.03, weight: 30000 },    // Direct supplier → customer
  ];
  
  connections.forEach(({ from, to, prob, weight }) => {
    if (edgeId >= targetEdges) return;
    
    console.log(`Connecting ${getFullNodeType(from)} → ${getFullNodeType(to)}...`);
    
    const fromNodes = nodesByType[from] || [];
    const toNodes = nodesByType[to] || [];
    
    let connectionsMade = 0;
    const maxConnections = Math.min(weight, targetEdges - edgeId);
    
    // Smart sampling for maximum connectivity
    const sampleRatio = Math.min(1.0, maxConnections / (fromNodes.length * prob * 3));
    const sampleSize = Math.ceil(fromNodes.length * sampleRatio);
    
    for (let i = 0; i < sampleSize && connectionsMade < maxConnections; i++) {
      const fromNode = fromNodes[Math.floor(Math.random() * fromNodes.length)];
      
      // Each from node makes multiple connections (realistic hub behavior)
      const connectionsPerNode = Math.ceil(Math.random() * 8) + 2; // 2-10 connections per node
      
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
  writeStream.write(`"totalNodes":${nodeId},"totalEdges":${edgeId},"industry":"Global Manufacturing","region":"Worldwide","layout":"optimal-wide-organic","generated":"${new Date().toISOString()}"`);
  writeStream.write('}}');
  
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      console.log(`\n🎉 4M OPTIMAL generation complete!`);
      console.log(`📊 Total nodes: ${nodeId.toLocaleString()}`);
      console.log(`🔗 Total edges: ${edgeId.toLocaleString()}`);
      console.log(`📁 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📐 Layout: Ultra-wide organic (200K x 100K) with flowing boundaries`);
      console.log(`⚡ Connectivity ratio: ${(edgeId/nodeId).toFixed(1)} edges per node`);
      resolve();
    });
  });
}

generate4MGraph().then(() => {
  console.log('✅ 4M optimal graph completed!');
}).catch(err => {
  console.error('❌ Failed:', err);
});