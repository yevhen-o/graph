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

export interface PathFindingOptions {
  isDirectional?: boolean // If false, treat graph as undirected
  maxDepth?: number // Maximum path length to prevent infinite loops
  maxPaths?: number // Maximum number of paths to find
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
  findPathsBetween(sourceId: string, targetId: string, options: PathFindingOptions = {}): string[][] {
    const { 
      isDirectional = true, 
      maxDepth = 8, // Reasonable limit to prevent infinite loops
      maxPaths = 20 // Limit number of paths for performance
    } = options
    
    const allPaths: string[][] = []
    const pathSet = new Set<string>() // For efficient duplicate detection

    // Helper function to add unique paths
    const addPath = (path: string[]) => {
      if (allPaths.length >= maxPaths) return false
      const pathKey = path.join('->')
      if (!pathSet.has(pathKey)) {
        pathSet.add(pathKey)
        allPaths.push([...path])
      }
      return allPaths.length < maxPaths
    }

    if (!isDirectional) {
      // Undirected mode: find paths considering both edge directions
      this.findUndirectedPaths(sourceId, targetId, maxDepth, addPath)
    } else {
      // Directional mode - only find paths from source to target
      this.findDirectionalPathsWithLimit(sourceId, targetId, maxDepth, addPath)
    }

    return allPaths
  }

  private findDirectionalPathsWithLimit(
    sourceId: string, 
    targetId: string, 
    maxDepth: number, 
    addPath: (path: string[]) => boolean
  ): void {
    const visited = new Set<string>()
    
    const dfs = (currentId: string, currentPath: string[], depth: number): boolean => {
      if (currentId === targetId) {
        return addPath([...currentPath])
      }

      if (depth >= maxDepth || visited.has(currentId)) return true
      visited.add(currentId)

      const downstreamNodes = this.adjacencyMap.get(currentId) || []
      for (const nextId of downstreamNodes) {
        const shouldContinue = dfs(nextId, [...currentPath, nextId], depth + 1)
        if (!shouldContinue) break // Stop if max paths reached
      }

      visited.delete(currentId)
      return true
    }

    dfs(sourceId, [sourceId], 0)
  }

  private findUndirectedPaths(
    sourceId: string, 
    targetId: string, 
    maxDepth: number, 
    addPath: (path: string[]) => boolean
  ): void {
    const visited = new Set<string>()
    
    const dfs = (currentId: string, currentPath: string[], depth: number): boolean => {
      if (currentId === targetId) {
        return addPath([...currentPath])
      }

      if (depth >= maxDepth || visited.has(currentId)) return true
      visited.add(currentId)

      // In undirected mode, consider both forward and reverse edges
      const neighbors = new Set<string>()
      
      // Add forward neighbors
      const forwardNeighbors = this.adjacencyMap.get(currentId) || []
      forwardNeighbors.forEach(neighbor => neighbors.add(neighbor))
      
      // Add reverse neighbors (treat edges as undirected)
      const reverseNeighbors = this.reverseAdjacencyMap.get(currentId) || []
      reverseNeighbors.forEach(neighbor => neighbors.add(neighbor))

      for (const nextId of neighbors) {
        const shouldContinue = dfs(nextId, [...currentPath, nextId], depth + 1)
        if (!shouldContinue) break // Stop if max paths reached
      }

      visited.delete(currentId)
      return true
    }

    dfs(sourceId, [sourceId], 0)
  }


  /**
   * Find shortest path between two nodes using Dijkstra's algorithm
   * Returns the optimal path considering edge weights
   */
  findShortestPath(sourceId: string, targetId: string, options: PathFindingOptions = {}): {
    path: string[]
    totalWeight: number
    edges: string[]
  } | null {
    const { isDirectional = true } = options
    // Priority queue implementation using array (for simplicity)
    interface QueueItem {
      nodeId: string
      distance: number
      path: string[]
      edgePath: string[]
    }

    const distances = new Map<string, number>()
    const previous = new Map<string, string>()
    const visited = new Set<string>()
    const queue: QueueItem[] = []

    // Initialize distances
    this.graph.nodes.forEach(node => {
      distances.set(node.id, node.id === sourceId ? 0 : Infinity)
    })

    // Start with source node
    queue.push({
      nodeId: sourceId,
      distance: 0,
      path: [sourceId],
      edgePath: []
    })

    while (queue.length > 0) {
      // Get node with minimum distance
      queue.sort((a, b) => a.distance - b.distance)
      const current = queue.shift()!

      if (visited.has(current.nodeId)) continue
      visited.add(current.nodeId)

      // Found target
      if (current.nodeId === targetId) {
        return {
          path: current.path,
          totalWeight: current.distance,
          edges: current.edgePath
        }
      }

      // Check all neighbors
      const neighbors = this.adjacencyMap.get(current.nodeId) || []
      
      // In undirected mode, also check reverse adjacency
      if (!isDirectional) {
        const reverseNeighbors = this.reverseAdjacencyMap.get(current.nodeId) || []
        reverseNeighbors.forEach(neighborId => {
          if (!neighbors.includes(neighborId)) {
            neighbors.push(neighborId)
          }
        })
      }
      
      neighbors.forEach(neighborId => {
        if (visited.has(neighborId)) return

        // Find the edge (check both directions in undirected mode)
        let edge = this.edgeMap.get(`${current.nodeId}->${neighborId}`)
        if (!edge && !isDirectional) {
          edge = this.edgeMap.get(`${neighborId}->${current.nodeId}`)
        }
        
        const edgeWeight = edge?.weight || 1
        const newDistance = current.distance + edgeWeight

        if (newDistance < (distances.get(neighborId) || Infinity)) {
          distances.set(neighborId, newDistance)
          previous.set(neighborId, current.nodeId)

          queue.push({
            nodeId: neighborId,
            distance: newDistance,
            path: [...current.path, neighborId],
            edgePath: edge ? [...current.edgePath, edge.id] : current.edgePath
          })
        }
      })
    }

    return null // No path found
  }

  /**
   * Find multiple alternative paths between two nodes
   * Returns up to maxPaths different routes
   */
  findAlternativePaths(sourceId: string, targetId: string, maxPaths: number = 3, options: PathFindingOptions = {}): Array<{
    path: string[]
    totalWeight: number
    edges: string[]
  }> {
    const { isDirectional: _isDirectional = true } = options
    const allPaths: Array<{
      path: string[]
      totalWeight: number
      edges: string[]
    }> = []

    // Use modified Dijkstra to find multiple paths
    const findPathWithExclusion = (excludedEdges: Set<string>) => {
      const distances = new Map<string, number>()
      const visited = new Set<string>()
      const queue: Array<{
        nodeId: string
        distance: number
        path: string[]
        edgePath: string[]
      }> = []

      this.graph.nodes.forEach(node => {
        distances.set(node.id, node.id === sourceId ? 0 : Infinity)
      })

      queue.push({
        nodeId: sourceId,
        distance: 0,
        path: [sourceId],
        edgePath: []
      })

      while (queue.length > 0) {
        queue.sort((a, b) => a.distance - b.distance)
        const current = queue.shift()!

        if (visited.has(current.nodeId)) continue
        visited.add(current.nodeId)

        if (current.nodeId === targetId) {
          return {
            path: current.path,
            totalWeight: current.distance,
            edges: current.edgePath
          }
        }

        const neighbors = this.adjacencyMap.get(current.nodeId) || []
        neighbors.forEach(neighborId => {
          if (visited.has(neighborId)) return

          const edge = this.edgeMap.get(`${current.nodeId}->${neighborId}`)
          if (!edge || excludedEdges.has(edge.id)) return

          const edgeWeight = edge.weight || 1
          const newDistance = current.distance + edgeWeight

          if (newDistance < (distances.get(neighborId) || Infinity)) {
            distances.set(neighborId, newDistance)

            queue.push({
              nodeId: neighborId,
              distance: newDistance,
              path: [...current.path, neighborId],
              edgePath: [...current.edgePath, edge.id]
            })
          }
        })
      }

      return null
    }

    const excludedEdges = new Set<string>()

    // Find paths by progressively excluding edges from previous paths
    for (let i = 0; i < maxPaths; i++) {
      const path = findPathWithExclusion(excludedEdges)
      if (!path) break

      allPaths.push(path)

      // Exclude one edge from this path for next iteration
      if (path.edges.length > 0) {
        excludedEdges.add(path.edges[0])
      }
    }

    return allPaths.sort((a, b) => a.totalWeight - b.totalWeight)
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