import fs from 'fs';

/**
 * Enhanced dataset generator that creates a realistic lithium supply chain crisis simulation
 * Based on the existing automotive realistic dataset with added lithium dependencies
 */

// Load the base automotive realistic dataset
const baseDataset = JSON.parse(fs.readFileSync('./public/data/samples/sample_automotive_realistic.json', 'utf8'));

console.log('Base dataset loaded:', {
  nodes: baseDataset.nodes.length,
  edges: baseDataset.edges.length
});

// Extract existing data
let { nodes, edges } = baseDataset;

// Find the main automotive company (tier 0)
const mainCompany = nodes.find(node => node.tier === 0 && node.type === 'manufacturer');
console.log('Main company:', mainCompany.label);

// Find existing battery suppliers (if any)
const existingBatterySuppliers = nodes.filter(node => 
  node.label && node.label.toLowerCase().includes('battery')
);
console.log('Existing battery suppliers:', existingBatterySuppliers.length);

// Generate lithium supply chain components
const lithiumSupplyChain = {
  rawMaterials: [
    {
      id: 'lithium_carbonate_raw',
      type: 'raw_materials',
      tier: 7,
      label: 'Lithium Carbonate',
      material: 'lithium_carbonate',
      origin: 'Chile (Atacama Desert)',
      x: 1650,
      y: -200,
      size: 8,
      importance: 0.9, // High importance
      riskScore: 0.85 // High risk - single source of critical material
    },
    {
      id: 'lithium_hydroxide_raw',
      type: 'raw_materials',
      tier: 7,
      label: 'Lithium Hydroxide',
      material: 'lithium_hydroxide',
      origin: 'Australia (Spodumene)',
      x: 1620,
      y: -160,
      size: 7,
      importance: 0.85,
      riskScore: 0.80
    }
  ],
  
  processors: [
    {
      id: 'lithium_processor_1',
      type: 'supplier',
      tier: 6,
      label: 'Ganfeng Lithium (Processing)',
      component: 'Battery Grade Lithium',
      category: 'LITHIUM_PROCESSING',
      specialization: 'lithium_refining',
      x: 1400,
      y: -200,
      size: 12,
      importance: 0.85,
      riskScore: 0.75
    },
    {
      id: 'lithium_processor_2',
      type: 'supplier',
      tier: 6,
      label: 'Albemarle Corporation',
      component: 'High-Purity Lithium',
      category: 'LITHIUM_PROCESSING',
      specialization: 'lithium_refining',
      x: 1380,
      y: -160,
      size: 11,
      importance: 0.80,
      riskScore: 0.70
    }
  ],
  
  batteryManufacturers: [
    {
      id: 'battery_mfg_catl',
      type: 'supplier',
      tier: 4,
      label: 'CATL (Battery Cells)',
      component: 'Lithium-Ion Battery Cells',
      category: 'BATTERY_MANUFACTURING',
      specialization: 'battery_cells',
      x: 1200,
      y: -200,
      size: 15,
      importance: 0.9,
      riskScore: 0.65
    },
    {
      id: 'battery_mfg_byd',
      type: 'supplier',
      tier: 4,
      label: 'BYD Battery Division',
      component: 'LFP Battery Cells',
      category: 'BATTERY_MANUFACTURING',
      specialization: 'battery_cells',
      x: 1180,
      y: -160,
      size: 14,
      importance: 0.85,
      riskScore: 0.60
    },
    {
      id: 'battery_mfg_panasonic',
      type: 'supplier',
      tier: 4,
      label: 'Panasonic Energy',
      component: 'High-Energy Battery Cells',
      category: 'BATTERY_MANUFACTURING',
      specialization: 'battery_cells',
      x: 1160,
      y: -120,
      size: 13,
      importance: 0.80,
      riskScore: 0.55
    }
  ],
  
  batteryPackAssemblers: [
    {
      id: 'battery_pack_asm_1',
      type: 'supplier',
      tier: 2,
      label: 'Bosch Battery Systems',
      component: 'Complete Battery Packs',
      category: 'BATTERY_SYSTEMS',
      specialization: 'battery_packs',
      x: 800,
      y: -200,
      size: 17,
      importance: 0.9,
      riskScore: 0.50
    },
    {
      id: 'battery_pack_asm_2',
      type: 'supplier',
      tier: 2,
      label: 'Continental Battery Systems',
      component: 'EV Battery Modules',
      category: 'BATTERY_SYSTEMS',
      specialization: 'battery_packs',
      x: 780,
      y: -160,
      size: 16,
      importance: 0.85,
      riskScore: 0.45
    }
  ],
  
  evSuppliers: [
    {
      id: 'ev_supplier_1',
      type: 'supplier',
      tier: 1,
      label: 'Tesla Automotive (EV Systems)',
      component: 'Complete EV Powertrain',
      category: 'EV_SYSTEMS',
      specialization: 'electric_vehicles',
      x: 400,
      y: -200,
      size: 20,
      importance: 0.95,
      riskScore: 0.40
    },
    {
      id: 'ev_supplier_2',
      type: 'supplier',
      tier: 1,
      label: 'Magna EV Division',
      component: 'EV Integration Systems',
      category: 'EV_SYSTEMS',
      specialization: 'electric_vehicles',
      x: 380,
      y: -160,
      size: 18,
      importance: 0.90,
      riskScore: 0.35
    }
  ]
};

// Create supply chain edges connecting lithium to the automotive company
const lithiumSupplyChainEdges = [
  // Raw materials to processors
  {
    id: 'edge_lithium_1',
    source: 'lithium_carbonate_raw',
    target: 'lithium_processor_1',
    type: 'material_flow',
    weight: 85.0
  },
  {
    id: 'edge_lithium_2',
    source: 'lithium_hydroxide_raw',
    target: 'lithium_processor_2',
    type: 'material_flow',
    weight: 80.0
  },
  {
    id: 'edge_lithium_3',
    source: 'lithium_carbonate_raw',
    target: 'lithium_processor_2',
    type: 'material_flow',
    weight: 60.0
  },
  
  // Processors to battery manufacturers
  {
    id: 'edge_lithium_4',
    source: 'lithium_processor_1',
    target: 'battery_mfg_catl',
    type: 'material_flow',
    weight: 90.0
  },
  {
    id: 'edge_lithium_5',
    source: 'lithium_processor_1',
    target: 'battery_mfg_byd',
    type: 'material_flow',
    weight: 85.0
  },
  {
    id: 'edge_lithium_6',
    source: 'lithium_processor_2',
    target: 'battery_mfg_panasonic',
    type: 'material_flow',
    weight: 80.0
  },
  {
    id: 'edge_lithium_7',
    source: 'lithium_processor_2',
    target: 'battery_mfg_catl',
    type: 'material_flow',
    weight: 75.0
  },
  
  // Battery manufacturers to pack assemblers
  {
    id: 'edge_lithium_8',
    source: 'battery_mfg_catl',
    target: 'battery_pack_asm_1',
    type: 'component_flow',
    weight: 95.0
  },
  {
    id: 'edge_lithium_9',
    source: 'battery_mfg_byd',
    target: 'battery_pack_asm_2',
    type: 'component_flow',
    weight: 90.0
  },
  {
    id: 'edge_lithium_10',
    source: 'battery_mfg_panasonic',
    target: 'battery_pack_asm_1',
    type: 'component_flow',
    weight: 85.0
  },
  
  // Pack assemblers to EV suppliers
  {
    id: 'edge_lithium_11',
    source: 'battery_pack_asm_1',
    target: 'ev_supplier_1',
    type: 'system_flow',
    weight: 95.0
  },
  {
    id: 'edge_lithium_12',
    source: 'battery_pack_asm_2',
    target: 'ev_supplier_2',
    type: 'system_flow',
    weight: 90.0
  },
  
  // EV suppliers to main company
  {
    id: 'edge_lithium_13',
    source: 'ev_supplier_1',
    target: mainCompany.id,
    type: 'integration_flow',
    weight: 98.0
  },
  {
    id: 'edge_lithium_14',
    source: 'ev_supplier_2',
    target: mainCompany.id,
    type: 'integration_flow',
    weight: 95.0
  }
];

// Add all lithium supply chain components to the dataset
const allLithiumNodes = [
  ...lithiumSupplyChain.rawMaterials,
  ...lithiumSupplyChain.processors,
  ...lithiumSupplyChain.batteryManufacturers,
  ...lithiumSupplyChain.batteryPackAssemblers,
  ...lithiumSupplyChain.evSuppliers
];

// Update node and edge arrays
nodes = [...nodes, ...allLithiumNodes];
edges = [...edges, ...lithiumSupplyChainEdges];

// Create enhanced dataset with metadata
const enhancedDataset = {
  nodes,
  edges,
  metadata: {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    lithiumNodes: allLithiumNodes.length,
    lithiumEdges: lithiumSupplyChainEdges.length,
    crisisSimulation: {
      enabled: true,
      criticalMaterials: ['lithium_carbonate', 'lithium_hydroxide'],
      riskSources: ['lithium_carbonate_raw', 'lithium_hydroxide_raw']
    },
    industry: 'Automotive with EV Supply Chain',
    region: 'Global with Lithium Dependencies',
    generatedAt: new Date().toISOString(),
    description: 'Realistic automotive supply chain with lithium crisis simulation capabilities'
  }
};

// Save the enhanced dataset
const outputPath = './public/data/samples/sample_automotive_lithium_crisis.json';
fs.writeFileSync(outputPath, JSON.stringify(enhancedDataset, null, 2));

console.log('✅ Enhanced lithium crisis dataset created successfully!');
console.log('📊 Dataset Statistics:');
console.log(`   • Total Nodes: ${enhancedDataset.metadata.totalNodes}`);
console.log(`   • Total Edges: ${enhancedDataset.metadata.totalEdges}`);
console.log(`   • Added Lithium Nodes: ${allLithiumNodes.length}`);
console.log(`   • Added Lithium Edges: ${lithiumSupplyChainEdges.length}`);
console.log(`   • Output File: ${outputPath}`);

// Create a summary of the lithium supply chain
console.log('\n🔋 Lithium Supply Chain Structure:');
console.log('   Raw Materials → Processors → Battery Manufacturers → Pack Assemblers → EV Suppliers → Automotive Company');
console.log(`   Path Length: 6 tiers (critical path for crisis simulation)`);

// List crisis-critical components
console.log('\n⚠️  Crisis-Critical Materials:');
enhancedDataset.metadata.crisisSimulation.riskSources.forEach(sourceId => {
  const node = nodes.find(n => n.id === sourceId);
  console.log(`   • ${node.label} (${node.origin}) - Risk Score: ${node.riskScore}`);
});