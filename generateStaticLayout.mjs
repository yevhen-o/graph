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

function generateLargeGraph(nodeCount = 100000) {
  const nodes = [];
  const edges = [];
  
  // Tier distribution
  const tierDistribution = {
    'raw_materials': Math.floor(nodeCount * 0.3),
    'supplier': Math.floor(nodeCount * 0.25),
    'manufacturer': Math.floor(nodeCount * 0.15),
    'distributor': Math.floor(nodeCount * 0.15),
    'retailer': Math.floor(nodeCount * 0.1),
    'warehouse': Math.floor(nodeCount * 0.05)
  };
  
  let nodeId = 0;
  
  // Generate nodes with positions
  Object.entries(tierDistribution).forEach(([nodeType, count]) => {
    for (let i = 0; i < count; i++) {
      const tier = getTierNumber(nodeType);
      
      // Calculate position
      const tierSpacing = 800;
      const nodesPerTier = tierDistribution[nodeType];
      const nodeIndex = i;
      
      // Use a radial layout for each tier
      const radius = Math.sqrt(nodesPerTier) * 50;
      const angle = (nodeIndex / nodesPerTier) * Math.PI * 2;
      
      const node = {
        id: `node_${nodeId}`,
        label: `Company ${nodeId}`,
        type: nodeType,
        tier: tier,
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: tier * tierSpacing + Math.sin(angle) * radius / 2 + (Math.random() - 0.5) * 50,
        capacity: Math.floor(Math.random() * 10000) + 1000,
        leadTime: Math.floor(Math.random() * 30) + 1,
        riskScore: Math.random(),
        sustainability: Math.random(),
        size: Math.random() < 0.6 ? 'small' : Math.random() < 0.9 ? 'medium' : 'large',
        industry: 'Global Manufacturing',
        established: 2024 - Math.floor(Math.random() * 50)
      };
      
      nodes.push(node);
      nodeId++;
    }
  });
  
  // Generate edges (limited to 120K)
  let edgeId = 0;
  const maxEdges = 120000;
  const nodesByType = {};
  
  // Group nodes by type
  nodes.forEach(node => {
    if (!nodesByType[node.type]) nodesByType[node.type] = [];
    nodesByType[node.type].push(node);
  });
  
  // Connect tiers
  const connections = [
    ['raw_materials', 'supplier', 0.001],
    ['supplier', 'manufacturer', 0.002],
    ['manufacturer', 'distributor', 0.002],
    ['distributor', 'retailer', 0.003],
    ['distributor', 'warehouse', 0.001],
    ['warehouse', 'retailer', 0.002]
  ];
  
  connections.forEach(([sourceType, targetType, probability]) => {
    const sourceNodes = nodesByType[sourceType] || [];
    const targetNodes = nodesByType[targetType] || [];
    
    sourceNodes.forEach(sourceNode => {
      if (edges.length >= maxEdges) return;
      
      targetNodes.forEach(targetNode => {
        if (edges.length >= maxEdges) return;
        
        if (Math.random() < probability) {
          edges.push({
            id: `edge_${edgeId++}`,
            source: sourceNode.id,
            target: targetNode.id,
            type: 'material_flow',
            weight: Math.random() * 100 + 10,
            volume: Math.floor(Math.random() * 10000) + 100,
            cost: Math.random() * 1000000 + 10000,
            reliability: 0.8 + Math.random() * 0.2,
            speed: Math.floor(Math.random() * 14) + 1
          });
        }
      });
    });
  });
  
  return {
    nodes,
    edges: edges.slice(0, maxEdges),
    metadata: {
      totalValue: edges.reduce((sum, edge) => sum + (edge.volume || 0), 0),
      totalNodes: nodes.length,
      totalEdges: Math.min(edges.length, maxEdges),
      industry: 'Global Manufacturing',
      region: 'Worldwide'
    }
  };
}

console.log('Generating 100K node graph with pre-calculated positions...');
const startTime = Date.now();

const graph = generateLargeGraph(100000);

console.log(`Generated ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
console.log(`Time taken: ${(Date.now() - startTime) / 1000}s`);

// Check positions
const nodesWithPositions = graph.nodes.filter(n => n.x !== undefined && n.y !== undefined).length;
console.log(`Nodes with positions: ${nodesWithPositions}`);

// Save to file
const outputPath = path.join(process.cwd(), 'public/data/samples/sample_100000_static_positions.json');
fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));

console.log(`Saved to: ${outputPath}`);
console.log('File size:', (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2), 'MB');