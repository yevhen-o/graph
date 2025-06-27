import { SupplyChainGraph, SupplyChainEdge } from '../types/supplyChain'

/**
 * Path tracing utilities for supply chain crisis simulation
 * Provides algorithms to find affected nodes when a source experiences disruption
 */

export interface PathTraceResult {
  affectedNodes: Set<string>
  affectedEdges: Set<string>
  pathDepths: Map<string, number>
  totalImpact: number
  criticalPaths: string[][]
}

export interface TraceOptions {
  maxDepth?: number
  includeIndirect?: boolean
  weightThreshold?: number
}

export class PathTracer {
  private graph: SupplyChainGraph
  private adjacencyMap: Map<string, string[]> = new Map()
  private reverseAdjacencyMap: Map<string, string[]> = new Map()
  private edgeMap: Map<string, SupplyChainEdge> = new Map()

  constructor(graph: SupplyChainGraph) {
    this.graph = graph
    this.buildAdjacencyMaps()
  }

  /**
   * Build adjacency maps for efficient graph traversal
   */
  private buildAdjacencyMaps(): void {
    this.adjacencyMap = new Map()
    this.reverseAdjacencyMap = new Map()
    this.edgeMap = new Map()

    // Initialize adjacency maps
    this.graph.nodes.forEach(node => {
      this.adjacencyMap.set(node.id, [])
      this.reverseAdjacencyMap.set(node.id, [])
    })

    // Build forward and reverse adjacency lists
    this.graph.edges.forEach(edge => {
      // Forward adjacency (source -> target)
      const forwardTargets = this.adjacencyMap.get(edge.source) || []
      forwardTargets.push(edge.target)
      this.adjacencyMap.set(edge.source, forwardTargets)

      // Reverse adjacency (target -> source) for upstream analysis
      const reverseTargets = this.reverseAdjacencyMap.get(edge.target) || []
      reverseTargets.push(edge.source)
      this.reverseAdjacencyMap.set(edge.target, reverseTargets)

      // Edge mapping for quick lookup
      this.edgeMap.set(`${edge.source}->${edge.target}`, edge)
    })
  }

  /**
   * Find all downstream nodes affected by a source disruption
   * Uses breadth-first search to trace impact through the supply chain
   */
  traceDownstreamImpact(
    sourceNodeIds: string | string[], 
    options: TraceOptions = {}
  ): PathTraceResult {
    const {
      maxDepth = Infinity,
      includeIndirect = true,
      weightThreshold = 0
    } = options

    const sourceIds = Array.isArray(sourceNodeIds) ? sourceNodeIds : [sourceNodeIds]
    const affectedNodes = new Set<string>()
    const affectedEdges = new Set<string>()
    const pathDepths = new Map<string, number>()
    const criticalPaths: string[][] = []

    // Initialize with source nodes
    const queue: Array<{ nodeId: string, depth: number, path: string[] }> = []
    
    sourceIds.forEach(sourceId => {
      if (this.graph.nodes.find(n => n.id === sourceId)) {
        affectedNodes.add(sourceId)
        pathDepths.set(sourceId, 0)
        queue.push({ nodeId: sourceId, depth: 0, path: [sourceId] })
      }
    })

    // BFS traversal to find all affected downstream nodes
    while (queue.length > 0) {
      const { nodeId, depth, path } = queue.shift()!

      if (depth >= maxDepth) continue

      const downstreamNodes = this.adjacencyMap.get(nodeId) || []

      downstreamNodes.forEach(targetId => {
        const edge = this.edgeMap.get(`${nodeId}->${targetId}`)
        
        // Apply weight threshold filter
        if (edge && edge.weight < weightThreshold) return

        // Check if we should include this node
        const shouldInclude = includeIndirect || !affectedNodes.has(targetId)
        
        if (shouldInclude) {
          const newDepth = depth + 1
          const newPath = [...path, targetId]

          // Add to affected sets
          affectedNodes.add(targetId)
          if (edge) {
            affectedEdges.add(edge.id)
          }

          // Update depth (keep minimum depth for multiple paths)
          const currentDepth = pathDepths.get(targetId)
          if (currentDepth === undefined || newDepth < currentDepth) {
            pathDepths.set(targetId, newDepth)
          }

          // Add to queue for further traversal
          queue.push({ nodeId: targetId, depth: newDepth, path: newPath })

          // Track critical paths (paths to manufacturer/tier 0)
          const targetNode = this.graph.nodes.find(n => n.id === targetId)
          if (targetNode && (targetNode.tier === 0 || targetNode.type === 'manufacturer')) {
            criticalPaths.push(newPath)
          }
        }
      })
    }

    // Calculate total impact score
    const totalImpact = this.calculateImpactScore(affectedNodes)

    return {
      affectedNodes,
      affectedEdges,
      pathDepths,
      totalImpact,
      criticalPaths
    }
  }

  /**
   * Find all upstream nodes that supply to a target (for reverse impact analysis)
   */
  traceUpstreamDependencies(
    targetNodeId: string, 
    options: TraceOptions = {}
  ): PathTraceResult {
    const {
      maxDepth = Infinity,
      weightThreshold = 0
    } = options

    const affectedNodes = new Set<string>()
    const affectedEdges = new Set<string>()
    const pathDepths = new Map<string, number>()
    const criticalPaths: string[][] = []

    // Initialize with target node
    const queue: Array<{ nodeId: string, depth: number, path: string[] }> = []
    affectedNodes.add(targetNodeId)
    pathDepths.set(targetNodeId, 0)
    queue.push({ nodeId: targetNodeId, depth: 0, path: [targetNodeId] })

    // BFS traversal upstream
    while (queue.length > 0) {
      const { nodeId, depth, path } = queue.shift()!

      if (depth >= maxDepth) continue

      const upstreamNodes = this.reverseAdjacencyMap.get(nodeId) || []

      upstreamNodes.forEach(sourceId => {
        const edge = this.edgeMap.get(`${sourceId}->${nodeId}`)
        
        // Apply weight threshold filter
        if (edge && edge.weight < weightThreshold) return

        if (!affectedNodes.has(sourceId)) {
          const newDepth = depth + 1
          const newPath = [sourceId, ...path]

          // Add to affected sets
          affectedNodes.add(sourceId)
          if (edge) {
            affectedEdges.add(edge.id)
          }

          pathDepths.set(sourceId, newDepth)

          // Add to queue
          queue.push({ nodeId: sourceId, depth: newDepth, path: newPath })

          // Track paths from raw materials
          const sourceNode = this.graph.nodes.find(n => n.id === sourceId)
          if (sourceNode && sourceNode.type === 'raw_materials') {
            criticalPaths.push(newPath)
          }
        }
      })
    }

    const totalImpact = this.calculateImpactScore(affectedNodes)

    return {
      affectedNodes,
      affectedEdges,
      pathDepths,
      totalImpact,
      criticalPaths
    }
  }

  /**
   * Find critical paths between two specific nodes
   */
  findPathsBetween(sourceId: string, targetId: string): string[][] {
    const paths: string[][] = []
    const visited = new Set<string>()

    const dfs = (currentId: string, currentPath: string[]) => {
      if (currentId === targetId) {
        paths.push([...currentPath])
        return
      }

      if (visited.has(currentId)) return
      visited.add(currentId)

      const downstreamNodes = this.adjacencyMap.get(currentId) || []
      downstreamNodes.forEach(nextId => {
        dfs(nextId, [...currentPath, nextId])
      })

      visited.delete(currentId)
    }

    dfs(sourceId, [sourceId])
    return paths
  }

  /**
   * Calculate impact score based on affected nodes' importance and risk
   */
  private calculateImpactScore(affectedNodeIds: Set<string>): number {
    let totalImpact = 0
    
    affectedNodeIds.forEach(nodeId => {
      const node = this.graph.nodes.find(n => n.id === nodeId)
      if (node) {
        const importance = node.importance || 0.5
        const riskScore = node.riskScore || 0.5
        const tierWeight = this.getTierWeight(node.tier)
        
        // Impact = importance * risk * tier_weight
        totalImpact += importance * riskScore * tierWeight
      }
    })

    return totalImpact
  }

  /**
   * Get tier weight for impact calculation (lower tiers have higher impact)
   */
  private getTierWeight(tier: number): number {
    const weights = {
      0: 2.0,  // Manufacturer - highest impact
      1: 1.8,  // Tier 1 suppliers
      2: 1.5,  // Tier 2 suppliers
      3: 1.2,  // Tier 3 suppliers
      4: 1.0,  // Component suppliers
      5: 0.8,  // Sub-suppliers
      6: 0.6,  // Processing/warehouses
      7: 0.4   // Raw materials
    }
    return weights[tier as keyof typeof weights] || 0.5
  }

  /**
   * Get supply chain statistics
   */
  getSupplyChainStats() {
    const nodesByTier = new Map<number, number>()
    const nodesByType = new Map<string, number>()

    this.graph.nodes.forEach(node => {
      // Count by tier
      const tierCount = nodesByTier.get(node.tier) || 0
      nodesByTier.set(node.tier, tierCount + 1)

      // Count by type
      const typeCount = nodesByType.get(node.type) || 0
      nodesByType.set(node.type, typeCount + 1)
    })

    return {
      totalNodes: this.graph.nodes.length,
      totalEdges: this.graph.edges.length,
      nodesByTier: Object.fromEntries(nodesByTier),
      nodesByType: Object.fromEntries(nodesByType),
      avgConnectionsPerNode: this.graph.edges.length / this.graph.nodes.length
    }
  }
}

/**
 * Utility functions for crisis simulation
 */
export class CrisisSimulator {
  /**
   * Simulate a lithium shortage crisis
   */
  static simulateLithiumCrisis(graph: SupplyChainGraph): PathTraceResult {
    const tracer = new PathTracer(graph)
    
    // Find lithium raw material sources
    const lithiumSources = graph.nodes
      .filter(node => 
        node.type === 'raw_materials' && 
        (node.label?.toLowerCase().includes('lithium') || 
         node.material?.includes('lithium'))
      )
      .map(node => node.id)

    if (lithiumSources.length === 0) {
      console.warn('No lithium sources found in graph')
      return {
        affectedNodes: new Set(),
        affectedEdges: new Set(),
        pathDepths: new Map(),
        totalImpact: 0,
        criticalPaths: []
      }
    }

    return tracer.traceDownstreamImpact(lithiumSources, {
      maxDepth: 10,
      includeIndirect: true,
      weightThreshold: 10 // Only significant supply relationships
    })
  }

  /**
   * Simulate crisis for any material type
   */
  static simulateMaterialCrisis(
    graph: SupplyChainGraph, 
    materialType: string
  ): PathTraceResult {
    const tracer = new PathTracer(graph)
    
    const materialSources = graph.nodes
      .filter(node => 
        node.type === 'raw_materials' && 
        (node.label?.toLowerCase().includes(materialType.toLowerCase()) ||
         node.material?.includes(materialType.toLowerCase()))
      )
      .map(node => node.id)

    if (materialSources.length === 0) {
      return {
        affectedNodes: new Set(),
        affectedEdges: new Set(),
        pathDepths: new Map(),
        totalImpact: 0,
        criticalPaths: []
      }
    }

    return tracer.traceDownstreamImpact(materialSources, {
      maxDepth: 10,
      includeIndirect: true,
      weightThreshold: 5
    })
  }
}