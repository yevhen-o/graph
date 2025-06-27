import { create } from 'zustand'
import { SelectionStore, SelectedItem } from '../types/selection'
import { SupplyChainNode, SupplyChainEdge } from '../types/supplyChain'
import { PathTracer } from '../utils/pathTracing'

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  // Selection state
  selectedItems: [],
  isPanelOpen: false,
  activeAccordionItems: [],
  maxSelections: 10, // Limit to prevent performance issues
  
  // Graph data state
  graphData: null,
  fullGraphData: null,
  isLoading: false,

  // Crisis simulation state
  crisis: {
    crisisMode: false,
    crisisSource: null,
    crisisType: '',
    affectedNodes: new Set(),
    affectedEdges: new Set(),
    impactAnalysis: null,
    showCrisisLegend: false
  },

  // Path highlighting state
  pathHighlight: {
    isActive: false,
    sourceNodeId: null,
    targetNodeId: null,
    pathNodes: new Set(),
    pathEdges: new Set(),
    paths: [],
    pathMetrics: null
  },

  // Actions
  addNode: (node: SupplyChainNode) => {
    set((state) => {
      // Check if node is already selected
      const existingIndex = state.selectedItems.findIndex(
        item => item.id === node.id && item.type === 'node'
      )
      
      if (existingIndex !== -1) {
        // Update timestamp and move to front
        const updatedItems = [...state.selectedItems]
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          timestamp: Date.now()
        }
        // Move to front
        const [item] = updatedItems.splice(existingIndex, 1)
        updatedItems.unshift(item)
        
        const newState = {
          selectedItems: updatedItems,
          isPanelOpen: true,
          activeAccordionItems: state.activeAccordionItems.includes(node.id) 
            ? state.activeAccordionItems 
            : [node.id, ...state.activeAccordionItems]
        }

        // Auto-trigger path finding if exactly 2 nodes are selected
        setTimeout(() => {
          const currentState = get()
          const selectedNodes = currentState.getSelectedNodes()
          
          if (selectedNodes.length === 2) {
            console.log('Auto-triggering path finding between 2 selected nodes')
            currentState.findPathsBetweenSelected()
          } else if (selectedNodes.length !== 2 && currentState.pathHighlight.isActive) {
            console.log('Clearing path highlight due to selection change')
            currentState.clearPathHighlight()
          }
        }, 0)

        return newState
      }

      // Add new item
      const newItem: SelectedItem = {
        id: node.id,
        type: 'node',
        data: node,
        timestamp: Date.now()
      }

      const updatedItems = [newItem, ...state.selectedItems]
      
      // Limit selections
      if (updatedItems.length > state.maxSelections) {
        updatedItems.splice(state.maxSelections)
      }

      const newState = {
        selectedItems: updatedItems,
        isPanelOpen: true,
        activeAccordionItems: [node.id, ...state.activeAccordionItems]
      }

      // Auto-trigger path finding if exactly 2 nodes are selected
      setTimeout(() => {
        const currentState = get()
        const selectedNodes = currentState.getSelectedNodes()
        
        if (selectedNodes.length === 2) {
          console.log('Auto-triggering path finding between 2 selected nodes')
          currentState.findPathsBetweenSelected()
        } else if (selectedNodes.length !== 2 && currentState.pathHighlight.isActive) {
          console.log('Clearing path highlight due to selection change')
          currentState.clearPathHighlight()
        }
      }, 0)

      return newState
    })
  },

  addEdge: (edge: SupplyChainEdge) => {
    set((state) => {
      // Check if edge is already selected
      const existingIndex = state.selectedItems.findIndex(
        item => item.id === edge.id && item.type === 'edge'
      )
      
      if (existingIndex !== -1) {
        // Update timestamp and move to front
        const updatedItems = [...state.selectedItems]
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          timestamp: Date.now()
        }
        // Move to front
        const [item] = updatedItems.splice(existingIndex, 1)
        updatedItems.unshift(item)
        
        return {
          selectedItems: updatedItems,
          isPanelOpen: true,
          activeAccordionItems: state.activeAccordionItems.includes(edge.id) 
            ? state.activeAccordionItems 
            : [edge.id, ...state.activeAccordionItems]
        }
      }

      // Add new item
      const newItem: SelectedItem = {
        id: edge.id,
        type: 'edge',
        data: edge,
        timestamp: Date.now()
      }

      const updatedItems = [newItem, ...state.selectedItems]
      
      // Limit selections
      if (updatedItems.length > state.maxSelections) {
        updatedItems.splice(state.maxSelections)
      }

      return {
        selectedItems: updatedItems,
        isPanelOpen: true,
        activeAccordionItems: [edge.id, ...state.activeAccordionItems]
      }
    })
  },

  removeItem: (id: string) => {
    set((state) => {
      const newState = {
        selectedItems: state.selectedItems.filter(item => item.id !== id),
        activeAccordionItems: state.activeAccordionItems.filter(itemId => itemId !== id)
      }

      // Clear path highlight if selection changes from 2 nodes
      setTimeout(() => {
        const currentState = get()
        const selectedNodes = currentState.getSelectedNodes()
        
        if (selectedNodes.length !== 2 && currentState.pathHighlight.isActive) {
          console.log('Clearing path highlight due to item removal')
          currentState.clearPathHighlight()
        }
      }, 0)

      return newState
    })
  },

  clearAll: () => {
    set((state) => {
      // Clear path highlight when clearing all selections
      if (state.pathHighlight.isActive) {
        console.log('Clearing path highlight due to clear all')
      }
      
      return {
        selectedItems: [],
        activeAccordionItems: [],
        pathHighlight: {
          isActive: false,
          sourceNodeId: null,
          targetNodeId: null,
          pathNodes: new Set(),
          pathEdges: new Set(),
          paths: [],
          pathMetrics: null
        }
      }
    })
  },

  togglePanel: () => {
    set((state) => ({
      isPanelOpen: !state.isPanelOpen
    }))
  },

  setPanelOpen: (open: boolean) => {
    set({
      isPanelOpen: open
    })
  },

  toggleAccordionItem: (id: string) => {
    set((state) => {
      const isActive = state.activeAccordionItems.includes(id)
      return {
        activeAccordionItems: isActive
          ? state.activeAccordionItems.filter(itemId => itemId !== id)
          : [...state.activeAccordionItems, id]
      }
    })
  },

  // Helper functions
  isNodeSelected: (nodeId: string) => {
    return get().selectedItems.some(item => item.id === nodeId && item.type === 'node')
  },

  isEdgeSelected: (edgeId: string) => {
    return get().selectedItems.some(item => item.id === edgeId && item.type === 'edge')
  },

  getSelectedNodes: () => {
    return get().selectedItems
      .filter(item => item.type === 'node')
      .map(item => item.data as SupplyChainNode)
  },

  getSelectedEdges: () => {
    return get().selectedItems
      .filter(item => item.type === 'edge')
      .map(item => item.data as SupplyChainEdge)
  },

  // Graph data management actions
  setGraphData: (data) => {
    set({ graphData: data })
  },

  setFullGraphData: (data) => {
    set({ fullGraphData: data })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  updateNodeRiskScore: (nodeId: string, riskScore: number) => {
    set((state) => {
      if (!state.graphData || !state.fullGraphData) return state

      // Update both graphData and fullGraphData
      const updateNode = (node: SupplyChainNode) => 
        node.id === nodeId ? { ...node, riskScore } : node

      const updatedGraphData = {
        ...state.graphData,
        nodes: state.graphData.nodes.map(updateNode)
      }

      const updatedFullGraphData = {
        ...state.fullGraphData,
        nodes: state.fullGraphData.nodes.map(updateNode)
      }

      // Update selected items if the node is currently selected
      const updatedSelectedItems = state.selectedItems.map(item => {
        if (item.type === 'node' && item.id === nodeId) {
          const updatedNode = { ...(item.data as SupplyChainNode), riskScore }
          return { ...item, data: updatedNode }
        }
        return item
      })

      return {
        graphData: updatedGraphData,
        fullGraphData: updatedFullGraphData,
        selectedItems: updatedSelectedItems
      }
    })
  },

  getNodeById: (nodeId: string) => {
    const state = get()
    return state.graphData?.nodes.find(node => node.id === nodeId)
  },

  // Crisis simulation actions
  enableCrisisMode: (sourceNodeId: string, crisisType: string) => {
    set((state) => {
      if (!state.graphData) return state

      const pathTracer = new PathTracer(state.graphData)
      const impactAnalysis = pathTracer.traceDownstreamImpact(sourceNodeId, {
        maxDepth: 10,
        includeIndirect: true,
        weightThreshold: 5
      })

      console.log('Crisis simulation activated:', {
        source: sourceNodeId,
        type: crisisType,
        affectedNodes: impactAnalysis.affectedNodes.size,
        totalImpact: impactAnalysis.totalImpact
      })

      return {
        crisis: {
          crisisMode: true,
          crisisSource: sourceNodeId,
          crisisType,
          affectedNodes: impactAnalysis.affectedNodes,
          affectedEdges: impactAnalysis.affectedEdges,
          impactAnalysis,
          showCrisisLegend: true
        }
      }
    })
  },

  disableCrisisMode: () => {
    set({
      crisis: {
        crisisMode: false,
        crisisSource: null,
        crisisType: '',
        affectedNodes: new Set(),
        affectedEdges: new Set(),
        impactAnalysis: null,
        showCrisisLegend: false
      }
    })
  },

  toggleCrisisMode: () => {
    const state = get()
    if (state.crisis.crisisMode) {
      state.disableCrisisMode()
    } else {
      // Try to activate lithium crisis if available
      if (state.graphData) {
        const lithiumSources = state.graphData.nodes.filter(node => 
          node.type === 'raw_materials' && 
          node.label?.toLowerCase().includes('lithium')
        )
        if (lithiumSources.length > 0) {
          state.enableCrisisMode(lithiumSources[0].id, 'lithium_shortage')
        }
      }
    }
  },

  setCrisisSource: (sourceNodeId: string, crisisType: string) => {
    const state = get()
    if (state.crisis.crisisMode) {
      state.enableCrisisMode(sourceNodeId, crisisType)
    }
  },

  isNodeAffectedByCrisis: (nodeId: string) => {
    const state = get()
    return state.crisis.crisisMode && state.crisis.affectedNodes.has(nodeId)
  },

  isEdgeAffectedByCrisis: (edgeId: string) => {
    const state = get()
    return state.crisis.crisisMode && state.crisis.affectedEdges.has(edgeId)
  },

  getCrisisImpactStats: () => {
    const state = get()
    if (!state.crisis.impactAnalysis) {
      return { affectedNodes: 0, totalImpact: 0, criticalPaths: 0 }
    }

    return {
      affectedNodes: state.crisis.affectedNodes.size,
      totalImpact: state.crisis.impactAnalysis.totalImpact,
      criticalPaths: state.crisis.impactAnalysis.criticalPaths.length
    }
  },

  toggleCrisisLegend: () => {
    set((state) => ({
      crisis: {
        ...state.crisis,
        showCrisisLegend: !state.crisis.showCrisisLegend
      }
    }))
  },

  // Path highlighting actions
  findPathsBetweenSelected: () => {
    const state = get()
    const selectedNodes = state.getSelectedNodes()
    
    if (selectedNodes.length !== 2 || !state.graphData) {
      return
    }

    const [sourceNode, targetNode] = selectedNodes
    const pathTracer = new PathTracer(state.graphData)
    
    // Use optimized shortest path algorithm
    const shortestPathResult = pathTracer.findShortestPath(sourceNode.id, targetNode.id)
    
    if (!shortestPathResult) {
      console.log('No path found between', sourceNode.label, 'and', targetNode.label)
      return
    }

    const { path: shortestPath, totalWeight, edges: pathEdgeIds } = shortestPathResult

    // Collect all nodes and edges in the path
    const pathNodes = new Set(shortestPath)
    const pathEdges = new Set(pathEdgeIds)
    
    // Calculate average risk score of path nodes
    let totalRisk = 0
    shortestPath.forEach(nodeId => {
      const node = state.graphData!.nodes.find(n => n.id === nodeId)
      if (node) {
        totalRisk += node.riskScore || 0
      }
    })
    
    const avgRisk = totalRisk / shortestPath.length

    // Also get alternative paths for advanced users
    const alternativePaths = pathTracer.findAlternativePaths(sourceNode.id, targetNode.id, 3)
    const allPaths = alternativePaths.map(p => p.path)

    console.log('Path found:', {
      from: sourceNode.label,
      to: targetNode.label,
      hops: shortestPath.length - 1,
      weight: totalWeight,
      risk: avgRisk,
      path: shortestPath
    })

    set({
      pathHighlight: {
        isActive: true,
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        pathNodes,
        pathEdges,
        paths: allPaths,
        pathMetrics: {
          distance: shortestPath.length - 1,
          totalWeight,
          riskScore: avgRisk
        }
      }
    })
  },

  clearPathHighlight: () => {
    set({
      pathHighlight: {
        isActive: false,
        sourceNodeId: null,
        targetNodeId: null,
        pathNodes: new Set(),
        pathEdges: new Set(),
        paths: [],
        pathMetrics: null
      }
    })
  },

  isNodeInPath: (nodeId: string) => {
    return get().pathHighlight.pathNodes.has(nodeId)
  },

  isEdgeInPath: (edgeId: string) => {
    return get().pathHighlight.pathEdges.has(edgeId)
  },

  getPathHighlight: () => {
    return get().pathHighlight
  }
}))