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

function generateUltraCompactGraph(nodeCount = 10000000) {
  console.log('Generating ULTRA-COMPACT 10M node graph...');
  console.log('Target: <400MB file size');
  
  const tierDistribution = {
    'r': Math.floor(nodeCount * 0.5),    // 5M
    's': Math.floor(nodeCount * 0.25),   // 2.5M
    'm': Math.floor(nodeCount * 0.1),    // 1M
    'd': Math.floor(nodeCount * 0.08),   // 800K
    't': Math.floor(nodeCount * 0.05),   // 500K
    'w': Math.floor(nodeCount * 0.02)    // 200K
  };
  
  // Start writing immediately to save memory
  const outputPath = path.join(process.cwd(), 'public/data/samples/sample_10000000_compact.json');
  const writeStream = fs.createWriteStream(outputPath);
  
  writeStream.write('{"nodes":[');
  
  let nodeId = 0;
  let firstNode = true;
  
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count} ${getFullNodeType(nodeType)} nodes...`);
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 8000; // Large spacing
    
    const cols = Math.ceil(Math.sqrt(count * 2));
    const rows = Math.ceil(count / cols);
    const cellWidth = 60000 / cols; // Large grid
    const cellHeight = 30000 / rows;
    
    const batchSize = 50000; // Larger batches
    
    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      let batchData = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Ultra-compact node - only essential fields, shortened precision
        const x = Math.round((col - cols / 2) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.8);
        const y = Math.round(tier * tierSpacing + (row - rows / 2) * cellHeight / 6);
        
        // MINIMAL node structure - remove all unnecessary fields
        const node = [
          `${nodeType}${nodeId}`,           // id (string)
          getFullNodeType(nodeType),        // type (string) 
          tier,                             // tier (number)
          x,                                // x (number)
          y                                 // y (number)
        ];
        
        batchData.push(node);
        nodeId++;
      }
      
      // Write batch as compact arrays instead of objects
      batchData.forEach(node => {
        if (!firstNode) writeStream.write(',');
        // Convert array back to minimal object for compatibility
        writeStream.write(JSON.stringify({
          id: node[0],
          type: node[1], 
          tier: node[2],
          x: node[3],
          y: node[4]
        }));
        firstNode = false;
      });
      
      console.log(`  Progress: ${batchEnd}/${count} (${Math.round(batchEnd/count*100)}%)`);
      batchData = null; // Free memory
    }
  });
  
  writeStream.write('],"edges":[');
  
  // Minimal edges - just 500 total
  const edges = [];
  for (let i = 0; i < 500; i++) {
    edges.push({
      id: `e${i}`,
      source: `r${Math.floor(Math.random() * 5000000)}`,
      target: `s${Math.floor(Math.random() * 2500000)}`,
      type: 'flow'
    });
  }
  
  edges.forEach((edge, index) => {
    if (index > 0) writeStream.write(',');
    writeStream.write(JSON.stringify(edge));
  });
  
  writeStream.write('],"metadata":{');
  writeStream.write(`"totalNodes":${nodeId},"totalEdges":${edges.length},"industry":"Global Manufacturing","region":"Worldwide","layout":"ultra-compact","generated":"${new Date().toISOString()}"`);
  writeStream.write('}}');
  
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      console.log(`\nULTRA-COMPACT 10M generation complete!`);
      console.log(`Total nodes: ${nodeId}`);
      console.log(`Total edges: ${edges.length}`);
      console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Saved to: ${outputPath}`);
      resolve();
    });
  });
}

console.log('🚀 ULTRA-COMPACT MODE: 10M nodes with <400MB target...');
generateUltraCompactGraph(10000000).then(() => {
  console.log('✅ Ultra-compact generation completed!');
}).catch(err => {
  console.error('❌ Generation failed:', err);
});