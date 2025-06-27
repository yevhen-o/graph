import { SupplyChainNode, SupplyChainEdge, SupplyChainGraph } from './supplyChain'
import { PathTraceResult } from '../utils/pathTracing'

export type SelectionType = 'node' | 'edge'

export interface SelectedItem {
  id: string
  type: SelectionType
  data: SupplyChainNode | SupplyChainEdge
  timestamp: number
}

export interface PathHighlight {
  isActive: boolean
  sourceNodeId: string | null
  targetNodeId: string | null
  // Shortest path (golden highlighting)
  shortestPathNodes: Set<string>
  shortestPathEdges: Set<string>
  // All paths (red/selected highlighting)
  allPathNodes: Set<string>
  allPathEdges: Set<string>
  paths: string[][] // Multiple paths if available
  pathMetrics: {
    distance: number
    totalWeight: number
    riskScore: number
  } | null
}

export interface CrisisState {
  crisisMode: boolean
  crisisSource: string | null
  crisisType: string
  affectedNodes: Set<string>
  affectedEdges: Set<string>
  impactAnalysis: PathTraceResult | null
  showCrisisLegend: boolean
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
  // Crisis simulation state
  crisis: CrisisState
  // Path highlighting state
  pathHighlight: PathHighlight
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
  // Crisis simulation actions
  enableCrisisMode: (sourceNodeId: string, crisisType: string) => void
  disableCrisisMode: () => void
  toggleCrisisMode: () => void
  setCrisisSource: (sourceNodeId: string, crisisType: string) => void
  isNodeAffectedByCrisis: (nodeId: string) => boolean
  isEdgeAffectedByCrisis: (edgeId: string) => boolean
  getCrisisImpactStats: () => { affectedNodes: number; totalImpact: number; criticalPaths: number }
  toggleCrisisLegend: () => void
  // Path highlighting actions
  findPathsBetweenSelected: () => void
  clearPathHighlight: () => void
  isNodeInPath: (nodeId: string) => boolean
  isEdgeInPath: (edgeId: string) => boolean
  isNodeInShortestPath: (nodeId: string) => boolean
  isEdgeInShortestPath: (edgeId: string) => boolean
  getPathHighlight: () => PathHighlight
}

export type SelectionStore = SelectionState & SelectionActions