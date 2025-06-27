import React, { useEffect, useRef, useState, useCallback } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import { circular } from 'graphology-layout'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { SupplyChainGenerator } from '../data/supplyChainGenerator'
import { GraphUtils, ColorMode } from '../utils/graphUtils'
import { SupplyChainGraph as SupplyChainGraphType, NodeType } from '../types/supplyChain'
import GraphControls from './GraphControls'
import { useSelectionStore } from '../store/selectionStore'

interface SigmaGraphProps {
  nodeCount?: number
  enablePhysics?: boolean
  useStaticLayout?: boolean
}

const SigmaGraph: React.FC<SigmaGraphProps> = ({ 
  nodeCount = 50, 
  enablePhysics = true,
  useStaticLayout = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<NodeType[]>(Object.values(NodeType))
  const [selectedTiers, setSelectedTiers] = useState<number[]>([0, 1, 2, 3, 4, 5])
  const [currentDataset, setCurrentDataset] = useState<string | undefined>(undefined)
  const [availableNodeTypes, setAvailableNodeTypes] = useState<NodeType[]>(Object.values(NodeType))
  const [availableTiers, setAvailableTiers] = useState<number[]>([0, 1, 2, 3, 4, 5])
  const [, setHasPreCalculatedPositions] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('nodeType')
  
  // Store data and actions
  const { 
    addNode, 
    addEdge, 
    graphData, 
    fullGraphData, 
    isLoading,
    setGraphData,
    setFullGraphData,
    setLoading,
    crisis,
    selectedItems,
    pathHighlight
  } = useSelectionStore()

  const initializeSigma = useCallback((data: SupplyChainGraphType, mode?: ColorMode) => {
    if (!containerRef.current) return
    
    // Clean up previous Sigma instance
    if (sigmaRef.current) {
      console.log('Cleaning up previous Sigma instance')
      sigmaRef.current.kill()
      sigmaRef.current = null
    }
    
    // Clear the container
    containerRef.current.innerHTML = ''
    
    console.log('Initializing Sigma with', data.nodes.length, 'nodes and', data.edges.length, 'edges')

    // Check if nodes have pre-calculated positions
    const hasPositions = data.nodes.some(node => node.x !== undefined && node.y !== undefined)
    setHasPreCalculatedPositions(hasPositions)
    
    // Create a graphology graph
    const currentMode = mode || colorMode
    const affectedNodes = crisis.crisisMode ? crisis.affectedNodes : undefined
    const graph = GraphUtils.createGraphologyGraph(data, useStaticLayout, currentMode, affectedNodes)
    
    // Debug: Check what was actually added to the graph
    console.log('📊 Created Graphology graph:')
    console.log('  - Nodes:', graph.order)
    console.log('  - Edges:', graph.size)
    console.log('  - Edge list:', graph.edges().slice(0, 5)) // Show first 5 edges
    
    // Debug: Check edge attributes
    if (graph.size > 0) {
      const firstEdge = graph.edges()[0]
      const edgeAttrs = graph.getEdgeAttributes(firstEdge)
      console.log('  - First edge attributes:', edgeAttrs)
      console.log('  - First edge source/target:', graph.source(firstEdge), '->', graph.target(firstEdge))
    }
    
    // Only apply layout if no pre-calculated positions or if static layout is disabled
    if (!hasPositions || !useStaticLayout) {
      // Apply circular layout initially for better starting positions
      circular.assign(graph)
    }
    
    // Create Sigma instance with explicit edge events enabled
    const sigma = new Sigma(graph, containerRef.current, {
      // Basic settings
      renderEdgeLabels: false,
      allowInvalidContainer: false,
      // Explicitly enable edge events  
      enableEdgeEvents: true,
      // Node settings
      defaultNodeColor: '#999',
      // Edge settings - thin edges with larger hit area for clicking
      defaultEdgeColor: '#666',
      // Custom reducers for interactive styling
      nodeReducer: (node, data) => {
        const state = useSelectionStore.getState()
        const selectedNodes = state.getSelectedNodes()
        const isSelected = selectedNodes.some(n => n.id === node)
        const isInPath = state.isNodeInPath(node)
        const pathHighlight = state.getPathHighlight()
        
        // Determine node styling based on state
        let nodeColor = data.color || '#999'
        let nodeSize = data.size || 8
        let borderColor = undefined
        let borderWidth = 0
        
        if (isInPath && pathHighlight.isActive) {
          // Golden border for path nodes
          borderColor = '#ffd700' // Gold
          borderWidth = 3
          
          // Make start and end nodes larger and more prominent
          if (node === pathHighlight.sourceNodeId || node === pathHighlight.targetNodeId) {
            nodeSize = Math.max(nodeSize * 1.5, 12)
            borderWidth = 4
            borderColor = '#ff8c00' // Dark orange for endpoints
          }
        }
        
        if (isSelected) {
          // Keep selected nodes with their selection styling
          borderColor = '#e74c3c' // Red border for selected
          borderWidth = 2
        }
        
        return {
          ...data,
          size: nodeSize,
          color: nodeColor,
          borderColor,
          borderWidth
        }
      },
      edgeReducer: (edge, data) => {
        const state = useSelectionStore.getState()
        const selectedEdges = state.getSelectedEdges()
        const isSelected = selectedEdges.some(e => e.id === edge)
        const isInPath = state.isEdgeInPath(edge)
        const pathHighlight = state.getPathHighlight()
        
        // Determine edge styling priority:
        // 1. Path highlighting (highest priority)
        // 2. Selection highlighting
        // 3. Default styling
        
        let edgeColor = data.color || '#666'
        let edgeSize = Math.max(1, data.size || 1)
        
        if (isInPath && pathHighlight.isActive) {
          // Golden path edges with animation-like effect
          edgeColor = '#ffd700' // Gold for path
          edgeSize = Math.max(6, data.size || 4) // Thick golden path
        } else if (isSelected) {
          // Red selected edges
          edgeColor = '#e74c3c'
          edgeSize = Math.max(4, data.size || 3)
        }
        
        return {
          ...data,
          size: edgeSize,
          color: edgeColor,
          // Ensure edges are always visible
          hidden: false,
          // Add slight transparency to non-path edges when path is active
          opacity: (pathHighlight.isActive && !isInPath && !isSelected) ? 0.3 : 1.0
        }
      }
    })
    
    console.log('Sigma instance created successfully')
    
    // Store references
    sigmaRef.current = sigma
    graphRef.current = graph
    
    // Force a refresh to ensure colors are applied
    sigma.refresh()
    
    // Apply force layout if physics enabled AND no static positions
    if (enablePhysics && (!hasPositions || !useStaticLayout)) {
      console.log('Starting ForceAtlas2 layout')
      forceAtlas2.assign(graph, {
        iterations: 50,
        settings: {
          gravity: 1,
          outboundAttractionDistribution: false,
          linLogMode: false,
          adjustSizes: false,
          edgeWeightInfluence: 0,
          scalingRatio: 1,
          strongGravityMode: false,
          slowDown: 1
        }
      })
      sigma.refresh()
    }
    
    // Add click handlers  
    sigma.on('clickNode', (event) => {
      console.log('🔵 Node clicked:', event.node)
      const nodeData = data.nodes.find(n => n.id === event.node)
      if (nodeData) {
        console.log('✅ Adding node to selection:', nodeData.label)
        addNode(nodeData)
      }
    })
    
    // Also listen for general click events to debug
    sigma.on('clickStage', (event) => {
      console.log('🖱️ Stage clicked at:', event.event.x, event.event.y)
    })
    
    // Try different edge event approach
    sigma.on('enterEdge', (event) => {
      console.log('🔗 Edge hover detected:', event.edge)
    })
    
    sigma.on('clickEdge', (event) => {
      console.log('🔗 Edge clicked:', event.edge)
      console.log('🔍 Looking for edge in data.edges array...')
      
      const edgeData = data.edges.find(e => e.id === event.edge)
      if (edgeData) {
        console.log('✅ Found original edge data:', edgeData)
        console.log('📋 Adding edge to selection store...')
        addEdge(edgeData)
        console.log('✅ Edge added to store')
      } else {
        console.log('❌ Original edge data not found, creating synthetic data...')
        // Try to find edge by source-target if ID doesn't match
        const graphEdge = graph.getEdgeAttributes(event.edge)
        console.log('📊 Graph edge attributes:', graphEdge)
        
        // Create edge data from graph attributes if original edge data not found
        const syntheticEdgeData = {
          id: event.edge,
          source: graph.source(event.edge),
          target: graph.target(event.edge),
          weight: graphEdge.weight || 1,
          type: graphEdge.edgeType || 'MATERIAL_FLOW',
          label: `${graph.source(event.edge)} → ${graph.target(event.edge)}`
        }
        console.log('🔧 Created synthetic edge data:', syntheticEdgeData)
        console.log('📋 Adding synthetic edge to selection store...')
        addEdge(syntheticEdgeData)
        console.log('✅ Synthetic edge added to store')
      }
      
      // Log current selection state
      const currentState = useSelectionStore.getState()
      console.log('📊 Current selection state:', {
        totalItems: currentState.selectedItems.length,
        edges: currentState.selectedItems.filter(item => item.type === 'edge').length,
        nodes: currentState.selectedItems.filter(item => item.type === 'node').length,
        panelOpen: currentState.isPanelOpen
      })
    })

    // Add edge hover effects for better interaction feedback
    sigma.on('enterEdge', (event) => {
      // Edge hover effect is handled by Sigma configuration
      console.log('Hovering edge:', event.edge)
    })

    sigma.on('leaveEdge', (event) => {
      // Edge hover effect removal is handled by Sigma configuration
      console.log('Left edge:', event.edge)
    })
    
  }, [enablePhysics, useStaticLayout, colorMode, crisis])

  const generateGraph = useCallback(async () => {
    setLoading(true)
    
    try {
      console.log('Generating graph with', nodeCount, 'nodes')
      const rawGraph = SupplyChainGenerator.generateGraph(nodeCount, 'Electronics', 'Global')
      
      setFullGraphData(rawGraph)
      
      // Update available options based on actual data
      const dataNodeTypes = [...new Set(rawGraph.nodes.map(n => n.type))] as NodeType[]
      const dataTiers = [...new Set(rawGraph.nodes.map(n => n.tier))].sort((a, b) => a - b)
      setAvailableNodeTypes(dataNodeTypes)
      setAvailableTiers(dataTiers)
      
      // Adjust selected filters to only include available options
      const validNodeTypes = selectedNodeTypes.filter(type => dataNodeTypes.includes(type))
      const validTiers = selectedTiers.filter(tier => dataTiers.includes(tier))
      setSelectedNodeTypes(validNodeTypes.length > 0 ? validNodeTypes : dataNodeTypes)
      setSelectedTiers(validTiers.length > 0 ? validTiers : dataTiers)
      
      let filteredGraph = GraphUtils.filterGraphByNodeType(rawGraph, validNodeTypes.length > 0 ? validNodeTypes : dataNodeTypes)
      filteredGraph = GraphUtils.filterGraphByTier(filteredGraph, validTiers.length > 0 ? validTiers : dataTiers)
      
      setGraphData(filteredGraph)
      setCurrentDataset(undefined) // Clear current dataset when generating new graph
      initializeSigma(filteredGraph)
      
      setLoading(false)
    } catch (error) {
      console.error('Error generating graph:', error)
      setLoading(false)
    }
  }, [nodeCount, initializeSigma])

  const handleLoadSampleData = useCallback(async (filename: string) => {
    setLoading(true)
    
    try {
      console.log('Loading sample data:', filename)
      const rawGraph = await SupplyChainGenerator.loadSampleData(filename)
      
      setFullGraphData(rawGraph)
      
      // Update available options based on actual data
      const dataNodeTypes = [...new Set(rawGraph.nodes.map(n => n.type))] as NodeType[]
      const dataTiers = [...new Set(rawGraph.nodes.map(n => n.tier))].sort((a, b) => a - b)
      setAvailableNodeTypes(dataNodeTypes)
      setAvailableTiers(dataTiers)
      
      // Adjust selected filters to only include available options
      const validNodeTypes = selectedNodeTypes.filter(type => dataNodeTypes.includes(type))
      const validTiers = selectedTiers.filter(tier => dataTiers.includes(tier))
      setSelectedNodeTypes(validNodeTypes.length > 0 ? validNodeTypes : dataNodeTypes)
      setSelectedTiers(validTiers.length > 0 ? validTiers : dataTiers)
      
      let filteredGraph = GraphUtils.filterGraphByNodeType(rawGraph, validNodeTypes.length > 0 ? validNodeTypes : dataNodeTypes)
      filteredGraph = GraphUtils.filterGraphByTier(filteredGraph, validTiers.length > 0 ? validTiers : dataTiers)
      
      setGraphData(filteredGraph)
      setCurrentDataset(filename)
      initializeSigma(filteredGraph)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading sample data:', error)
      setLoading(false)
    }
  }, [initializeSigma])

  const handleFilterChange = useCallback(async (nodeTypes: NodeType[], tiers: number[]) => {
    setSelectedNodeTypes(nodeTypes)
    setSelectedTiers(tiers)
    
    if (fullGraphData) {
      let filteredGraph = GraphUtils.filterGraphByNodeType(fullGraphData, nodeTypes)
      filteredGraph = GraphUtils.filterGraphByTier(filteredGraph, tiers)
      
      setGraphData(filteredGraph)
      initializeSigma(filteredGraph)
    }
  }, [fullGraphData, initializeSigma])

  const handlePhysicsToggle = useCallback(() => {
    if (graphRef.current && sigmaRef.current) {
      if (enablePhysics) {
        console.log('Applying random layout')
        graphRef.current.forEachNode((node) => {
          graphRef.current!.setNodeAttribute(node, 'x', (Math.random() - 0.5) * 1000)
          graphRef.current!.setNodeAttribute(node, 'y', (Math.random() - 0.5) * 1000)
        })
      } else {
        console.log('Applying ForceAtlas2 layout')
        forceAtlas2.assign(graphRef.current, { iterations: 50 })
      }
      sigmaRef.current.refresh()
    }
  }, [enablePhysics])

  const handleZoomToFit = useCallback(() => {
    if (sigmaRef.current) {
      console.log('Fitting view to graph')
      sigmaRef.current.getCamera().animatedReset()
    }
  }, [])

  const handleExportPNG = useCallback(() => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas')
      if (canvas) {
        const link = document.createElement('a')
        link.download = 'supply-chain-graph.png'
        link.href = canvas.toDataURL()
        link.click()
      }
    }
  }, [])

  const handleColorModeChange = useCallback(async (newColorMode: ColorMode) => {
    setColorMode(newColorMode)
    
    if (graphData) {
      initializeSigma(graphData, newColorMode)
    }
  }, [graphData, initializeSigma])

  useEffect(() => {
    // Only generate on initial mount
    const initialGenerate = async () => {
      setLoading(true)
      try {
        const rawGraph = SupplyChainGenerator.generateGraph(nodeCount, 'Electronics', 'Global')
        setFullGraphData(rawGraph)
        
        const dataNodeTypes = [...new Set(rawGraph.nodes.map(n => n.type))] as NodeType[]
        const dataTiers = [...new Set(rawGraph.nodes.map(n => n.tier))].sort((a, b) => a - b)
        setAvailableNodeTypes(dataNodeTypes)
        setAvailableTiers(dataTiers)
        setSelectedNodeTypes(dataNodeTypes)
        setSelectedTiers(dataTiers)
        
        setGraphData(rawGraph)
        setCurrentDataset(undefined)
        initializeSigma(rawGraph)
        setLoading(false)
      } catch (error) {
        console.error('Error generating initial graph:', error)
        setLoading(false)
      }
    }
    
    initialGenerate()
    
    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (sigmaRef.current) {
        sigmaRef.current.refresh()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Effect to refresh graph when data changes (e.g., risk score updates)
  useEffect(() => {
    if (graphData && sigmaRef.current) {
      console.log('Graph data changed, refreshing visualization')
      initializeSigma(graphData, colorMode)
    }
  }, [graphData, colorMode, initializeSigma])

  // Effect to refresh visualization when selection changes
  useEffect(() => {
    if (sigmaRef.current) {
      console.log('Selection changed, refreshing graph')
      sigmaRef.current.refresh()
    }
  }, [selectedItems])

  // Effect to refresh visualization when path highlighting changes
  useEffect(() => {
    if (sigmaRef.current) {
      if (pathHighlight.isActive) {
        console.log('Path highlighting activated, refreshing graph')
      } else {
        console.log('Path highlighting cleared, refreshing graph')
      }
      sigmaRef.current.refresh()
    }
  }, [pathHighlight])

  return (
    <div className="w-full h-full flex">
      <GraphControls
        isLoading={isLoading}
        nodeCount={graphData?.metadata.totalNodes || 0}
        edgeCount={graphData?.metadata.totalEdges || 0}
        fullNodeCount={fullGraphData?.metadata.totalNodes || 0}
        fullEdgeCount={fullGraphData?.metadata.totalEdges || 0}
        selectedNodeTypes={selectedNodeTypes}
        selectedTiers={selectedTiers}
        onFilterChange={handleFilterChange}
        onRegenerateGraph={generateGraph}
        onPhysicsToggle={handlePhysicsToggle}
        onZoomToFit={handleZoomToFit}
        onExportPNG={handleExportPNG}
        physicsEnabled={enablePhysics}
        onLoadSampleData={handleLoadSampleData}
        currentDataset={currentDataset}
        availableNodeTypes={availableNodeTypes}
        availableTiers={availableTiers}
        colorMode={colorMode}
        onColorModeChange={handleColorModeChange}
      />
      
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-white text-xl flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span>Generating graph with {nodeCount} nodes...</span>
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          className="w-full h-full graph-container bg-white"
          data-testid="graph-container"
        />
      </div>
    </div>
  )
}

export default SigmaGraph