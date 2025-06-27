export enum NodeType {
  RAW_MATERIALS = 'raw_materials',
  SUPPLIER = 'supplier',
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  CUSTOMER = 'customer',
  WAREHOUSE = 'warehouse'
}

export enum EdgeType {
  MATERIAL_FLOW = 'material_flow',
  INFORMATION_FLOW = 'information_flow',
  FINANCIAL_FLOW = 'financial_flow',
  TRANSPORTATION = 'transportation'
}

export interface SupplyChainNode {
  id: string
  label: string
  type: NodeType
  tier: number
  x?: number  // Pre-calculated x position
  y?: number  // Pre-calculated y position
  location?: {
    lat: number
    lng: number
    country: string
    city: string
  }
  capacity?: number
  leadTime?: number
  riskScore?: number
  sustainability?: number
  size?: 'small' | 'medium' | 'large' | number
  industry?: string
  established?: number
  material?: string
  importance?: number
  origin?: string
}

export interface SupplyChainEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  weight: number
  volume?: number
  cost?: number
  reliability?: number
  speed?: number
  label?: string
}

export interface SupplyChainGraph {
  nodes: SupplyChainNode[]
  edges: SupplyChainEdge[]
  metadata: {
    totalValue: number
    totalNodes: number
    totalEdges: number
    industry: string
    region: string
  }
}

export interface GraphLayout {
  x: number
  y: number
  nodeId: string
}

export interface GraphMetrics {
  centrality: { [nodeId: string]: number }
  clustering: { [nodeId: string]: number }
  shortestPaths: { [fromNodeId: string]: { [toNodeId: string]: number } }
  criticalPath: string[]
  bottlenecks: string[]
}