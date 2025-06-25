export enum NodeType {
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
  size?: 'small' | 'medium' | 'large'
  industry?: string
  established?: number
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