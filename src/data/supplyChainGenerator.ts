import { SupplyChainNode, SupplyChainEdge, NodeType, EdgeType, SupplyChainGraph } from '../types/supplyChain'

const COMPANY_NAMES = [
  'Global Materials Corp', 'Pacific Steel', 'Nordic Timber', 'East Coast Logistics',
  'Mountain Mining Co', 'Valley Agriculture', 'Tech Components Inc', 'Smart Factory Ltd',
  'Green Energy Supply', 'Urban Distribution', 'Metro Retail Chain', 'Quick Transport',
  'Advanced Manufacturing', 'Sustainable Sources', 'Digital Commerce Hub', 'Local Suppliers Co'
]

const CITIES = [
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { name: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lng: 4.4777 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5558, lng: -46.6396 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 }
]


export class SupplyChainGenerator {
  // Available sample datasets
  static readonly SAMPLE_DATASETS = [
    { 
      name: 'Electronics (50 nodes)', 
      filename: 'sample_50_electronics.json',
      nodeCount: 50,
      industry: 'Electronics'
    },
    { 
      name: 'Pharmaceutical (100 nodes)', 
      filename: 'sample_100_pharmaceutical.json',
      nodeCount: 100,
      industry: 'Pharmaceutical'
    },
    { 
      name: 'Automotive (200 nodes)', 
      filename: 'sample_200_automotive.json',
      nodeCount: 200,
      industry: 'Automotive'
    },
    { 
      name: 'Retail (500 nodes)', 
      filename: 'sample_500_retail.json',
      nodeCount: 500,
      industry: 'Retail'
    },
    { 
      name: 'Manufacturing (1000 nodes)', 
      filename: 'sample_1000_manufacturing.json',
      nodeCount: 1000,
      industry: 'Manufacturing'
    }
  ]

  static async loadSampleData(filename: string): Promise<SupplyChainGraph> {
    try {
      const response = await fetch(`/data/samples/${filename}`)
      if (!response.ok) {
        throw new Error(`Failed to load sample data: ${response.statusText}`)
      }
      const data = await response.json()
      return data as SupplyChainGraph
    } catch (error) {
      console.error('Error loading sample data:', error)
      // Fallback to generated data
      return this.generateSmallTestGraph()
    }
  }

  static generateGraph(
    nodeCount: number = 1000,
    industry: string = 'Electronics',
    region: string = 'Global'
  ): SupplyChainGraph {
    const nodes: SupplyChainNode[] = []
    const edges: SupplyChainEdge[] = []

    const tierDistribution = {
      [NodeType.SUPPLIER]: Math.floor(nodeCount * 0.4),
      [NodeType.MANUFACTURER]: Math.floor(nodeCount * 0.2),
      [NodeType.DISTRIBUTOR]: Math.floor(nodeCount * 0.2),
      [NodeType.RETAILER]: Math.floor(nodeCount * 0.15),
      [NodeType.WAREHOUSE]: Math.floor(nodeCount * 0.05)
    }

    let nodeId = 0

    Object.entries(tierDistribution).forEach(([nodeType, count]) => {
      for (let i = 0; i < count; i++) {
        const location = CITIES[Math.floor(Math.random() * CITIES.length)]
        
        nodes.push({
          id: `node_${nodeId}`,
          label: `${COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)]} ${nodeId}`,
          type: nodeType as NodeType,
          tier: this.getTierNumber(nodeType as NodeType),
          location: {
            lat: location.lat + (Math.random() - 0.5) * 10,
            lng: location.lng + (Math.random() - 0.5) * 10,
            country: location.country,
            city: location.name
          },
          capacity: Math.floor(Math.random() * 10000) + 1000,
          leadTime: Math.floor(Math.random() * 30) + 1,
          riskScore: Math.random(),
          sustainability: Math.random(),
          size: this.getRandomSize(),
          industry,
          established: 2024 - Math.floor(Math.random() * 50)
        })
        nodeId++
      }
    })

    const edgeId = { value: 0 }
    
    this.connectTiers(nodes, edges, NodeType.SUPPLIER, NodeType.MANUFACTURER, edgeId, 0.3)
    this.connectTiers(nodes, edges, NodeType.MANUFACTURER, NodeType.DISTRIBUTOR, edgeId, 0.6)
    this.connectTiers(nodes, edges, NodeType.DISTRIBUTOR, NodeType.RETAILER, edgeId, 0.7)
    this.connectTiers(nodes, edges, NodeType.DISTRIBUTOR, NodeType.WAREHOUSE, edgeId, 0.2)
    this.connectTiers(nodes, edges, NodeType.WAREHOUSE, NodeType.RETAILER, edgeId, 0.4)

    this.addCrossConnections(nodes, edges, edgeId, 0.1)

    return {
      nodes,
      edges,
      metadata: {
        totalValue: edges.reduce((sum, edge) => sum + (edge.volume || 0), 0),
        totalNodes: nodes.length,
        totalEdges: edges.length,
        industry,
        region
      }
    }
  }

  private static getTierNumber(nodeType: NodeType): number {
    switch (nodeType) {
      case NodeType.SUPPLIER: return 1
      case NodeType.MANUFACTURER: return 2
      case NodeType.DISTRIBUTOR: return 3
      case NodeType.WAREHOUSE: return 3
      case NodeType.RETAILER: return 4
      case NodeType.CUSTOMER: return 5
      default: return 0
    }
  }

  private static getRandomSize(): 'small' | 'medium' | 'large' {
    const rand = Math.random()
    if (rand < 0.6) return 'small'
    if (rand < 0.9) return 'medium'
    return 'large'
  }

  private static connectTiers(
    nodes: SupplyChainNode[],
    edges: SupplyChainEdge[],
    sourceType: NodeType,
    targetType: NodeType,
    edgeId: { value: number },
    connectionProbability: number
  ) {
    const sourceNodes = nodes.filter(n => n.type === sourceType)
    const targetNodes = nodes.filter(n => n.type === targetType)

    // Track existing connections to prevent duplicates
    const existingConnections = new Set<string>()
    edges.forEach(edge => {
      existingConnections.add(`${edge.source}->${edge.target}`)
    })

    sourceNodes.forEach(sourceNode => {
      targetNodes.forEach(targetNode => {
        const connectionKey = `${sourceNode.id}->${targetNode.id}`
        
        if (Math.random() < connectionProbability && !existingConnections.has(connectionKey)) {
          edges.push({
            id: `edge_${edgeId.value++}`,
            source: sourceNode.id,
            target: targetNode.id,
            type: EdgeType.MATERIAL_FLOW,
            weight: Math.random() * 100 + 10,
            volume: Math.floor(Math.random() * 10000) + 100,
            cost: Math.random() * 1000000 + 10000,
            reliability: 0.8 + Math.random() * 0.2,
            speed: Math.floor(Math.random() * 14) + 1,
            label: `${sourceNode.label} → ${targetNode.label}`
          })
          existingConnections.add(connectionKey)
        }
      })
    })
  }

  private static addCrossConnections(
    nodes: SupplyChainNode[],
    edges: SupplyChainEdge[],
    edgeId: { value: number },
    probability: number
  ) {
    // Track existing connections to prevent duplicates
    const existingConnections = new Set<string>()
    edges.forEach(edge => {
      existingConnections.add(`${edge.source}->${edge.target}`)
    })

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const connectionKey = `${nodes[i].id}->${nodes[j].id}`
        
        if (Math.random() < probability && 
            nodes[i].type !== nodes[j].type && 
            !existingConnections.has(connectionKey)) {
          const edgeType = Math.random() < 0.7 ? EdgeType.INFORMATION_FLOW : EdgeType.FINANCIAL_FLOW
          
          edges.push({
            id: `edge_${edgeId.value++}`,
            source: nodes[i].id,
            target: nodes[j].id,
            type: edgeType,
            weight: Math.random() * 50 + 5,
            volume: edgeType === EdgeType.FINANCIAL_FLOW ? Math.floor(Math.random() * 1000000) : undefined,
            cost: Math.random() * 100000,
            reliability: 0.9 + Math.random() * 0.1,
            speed: Math.floor(Math.random() * 7) + 1
          })
          existingConnections.add(connectionKey)
        }
      }
    }
  }

  static generateLargeGraph(nodeCount: number = 100000): SupplyChainGraph {
    return this.generateGraph(nodeCount, 'Global Manufacturing', 'Worldwide')
  }

  static generateSmallTestGraph(): SupplyChainGraph {
    return this.generateGraph(50, 'Electronics', 'North America')
  }
}