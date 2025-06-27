import { create } from 'zustand'
import { SelectionStore, SelectedItem } from '../types/selection'
import { SupplyChainNode, SupplyChainEdge } from '../types/supplyChain'

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
        
        return {
          selectedItems: updatedItems,
          isPanelOpen: true,
          activeAccordionItems: state.activeAccordionItems.includes(node.id) 
            ? state.activeAccordionItems 
            : [node.id, ...state.activeAccordionItems]
        }
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

      return {
        selectedItems: updatedItems,
        isPanelOpen: true,
        activeAccordionItems: [node.id, ...state.activeAccordionItems]
      }
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
    set((state) => ({
      selectedItems: state.selectedItems.filter(item => item.id !== id),
      activeAccordionItems: state.activeAccordionItems.filter(itemId => itemId !== id)
    }))
  },

  clearAll: () => {
    set({
      selectedItems: [],
      activeAccordionItems: []
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
  }
}))