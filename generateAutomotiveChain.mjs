import fs from 'fs';
import path from 'path';

// Realistic automotive supply chain generator
const AUTOMOTIVE_COMPONENTS = {
  // Primary supplier categories
  ENGINE: ['Engine Block', 'Pistons', 'Crankshaft', 'Valves', 'Turbocharger', 'Fuel Injection'],
  TRANSMISSION: ['Gearbox', 'Clutch', 'Drive Shaft', 'CV Joints', 'Differential'],
  WHEELS: ['Tire Manufacturing', 'Wheel Rims', 'Wheel Bearings', 'Brake Discs', 'Brake Pads'],
  INTERIOR: ['Seat Manufacturing', 'Dashboard', 'Steering Wheel', 'Door Panels', 'Carpet'],
  ELECTRONICS: ['ECU', 'Wiring Harness', 'Sensors', 'Infotainment', 'Lighting'],
  BODY: ['Steel Panels', 'Glass', 'Mirrors', 'Bumpers', 'Paint Shop'],
  SAFETY: ['Airbags', 'Seatbelts', 'ABS System', 'Collision Sensors'],
  HVAC: ['Air Conditioning', 'Heating System', 'Ventilation', 'Filters'],
  EXHAUST: ['Exhaust Manifold', 'Catalytic Converter', 'Muffler', 'Exhaust Pipes'],
  SUSPENSION: ['Shock Absorbers', 'Springs', 'Struts', 'Anti-roll Bars']
};

const RAW_MATERIALS = [
  // Metals
  'Steel Coils', 'Aluminum Sheets', 'Cast Iron', 'Copper Wire', 'Titanium Alloy',
  'Stainless Steel', 'Brass Fittings', 'Zinc Coating', 'Chrome Plating',
  // Plastics & Polymers
  'ABS Plastic', 'Polypropylene', 'Polyethylene', 'PVC', 'Rubber Compounds',
  'Foam Padding', 'Vinyl', 'Polyurethane', 'Carbon Fiber',
  // Chemicals
  'Paint Base', 'Primer', 'Clear Coat', 'Adhesives', 'Lubricants',
  'Coolant', 'Brake Fluid', 'Engine Oil', 'Transmission Fluid',
  // Electronics
  'Silicon Wafers', 'Printed Circuit Boards', 'Semiconductors', 'Resistors',
  'Capacitors', 'LED Components', 'Wire Insulation', 'Connectors',
  // Glass & Ceramics
  'Float Glass', 'Tempered Glass', 'Ceramic Components', 'Optical Elements',
  // Textiles
  'Fabric', 'Leather', 'Thread', 'Insulation Material'
];

const WAREHOUSE_TYPES = [
  'Regional Distribution Center', 'Parts Consolidation Hub', 'JIT Staging Area',
  'Cross-dock Facility', 'Bulk Storage Warehouse', 'Climate-controlled Storage',
  'Automotive Parts DC', 'Tier 1 Buffer Stock', 'Emergency Inventory Hub',
  'Quality Control Center', 'Packaging & Assembly', 'Import Processing Center'
];

const COMPANY_NAMES = {
  PRIMARY: [
    'Bosch Automotive', 'Continental AG', 'Denso Corporation', 'Magna International',
    'ZF Friedrichshafen', 'Aptiv', 'Valeo', 'Forvia', 'Hyundai Mobis',
    'Aisin Corporation', 'Lear Corporation', 'Adient', 'BorgWarner',
    'Schaeffler Group', 'Tenneco', 'Mahle', 'Yanfeng', 'Gestamp',
    'Plastic Omnium', 'Webasto', 'Brembo', 'Michelin', 'Bridgestone',
    'Goodyear', 'Pirelli', 'Saint-Gobain', 'AGC Automotive', 'Pilkington',
    'Gentex Corporation', 'Autoliv', 'Takata (Legacy)', 'Joyson Safety',
    'Delphi Technologies', 'Marelli', 'Sumitomo Electric', 'Yazaki',
    'Leoni', 'Furukawa Electric', 'TE Connectivity', 'Molex Automotive',
    'Amphenol', 'Harman International', 'Alpine Electronics', 'Pioneer',
    'JVC Kenwood', 'Panasonic Automotive', 'LG Electronics', 'Samsung SDI',
    'CATL Battery', 'BYD Auto', 'Tesla Parts Division', 'Ford Supplier Network'
  ],
  TIER2: [
    'Precision Components Ltd', 'Advanced Manufacturing Co', 'MicroTech Solutions',
    'Industrial Fabricators', 'Specialty Alloys Inc', 'Custom Plastics Corp',
    'Electronic Systems Ltd', 'Automotive Castings', 'Progressive Tooling',
    'Quality Assemblies', 'Innovative Materials', 'Rapid Prototyping Co'
  ],
  TIER3: [
    'Local Machine Shop', 'Regional Supplier Co', 'Component Specialists',
    'Manufacturing Partners', 'Quality Parts Inc', 'Precision Engineering',
    'Industrial Solutions', 'Custom Components', 'Specialty Manufacturing'
  ]
};

function generateAutomotiveSupplyChain() {
  console.log('🚗 Generating Realistic Automotive Supply Chain...');
  console.log('Structure: Car Company → 50 Primary Suppliers → Multi-tier Network → Raw Materials');
  
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  let edgeId = 0;
  
  // Track nodes by tier for connection logic
  const nodesByTier = {
    0: [], // Car Company
    1: [], // Primary Suppliers (Tier 1)
    2: [], // Tier 2 Suppliers
    3: [], // Tier 3 Suppliers
    4: [], // Tier 4 Suppliers
    5: [], // Tier 5 Suppliers
    6: [], // Warehouses
    7: []  // Raw Materials
  };
  
  // 1. Car Company (Central Hub)
  const carCompany = {
    id: `company_${nodeId}`,
    type: 'manufacturer', // Car company as main manufacturer
    tier: 0,
    label: 'Global Automotive Corp',
    x: 0, // Center position
    y: 0,
    size: 12, // Will be recalculated based on connections
    importance: 1.0,
    riskScore: 0.1 + Math.random() * 0.1 // Low risk (0.1-0.2) - Central hub with many alternatives
  };
  nodes.push(carCompany);
  nodesByTier[0].push(carCompany.id);
  nodeId++;
  
  console.log('Created car company:', carCompany.label);
  
  // 2. Primary Suppliers (Tier 1) - 50 suppliers
  const componentCategories = Object.keys(AUTOMOTIVE_COMPONENTS);
  const suppliersPerCategory = Math.ceil(50 / componentCategories.length);
  
  componentCategories.forEach((category, categoryIndex) => {
    const components = AUTOMOTIVE_COMPONENTS[category];
    
    for (let i = 0; i < suppliersPerCategory && nodesByTier[1].length < 50; i++) {
      // Group suppliers by category for better organization
      const suppliersInCategory = Math.ceil(50 / componentCategories.length);
      const categoryStartAngle = (categoryIndex / componentCategories.length) * Math.PI * 2;
      const categoryAngleSpan = (Math.PI * 2) / componentCategories.length * 0.8; // 80% of section to leave gaps
      const supplierIndexInCategory = nodesByTier[1].filter(id => 
        nodes.find(n => n.id === id)?.category === category
      ).length;
      
      const angle = categoryStartAngle + (supplierIndexInCategory / suppliersInCategory) * categoryAngleSpan;
      const radius = 400; // Increased distance from center for better spacing
      
      // Calculate risk score based on category importance
      const criticalCategories = ['ENGINE', 'ELECTRONICS', 'SAFETY'];
      const isCritical = criticalCategories.includes(category);
      const baseRisk = isCritical ? 0.4 : 0.3;
      const riskRange = 0.3; // 0.3 range for variation
      
      const supplier = {
        id: `supplier_t1_${nodeId}`,
        type: 'supplier',
        tier: 1,
        label: `${COMPANY_NAMES.PRIMARY[nodesByTier[1].length % COMPANY_NAMES.PRIMARY.length]} (${category})`,
        component: components[i % components.length],
        category: category,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 8, // Will be recalculated based on connections
        importance: 0.8,
        riskScore: baseRisk + Math.random() * riskRange // Medium risk (0.3-0.6) - Critical but established suppliers
      };
      
      nodes.push(supplier);
      nodesByTier[1].push(supplier.id);
      nodeId++;
      
      // Connect to car company
      edges.push({
        id: `edge_${edgeId}`,
        source: supplier.id,
        target: carCompany.id,
        type: 'flow',
        weight: Math.random() * 50 + 50 // Higher importance
      });
      edgeId++;
    }
  });
  
  console.log(`Created ${nodesByTier[1].length} primary suppliers`);
  
  // 3. Tier 2 Suppliers (Expanding network)
  nodesByTier[1].forEach((tier1Id, index) => {
    const tier1Node = nodes.find(n => n.id === tier1Id);
    const connectionsCount = Math.floor(Math.random() * 6) + 3; // 3-8 connections per Tier 1
    
    for (let i = 0; i < connectionsCount; i++) {
      const angle = (i / connectionsCount) * Math.PI * 2 + (index * 0.3); // Spread around Tier 1
      const radius = 200; // Increased radius for better separation
      
      const tier2Supplier = {
        id: `supplier_t2_${nodeId}`,
        type: 'supplier',
        tier: 2,
        label: `${COMPANY_NAMES.TIER2[nodeId % COMPANY_NAMES.TIER2.length]}`,
        parentCategory: tier1Node.category,
        x: tier1Node.x + Math.cos(angle) * radius,
        y: tier1Node.y + Math.sin(angle) * radius,
        size: 6, // Will be recalculated based on connections
        importance: 0.6,
        riskScore: 0.4 + Math.random() * 0.3 // Medium-high risk (0.4-0.7) - Fewer alternatives
      };
      
      nodes.push(tier2Supplier);
      nodesByTier[2].push(tier2Supplier.id);
      nodeId++;
      
      // Connect to Tier 1
      edges.push({
        id: `edge_${edgeId}`,
        source: tier2Supplier.id,
        target: tier1Id,
        type: 'flow',
        weight: Math.random() * 30 + 20
      });
      edgeId++;
    }
  });
  
  console.log(`Created ${nodesByTier[2].length} tier 2 suppliers`);
  
  // 4. Tier 3 Suppliers (Further expansion)
  nodesByTier[2].forEach((tier2Id, index) => {
    const tier2Node = nodes.find(n => n.id === tier2Id);
    const connectionsCount = Math.floor(Math.random() * 4) + 2; // 2-5 connections per Tier 2
    
    for (let i = 0; i < connectionsCount; i++) {
      const angle = (i / connectionsCount) * Math.PI * 2 + (index * 0.2);
      const radius = 180; // Increased radius for Tier 3
      
      const tier3Supplier = {
        id: `supplier_t3_${nodeId}`,
        type: 'supplier',
        tier: 3,
        label: `${COMPANY_NAMES.TIER3[nodeId % COMPANY_NAMES.TIER3.length]}`,
        x: tier2Node.x + Math.cos(angle) * radius,
        y: tier2Node.y + Math.sin(angle) * radius,
        size: 4, // Will be recalculated based on connections
        importance: 0.4,
        riskScore: 0.6 + Math.random() * 0.3 // High risk (0.6-0.9) - Specialized, limited alternatives
      };
      
      nodes.push(tier3Supplier);
      nodesByTier[3].push(tier3Supplier.id);
      nodeId++;
      
      edges.push({
        id: `edge_${edgeId}`,
        source: tier3Supplier.id,
        target: tier2Id,
        type: 'flow',
        weight: Math.random() * 20 + 10
      });
      edgeId++;
    }
  });
  
  console.log(`Created ${nodesByTier[3].length} tier 3 suppliers`);
  
  // 5. Warehouses (Parallel network with collapse pattern)
  const warehouseCount = Math.floor(nodesByTier[1].length * 0.6); // ~30 warehouses for 50 suppliers
  
  for (let i = 0; i < warehouseCount; i++) {
    const angle = (i / warehouseCount) * Math.PI * 2;
    const radius = 1400; // Much further out for clear separation from suppliers
    
    const warehouse = {
      id: `warehouse_${nodeId}`,
      type: 'warehouse',
      tier: 6, // Special tier for warehouses
      label: `${WAREHOUSE_TYPES[i % WAREHOUSE_TYPES.length]} ${i + 1}`,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: 6, // Will be recalculated based on connections
      importance: 0.5,
      riskScore: 0.2 + Math.random() * 0.3 // Low-medium risk (0.2-0.5) - Infrastructure, replaceable
    };
    
    nodes.push(warehouse);
    nodesByTier[6].push(warehouse.id);
    nodeId++;
  }
  
  console.log(`Created ${nodesByTier[6].length} warehouses`);
  
  // 6. Raw Materials (Collapse pattern)
  for (let i = 0; i < RAW_MATERIALS.length; i++) {
    const angle = (i / RAW_MATERIALS.length) * Math.PI * 2;
    const radius = 1600; // Outermost ring - beyond warehouses
    
    const rawMaterial = {
      id: `raw_${nodeId}`,
      type: 'raw_materials',
      tier: 7,
      label: RAW_MATERIALS[i],
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: 3, // Will be recalculated based on connections
      importance: 0.3,
      riskScore: 0.3 + Math.random() * 0.3 // Medium risk (0.3-0.6) - Commodity availability varies
    };
    
    nodes.push(rawMaterial);
    nodesByTier[7].push(rawMaterial.id);
    nodeId++;
  }
  
  console.log(`Created ${nodesByTier[7].length} raw materials`);
  
  // 7. Connect Warehouses to Suppliers (Some suppliers depend on warehouses)
  nodesByTier[1].forEach(tier1Id => {
    if (Math.random() < 0.4) { // 40% of Tier 1 suppliers use warehouses
      const warehouseId = nodesByTier[6][Math.floor(Math.random() * nodesByTier[6].length)];
      edges.push({
        id: `edge_${edgeId}`,
        source: warehouseId,
        target: tier1Id,
        type: 'flow',
        weight: Math.random() * 25 + 15
      });
      edgeId++;
    }
  });
  
  nodesByTier[2].forEach(tier2Id => {
    if (Math.random() < 0.3) { // 30% of Tier 2 suppliers use warehouses
      const warehouseId = nodesByTier[6][Math.floor(Math.random() * nodesByTier[6].length)];
      edges.push({
        id: `edge_${edgeId}`,
        source: warehouseId,
        target: tier2Id,
        type: 'flow',
        weight: Math.random() * 20 + 10
      });
      edgeId++;
    }
  });
  
  // 8. Connect Raw Materials to Suppliers and Warehouses (Collapse pattern)
  // Raw materials feed into multiple suppliers (many-to-many collapse)
  nodesByTier[7].forEach(rawId => {
    // Each raw material feeds into 2-5 tier 3 suppliers
    const tier3Connections = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < tier3Connections; i++) {
      const tier3Id = nodesByTier[3][Math.floor(Math.random() * nodesByTier[3].length)];
      edges.push({
        id: `edge_${edgeId}`,
        source: rawId,
        target: tier3Id,
        type: 'flow',
        weight: Math.random() * 15 + 5
      });
      edgeId++;
    }
    
    // Some raw materials go directly to warehouses
    if (Math.random() < 0.3) {
      const warehouseId = nodesByTier[6][Math.floor(Math.random() * nodesByTier[6].length)];
      edges.push({
        id: `edge_${edgeId}`,
        source: rawId,
        target: warehouseId,
        type: 'flow',
        weight: Math.random() * 20 + 10
      });
      edgeId++;
    }
  });
  
  // 9. Warehouse-to-Warehouse connections (Regional consolidation - collapse pattern)
  const regionalHubs = nodesByTier[6].slice(0, 5); // First 5 warehouses are regional hubs
  nodesByTier[6].forEach(warehouseId => {
    if (!regionalHubs.includes(warehouseId) && Math.random() < 0.4) {
      const hubId = regionalHubs[Math.floor(Math.random() * regionalHubs.length)];
      edges.push({
        id: `edge_${edgeId}`,
        source: warehouseId,
        target: hubId,
        type: 'flow',
        weight: Math.random() * 15 + 10
      });
      edgeId++;
    }
  });
  
  // Calculate dynamic node sizes based on connections
  console.log('\\n📏 Calculating dynamic node sizes based on connections...');
  
  function getTierMultiplier(tier) {
    switch(tier) {
      case 0: return 1.5; // Car Company - ensure it stays largest
      case 1: return 1.2; // Tier 1 Suppliers - important suppliers
      case 2: return 1.0; // Tier 2 Suppliers - standard
      case 3: return 1.0; // Tier 3 Suppliers - standard
      case 6: return 1.1; // Warehouses - distribution importance
      case 7: return 0.9; // Raw Materials - leaf nodes
      default: return 1.0;
    }
  }
  
  function calculateNodeSize(nodeId, allEdges, baseTierSize, tier) {
    // Count connections for this node
    const connections = allEdges.filter(edge => edge.source === nodeId || edge.target === nodeId);
    const connectionCount = connections.length;
    
    // Calculate weighted connections considering edge weights
    const weightedConnections = connections.reduce((sum, edge) => sum + (edge.weight || 1), 0);
    
    // Base size + connection bonus + tier multiplier
    const connectionBonus = Math.sqrt(connectionCount) * 1.5; // Square root for better scaling
    const weightBonus = Math.log(weightedConnections + 1) * 0.3; // Log scaling for weights
    const tierMultiplier = getTierMultiplier(tier);
    
    const calculatedSize = (baseTierSize + connectionBonus + weightBonus) * tierMultiplier;
    
    // Ensure reasonable size bounds
    return Math.max(3, Math.min(25, Math.round(calculatedSize)));
  }
  
  // Update node sizes based on their connections
  nodes.forEach(node => {
    const baseTierSize = node.size; // Use current size as base
    node.size = calculateNodeSize(node.id, edges, baseTierSize, node.tier);
  });
  
  // Log size distribution for analysis
  const sizeStats = nodes.reduce((stats, node) => {
    const tier = node.tier;
    if (!stats[tier]) {
      stats[tier] = { min: node.size, max: node.size, avg: 0, count: 0, total: 0 };
    }
    stats[tier].min = Math.min(stats[tier].min, node.size);
    stats[tier].max = Math.max(stats[tier].max, node.size);
    stats[tier].total += node.size;
    stats[tier].count += 1;
    return stats;
  }, {});
  
  Object.keys(sizeStats).forEach(tier => {
    const stat = sizeStats[tier];
    stat.avg = Math.round((stat.total / stat.count) * 10) / 10;
  });
  
  console.log('📊 Node size distribution by tier:');
  console.log('Tier 0 (Car Company):', sizeStats[0] ? `${sizeStats[0].min}-${sizeStats[0].max} (avg: ${sizeStats[0].avg})` : 'N/A');
  console.log('Tier 1 (Primary Suppliers):', sizeStats[1] ? `${sizeStats[1].min}-${sizeStats[1].max} (avg: ${sizeStats[1].avg})` : 'N/A');
  console.log('Tier 2 (Secondary Suppliers):', sizeStats[2] ? `${sizeStats[2].min}-${sizeStats[2].max} (avg: ${sizeStats[2].avg})` : 'N/A');
  console.log('Tier 3 (Tertiary Suppliers):', sizeStats[3] ? `${sizeStats[3].min}-${sizeStats[3].max} (avg: ${sizeStats[3].avg})` : 'N/A');
  console.log('Tier 6 (Warehouses):', sizeStats[6] ? `${sizeStats[6].min}-${sizeStats[6].max} (avg: ${sizeStats[6].avg})` : 'N/A');
  console.log('Tier 7 (Raw Materials):', sizeStats[7] ? `${sizeStats[7].min}-${sizeStats[7].max} (avg: ${sizeStats[7].avg})` : 'N/A');
  
  const graphData = {
    nodes: nodes,
    edges: edges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      industry: 'Automotive Manufacturing',
      region: 'Global',
      layout: 'automotive-supply-chain',
      structure: 'realistic-hierarchical-with-warehouses',
      generated: new Date().toISOString(),
      description: 'Realistic automotive supply chain with expanding supplier network and collapsing warehouse/raw material patterns'
    }
  };
  
  console.log('\\n📊 Automotive Supply Chain Generated:');
  console.log(`🏭 Car Company: 1`);
  console.log(`🔧 Tier 1 Suppliers: ${nodesByTier[1].length}`);
  console.log(`⚙️ Tier 2 Suppliers: ${nodesByTier[2].length}`);
  console.log(`🔩 Tier 3 Suppliers: ${nodesByTier[3].length}`);
  console.log(`📦 Warehouses: ${nodesByTier[6].length}`);
  console.log(`🏗️ Raw Materials: ${nodesByTier[7].length}`);
  console.log(`📊 Total Nodes: ${nodes.length}`);
  console.log(`🔗 Total Edges: ${edges.length}`);
  console.log(`⚡ Connectivity Ratio: ${(edges.length / nodes.length).toFixed(2)} edges per node`);
  
  return graphData;
}

// Generate and save the automotive supply chain
const automotiveChain = generateAutomotiveSupplyChain();
const outputPath = path.join(process.cwd(), 'public/data/samples/sample_automotive_realistic.json');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(automotiveChain, null, 2));

const stats = fs.statSync(outputPath);
console.log(`\\n✅ Automotive supply chain saved to: ${outputPath}`);
console.log(`📁 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`\\n🎯 Perfect for testing: ${automotiveChain.nodes.length} nodes fits well within your 2-5M browser limits!`);