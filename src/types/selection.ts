import { SupplyChainNode, SupplyChainEdge, SupplyChainGraph } from './supplyChain'

export type SelectionType = 'node' | 'edge'

export interface SelectedItem {
  id: string
  type: SelectionType
  data: SupplyChainNode | SupplyChainEdge
  timestamp: number
}

export interface SelectionState {
  selectedItems: SelectedItem[]
  isPanelOpen: boolean
  activeAccordionItems: string[]
  maxSelections: number
  // Graph data state
  graphData: SupplyChainGraph | null
  fullGraphData: SupplyChainGraph | null
  isLoading: boolean
}

export interface SelectionActions {
  addNode: (node: SupplyChainNode) => void
  addEdge: (edge: SupplyChainEdge) => void
  removeItem: (id: string) => void
  clearAll: () => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
  toggleAccordionItem: (id: string) => void
  isNodeSelected: (nodeId: string) => boolean
  isEdgeSelected: (edgeId: string) => boolean
  getSelectedNodes: () => SupplyChainNode[]
  getSelectedEdges: () => SupplyChainEdge[]
  // Graph data actions
  setGraphData: (data: SupplyChainGraph) => void
  setFullGraphData: (data: SupplyChainGraph) => void
  setLoading: (loading: boolean) => void
  updateNodeRiskScore: (nodeId: string, riskScore: number) => void
  getNodeById: (nodeId: string) => SupplyChainNode | undefined
}

export type SelectionStore = SelectionState & SelectionActions