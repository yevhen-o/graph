import Graph from 'graphology'
import { scaleOrdinal } from 'd3-scale'
import { SupplyChainGraph, SupplyChainNode, NodeType, EdgeType } from '../types/supplyChain'

export interface CosmosNode {
  id: string
  label?: string
  x?: number
  y?: number
  color?: string
  size?: number
  tier?: number
}

export interface CosmosEdge {
  source: string
  target: string
  weight?: number
  color?: string
}

export interface CosmosGraphData {
  nodes: CosmosNode[]
  links: CosmosEdge[]
}

export class GraphUtils {
  static convertToCosmosFormat(graph: SupplyChainGraph): CosmosGraphData {
    const nodeColorScale = scaleOrdinal<NodeType, string>()
      .domain([NodeType.SUPPLIER, NodeType.MANUFACTURER, NodeType.DISTRIBUTOR, NodeType.RETAILER, NodeType.WAREHOUSE])
      .range(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'])

    const nodes: CosmosNode[] = graph.nodes.map(node => ({
      id: node.id,
      label: node.label,
      color: nodeColorScale(node.type),
      size: this.getNodeSize(node),
      tier: node.tier
    }))

    const links: CosmosEdge[] = graph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      color: this.getEdgeColor(edge.type)
    }))

    return { nodes, links }
  }

  static createGraphologyGraph(graph: SupplyChainGraph): Graph {
    const g = new Graph({ type: 'directed', multi: false })

    graph.nodes.forEach(node => {
      g.addNode(node.id, {
        label: node.label,
        // Remove 'type' attribute that causes Sigma issues, store as nodeType instead
        nodeType: node.type,
        tier: node.tier,
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        size: this.getNodeSize(node),
        color: this.getNodeColor(node.type)
      })
    })

    // Track added edges to prevent duplicates
    const addedEdges = new Set<string>()

    graph.edges.forEach(edge => {
      if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
        // Create a unique key for this edge (considering direction)
        const edgeKey = `${edge.source}->${edge.target}`
        
        // Only add if this edge doesn't already exist
        if (!addedEdges.has(edgeKey) && !g.hasEdge(edge.source, edge.target)) {
          try {
            g.addEdge(edge.source, edge.target, {
              weight: edge.weight,
              // Store edge type as edgeType to avoid conflicts
              edgeType: edge.type,
              color: this.getEdgeColor(edge.type)
            })
            addedEdges.add(edgeKey)
          } catch (error) {
            // Skip duplicate edges silently
            console.warn(`Skipped duplicate edge: ${edgeKey}`)
          }
        }
      }
    })

    return g
  }

  private static getNodeSize(node: SupplyChainNode): number {
    const baseSize = 5
    const sizeMultiplier = {
      small: 1,
      medium: 1.5,
      large: 2.5
    }
    
    const tierMultiplier = {
      1: 0.8,
      2: 1.2,
      3: 1.0,
      4: 0.9,
      5: 0.7
    }

    return baseSize * 
           (sizeMultiplier[node.size || 'medium']) * 
           (tierMultiplier[node.tier as keyof typeof tierMultiplier] || 1)
  }

  private static getNodeColor(type: NodeType): string {
    const colors = {
      [NodeType.SUPPLIER]: '#ff6b6b',
      [NodeType.MANUFACTURER]: '#4ecdc4',
      [NodeType.DISTRIBUTOR]: '#45b7d1',
      [NodeType.RETAILER]: '#96ceb4',
      [NodeType.WAREHOUSE]: '#feca57',
      [NodeType.CUSTOMER]: '#a29bfe'
    }
    return colors[type] || '#95a5a6'
  }

  private static getEdgeColor(type: EdgeType): string {
    const colors = {
      [EdgeType.MATERIAL_FLOW]: '#2ecc71',
      [EdgeType.INFORMATION_FLOW]: '#3498db',
      [EdgeType.FINANCIAL_FLOW]: '#f39c12',
      [EdgeType.TRANSPORTATION]: '#9b59b6'
    }
    return colors[type] || '#95a5a6'
  }

  static calculateGraphMetrics(graph: Graph) {
    const metrics = {
      nodeCount: graph.order,
      edgeCount: graph.size,
      density: graph.size / (graph.order * (graph.order - 1)),
      averageDegree: (2 * graph.size) / graph.order,
      components: 0
    }

    return metrics
  }

  static filterGraphByTier(graph: SupplyChainGraph, tiers: number[]): SupplyChainGraph {
    const filteredNodes = graph.nodes.filter(node => tiers.includes(node.tier))
    const nodeIds = new Set(filteredNodes.map(node => node.id))
    const filteredEdges = graph.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        ...graph.metadata,
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length
      }
    }
  }

  static filterGraphByNodeType(graph: SupplyChainGraph, nodeTypes: NodeType[]): SupplyChainGraph {
    const filteredNodes = graph.nodes.filter(node => nodeTypes.includes(node.type))
    const nodeIds = new Set(filteredNodes.map(node => node.id))
    const filteredEdges = graph.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        ...graph.metadata,
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length
      }
    }
  }
}