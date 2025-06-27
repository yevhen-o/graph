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

function generateUltraMassiveGraph(nodeCount = 10000000) {
  console.log('Starting generation of 10M node graph...');
  console.log('WARNING: This will create a ~2GB file and may take several minutes');
  
  const startTime = Date.now();
  
  // Ultra-minimal tier distribution (focused on raw materials for performance)
  const tierDistribution = {
    'r': Math.floor(nodeCount * 0.5),    // 5M raw materials
    's': Math.floor(nodeCount * 0.25),   // 2.5M suppliers
    'm': Math.floor(nodeCount * 0.1),    // 1M manufacturers
    'd': Math.floor(nodeCount * 0.08),   // 800K distributors
    't': Math.floor(nodeCount * 0.05),   // 500K retailers
    'w': Math.floor(nodeCount * 0.02)    // 200K warehouses
  };
  
  // Start writing the file immediately using streaming
  const outputPath = path.join(process.cwd(), 'public/data/samples/sample_10000000_static_positions.json');
  const writeStream = fs.createWriteStream(outputPath);
  
  // Start JSON structure
  writeStream.write('{\n  "nodes": [\n');
  
  let nodeId = 0;
  let firstNode = true;
  
  // Generate nodes in batches to manage memory
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count} ${getFullNodeType(nodeType)} nodes...`);
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 2000; // Large spacing for 10M nodes
    
    // Ultra-wide grid for massive node count
    const cols = Math.ceil(Math.sqrt(count * 4)); // Even wider
    const rows = Math.ceil(count / cols);
    const cellWidth = 20000 / cols; // Huge grid
    const cellHeight = 8000 / rows;
    
    const batchSize = 10000; // Process in batches of 10K
    
    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      let batchData = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Grid position with minimal randomness
        const x = Math.round(((col - cols / 2) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.5) * 10) / 10;
        const y = Math.round((tier * tierSpacing + (row - rows / 2) * cellHeight / 6) * 10) / 10;
        
        // Ultra-minimal node structure
        const node = {
          id: `${nodeType}${nodeId}`, // Ultra-short IDs
          type: getFullNodeType(nodeType),
          tier: tier,
          x: x,
          y: y,
          size: 'small' // All nodes small for performance
        };
        
        batchData.push(node);
        nodeId++;
      }
      
      // Write batch to file
      batchData.forEach(node => {
        if (!firstNode) writeStream.write(',\n');
        writeStream.write('    ' + JSON.stringify(node));
        firstNode = false;
      });
      
      // Progress update
      console.log(`  Progress: ${batchEnd}/${count} (${Math.round(batchEnd/count*100)}%) - Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
      
      // Clear batch data to free memory
      batchData = null;
      
      // Force garbage collection hint
      if (global.gc) global.gc();
    }
  });
  
  console.log(`Total nodes generated: ${nodeId}`);
  
  // Finish nodes array and start edges (minimal edges for 10M nodes)
  writeStream.write('\n  ],\n  "edges": [\n');
  
  console.log('Generating minimal edges...');
  
  // Only 1000 edges total for 10M nodes - just enough to show connectivity
  const edges = [];
  for (let i = 0; i < 1000; i++) {
    const sourceId = Math.floor(Math.random() * nodeId);
    const targetId = Math.floor(Math.random() * nodeId);
    
    if (sourceId !== targetId) {
      edges.push({
        id: `e${i}`,
        source: `r${sourceId}`, // Assume raw materials as source for simplicity
        target: `s${targetId}`, // Assume supplier as target
        type: 'flow'
      });
    }
  }
  
  // Write edges
  edges.forEach((edge, index) => {
    if (index > 0) writeStream.write(',\n');
    writeStream.write('    ' + JSON.stringify(edge));
  });
  
  // Complete JSON structure
  writeStream.write('\n  ],\n');
  writeStream.write('  "metadata": {\n');
  writeStream.write('    "totalNodes": ' + nodeId + ',\n');
  writeStream.write('    "totalEdges": ' + edges.length + ',\n');
  writeStream.write('    "industry": "Global Manufacturing",\n');
  writeStream.write('    "region": "Worldwide",\n');
  writeStream.write('    "layout": "ultra-hierarchical-grid",\n');
  writeStream.write('    "generated": "' + new Date().toISOString() + '"\n');
  writeStream.write('  }\n');
  writeStream.write('}\n');
  
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      const endTime = Date.now();
      const stats = fs.statSync(outputPath);
      
      console.log(`\nGeneration complete!`);
      console.log(`Total nodes: ${nodeId}`);
      console.log(`Total edges: ${edges.length}`);
      console.log(`Total time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
      console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Saved to: ${outputPath}`);
      console.log('\n🚀 10M node graph ready! This is MASSIVE - be prepared for intense rendering!');
      
      resolve();
    });
  });
}

// Enable garbage collection if available
if (typeof global !== 'undefined' && typeof global.gc === 'function') {
  console.log('Garbage collection enabled for memory optimization');
}

console.log('🔥 EXTREME MODE: Generating 10M node graph...');
console.log('This will push your system to the absolute limits!');
console.log('File size will be ~2GB. Make sure you have enough disk space.\n');

generateUltraMassiveGraph(10000000).then(() => {
  console.log('Generation completed successfully!');
}).catch(err => {
  console.error('Generation failed:', err);
});