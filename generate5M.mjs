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

function generate5MGraph() {
  console.log('Generating 5M node graph - targeting <350MB...');
  
  const nodeCount = 5000000;
  const tierDistribution = {
    'r': Math.floor(nodeCount * 0.5),    // 2.5M
    's': Math.floor(nodeCount * 0.25),   // 1.25M
    'm': Math.floor(nodeCount * 0.1),    // 500K
    'd': Math.floor(nodeCount * 0.08),   // 400K
    't': Math.floor(nodeCount * 0.05),   // 250K
    'w': Math.floor(nodeCount * 0.02)    // 100K
  };
  
  const outputPath = path.join(process.cwd(), 'public/data/samples/sample_5000000_static_positions.json');
  const writeStream = fs.createWriteStream(outputPath);
  
  writeStream.write('{"nodes":[');
  
  let nodeId = 0;
  let firstNode = true;
  
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    console.log(`Generating ${count} ${getFullNodeType(nodeType)} nodes...`);
    
    const tier = getTierNumber(nodeType);
    const tierSpacing = 10000; // Large spacing
    
    const cols = Math.ceil(Math.sqrt(count * 2));
    const rows = Math.ceil(count / cols);
    const cellWidth = 80000 / cols; // Large grid
    const cellHeight = 40000 / rows;
    
    const batchSize = 25000;
    
    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = Math.round((col - cols / 2) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.8);
        const y = Math.round(tier * tierSpacing + (row - rows / 2) * cellHeight / 6);
        
        const node = {
          id: `${nodeType}${nodeId}`,
          type: getFullNodeType(nodeType),
          tier: tier,
          x: x,
          y: y
        };
        
        if (!firstNode) writeStream.write(',');
        writeStream.write(JSON.stringify(node));
        firstNode = false;
        nodeId++;
      }
      
      console.log(`  Progress: ${batchEnd}/${count} (${Math.round(batchEnd/count*100)}%)`);
    }
  });
  
  writeStream.write('],"edges":[');
  
  // Minimal edges
  const edges = [];
  for (let i = 0; i < 1000; i++) {
    edges.push({
      id: `e${i}`,
      source: `r${Math.floor(Math.random() * 2500000)}`,
      target: `s${Math.floor(Math.random() * 1250000)}`,
      type: 'flow'
    });
  }
  
  edges.forEach((edge, index) => {
    if (index > 0) writeStream.write(',');
    writeStream.write(JSON.stringify(edge));
  });
  
  writeStream.write('],"metadata":{');
  writeStream.write(`"totalNodes":${nodeId},"totalEdges":${edges.length},"industry":"Global Manufacturing","region":"Worldwide","layout":"5m-optimized","generated":"${new Date().toISOString()}"`);
  writeStream.write('}}');
  
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      console.log(`\n5M generation complete!`);
      console.log(`Total nodes: ${nodeId}`);
      console.log(`Total edges: ${edges.length}`);
      console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      resolve();
    });
  });
}

generate5MGraph().then(() => {
  console.log('✅ 5M graph completed!');
}).catch(err => {
  console.error('❌ Failed:', err);
});