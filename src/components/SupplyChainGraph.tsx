import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Graph } from '@cosmos.gl/graph'
import { SupplyChainGenerator } from '../data/supplyChainGenerator'
import { GraphUtils, CosmosGraphData, ColorMode } from '../utils/graphUtils'
import { SupplyChainGraph as SupplyChainGraphType, NodeType } from '../types/supplyChain'
import { PerformanceUtils } from '../utils/performanceUtils'
import GraphControls from './GraphControls'
import { useSelectionStore } from '../store/selectionStore'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 105, g: 179, b: 162 }
}

interface SupplyChainGraphProps {
  nodeCount?: number
  enablePhysics?: boolean
  useStaticLayout?: boolean
}

const SupplyChainGraph: React.FC<SupplyChainGraphProps> = ({ 
  nodeCount = 50, // Start with smaller count for debugging
  enablePhysics = true,
  useStaticLayout = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cosmosRef = useRef<Graph | null>(null)
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<NodeType[]>(Object.values(NodeType))
  const [selectedTiers, setSelectedTiers] = useState<number[]>([0, 1, 2, 3, 4, 5])
  const [currentZoomLevel] = useState(1.0)
  const [renderProgress, setRenderProgress] = useState(0)
  const [performanceMode, setPerformanceMode] = useState(nodeCount > 50000)
  const [currentDataset, setCurrentDataset] = useState<string | undefined>(undefined)
  const [availableNodeTypes, setAvailableNodeTypes] = useState<NodeType[]>(Object.values(NodeType))
  const [availableTiers, setAvailableTiers] = useState<number[]>([0, 1, 2, 3, 4, 5])
  const [, setHasPreCalculatedPositions] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('nodeType')
  
  // Store data and actions
  const { 
    addNode,
    graphData, 
    fullGraphData, 
    isLoading,
    setGraphData,
    setFullGraphData,
    setLoading
  } = useSelectionStore()

  const initializeCosmos = useCallback((data: CosmosGraphData, originalData?: SupplyChainGraphType) => {
    if (!containerRef.current) return
    
    // Clean up previous Cosmos instance
    if (cosmosRef.current) {
      console.log('Cleaning up previous Cosmos instance')
      cosmosRef.current.destroy()
      cosmosRef.current = null
    }
    
    // Clear the container
    containerRef.current.innerHTML = ''
    
    console.log('Initializing graph with', data.nodes.length, 'nodes and', data.links.length, 'links')
    
    // Check if nodes have pre-calculated positions
    const hasPositions = data.nodes.some(node => node.x !== undefined && node.y !== undefined)
    setHasPreCalculatedPositions(hasPositions)
    console.log('Has pre-calculated positions:', hasPositions)

    const config = {
      spaceSize: data.nodes.length > 5000000 ? 32768 : data.nodes.length > 100000 ? 16384 : 8192, // Ultra-large space for extreme graphs
      simulationFriction: 0.9,
      simulationGravity: 0.0,
      simulationRepulsion: 1.0,
      curvedLinks: false,
      fitViewOnInit: false, // We'll fit manually
      fitViewDelay: 0,
      fitViewPadding: data.nodes.length > 100000 ? 0.95 : 0.85, // More padding for large graphs
      enableDrag: true,
      backgroundColor: [0.13, 0.13, 0.13, 1.0] as [number, number, number, number], // Dark gray background
      onClick: (index: number | undefined, _pointPosition: [number, number] | undefined, _event: MouseEvent) => {
        if (index !== undefined) {
          console.log('Clicked point index:', index)
          if (originalData && originalData.nodes[index]) {
            console.log('Node:', originalData.nodes[index])
            addNode(originalData.nodes[index])
          }
        }
      }
    }

    const graph = new Graph(containerRef.current, config)
    console.log('Graph instance created')
    
    // Create point positions array
    const pointPositions = new Float32Array(data.nodes.length * 2)
    const pointColors = new Float32Array(data.nodes.length * 4)
    const pointSizes = new Float32Array(data.nodes.length)
    
    data.nodes.forEach((node, i) => {
      // Use pre-calculated positions if available and static layout is enabled
      if (hasPositions && useStaticLayout && node.x !== undefined && node.y !== undefined) {
        // Scale coordinates to fill the available space properly
        const scaleFactor = data.nodes.length > 5000000 ? 2 : data.nodes.length > 500000 ? 1.5 : 1
        pointPositions[i * 2] = node.x * scaleFactor
        pointPositions[i * 2 + 1] = node.y * scaleFactor
      } else {
        // Random positions in a smaller, more visible range
        pointPositions[i * 2] = (Math.random() - 0.5) * 200
        pointPositions[i * 2 + 1] = (Math.random() - 0.5) * 200
      }
      
      const color = node.color || '#69b3a2'
      const rgb = hexToRgb(color)
      pointColors[i * 4] = rgb.r / 255
      pointColors[i * 4 + 1] = rgb.g / 255
      pointColors[i * 4 + 2] = rgb.b / 255
      pointColors[i * 4 + 3] = 1.0
      
      // Scale node size based on graph size
      const baseSize = data.nodes.length > 5000000 ? 1 : data.nodes.length > 500000 ? 2 : data.nodes.length > 50000 ? 4 : 8
      const multiplier = data.nodes.length > 5000000 ? 0.5 : data.nodes.length > 500000 ? 1 : 2
      pointSizes[i] = (node.size || baseSize) * multiplier
    })
    
    console.log('Setting point positions for', data.nodes.length, 'points')
    graph.setPointPositions(pointPositions)
    graph.setPointColors(pointColors)
    graph.setPointSizes(pointSizes)
    
    // Create links if they exist
    if (data.links.length > 0) {
      const linkIndices = new Float32Array(data.links.length * 2)
      const linkColors = new Float32Array(data.links.length * 4)
      let validLinkCount = 0
      
      data.links.forEach((link) => {
        const sourceIndex = data.nodes.findIndex(n => n.id === link.source)
        const targetIndex = data.nodes.findIndex(n => n.id === link.target)
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          linkIndices[validLinkCount * 2] = sourceIndex
          linkIndices[validLinkCount * 2 + 1] = targetIndex
          
          const color = link.color || '#666'
          const rgb = hexToRgb(color)
          linkColors[validLinkCount * 4] = rgb.r / 255
          linkColors[validLinkCount * 4 + 1] = rgb.g / 255
          linkColors[validLinkCount * 4 + 2] = rgb.b / 255
          linkColors[validLinkCount * 4 + 3] = 0.3 // More transparent for better visibility
          
          validLinkCount++
        }
      })
      
      if (validLinkCount > 0) {
        console.log('Setting', validLinkCount, 'valid links')
        const trimmedLinkIndices = linkIndices.slice(0, validLinkCount * 2)
        const trimmedLinkColors = linkColors.slice(0, validLinkCount * 4)
        
        graph.setLinks(trimmedLinkIndices)
        graph.setLinkColors(trimmedLinkColors)
      }
    }

    // Important: Render and fit view to make nodes visible  
    console.log('Rendering graph')
    graph.render()
    
    // Fit view after a short delay
    setTimeout(() => {
      console.log('Fitting view to graph')
      graph.fitView()
    }, 100)
    
    // Start simulation after rendering only if no static positions
    if (enablePhysics && (!hasPositions || !useStaticLayout)) {
      console.log('Starting graph simulation')
      graph.start()
    } else if (hasPositions && useStaticLayout) {
      console.log('Using static layout, physics simulation disabled')
    }
    
    cosmosRef.current = graph
  }, [enablePhysics, useStaticLayout])

  const applyLevelOfDetail = useCallback((graph: SupplyChainGraphType, zoomLevel: number): SupplyChainGraphType => {
    if (!performanceMode) return graph
    
    const targetNodeCount = PerformanceUtils.getNodeCountByZoomLevel(graph.nodes.length, zoomLevel)
    const targetEdgeCount = PerformanceUtils.getEdgeCountByZoomLevel(graph.edges.length, zoomLevel)
    
    const sampledNodes = PerformanceUtils.sampleNodes(graph.nodes, targetNodeCount)
    const sampledEdges = PerformanceUtils.sampleEdges(graph.edges, sampledNodes, targetEdgeCount)
    
    return {
      nodes: sampledNodes,
      edges: sampledEdges,
      metadata: {
        ...graph.metadata,
        totalNodes: sampledNodes.length,
        totalEdges: sampledEdges.length
      }
    }
  }, [performanceMode])

  const generateGraph = useCallback(async () => {
    setLoading(true)
    setRenderProgress(0)
    
    try {
      const rawGraph = await PerformanceUtils.measureAsyncPerformance(
        'Graph Generation',
        async () => {
          if (performanceMode && nodeCount > 50000) {
            return await PerformanceUtils.chunkedProcessing<number, SupplyChainGraphType>(
              Array.from({ length: Math.ceil(nodeCount / 10000) }, (_, i) => i),
              async (chunk) => {
                const chunkIndex = chunk[0]
                const chunkGraph = SupplyChainGenerator.generateGraph(
                  Math.min(10000, nodeCount - chunkIndex * 10000),
                  'Electronics',
                  'Global'
                )
                return [chunkGraph]
              },
              1,
              setRenderProgress
            ).then(chunks => {
              const combinedNodes = chunks.flatMap(graph => graph.nodes)
              const combinedEdges = chunks.flatMap(graph => graph.edges)
              return {
                nodes: combinedNodes,
                edges: combinedEdges,
                metadata: {
                  totalValue: combinedEdges.reduce((sum, edge) => sum + (edge.volume || 0), 0),
                  totalNodes: combinedNodes.length,
                  totalEdges: combinedEdges.length,
                  industry: 'Electronics',
                  region: 'Global'
                }
              }
            })
          } else {
            return SupplyChainGenerator.generateGraph(nodeCount, 'Electronics', 'Global')
          }
        }
      )
      
      setFullGraphData(rawGraph)
      setCurrentDataset(undefined) // Clear current dataset when generating new graph
      
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
      
      const optimizedGraph = applyLevelOfDetail(filteredGraph, currentZoomLevel)
      setGraphData(optimizedGraph)
      
      const cosmosData = GraphUtils.convertToCosmosFormat(optimizedGraph, colorMode)
      
      await PerformanceUtils.measureAsyncPerformance(
        'Graph Rendering',
        async () => {
          initializeCosmos(cosmosData, optimizedGraph)
          await PerformanceUtils.nextFrame()
        }
      )
      
      setRenderProgress(100)
      setLoading(false)
    } catch (error) {
      console.error('Error generating graph:', error)
      setLoading(false)
    }
  }, [nodeCount, currentZoomLevel, performanceMode, applyLevelOfDetail, initializeCosmos, colorMode])

  const handleLoadSampleData = useCallback(async (filename: string) => {
    setLoading(true)
    setRenderProgress(0)
    
    try {
      console.log('Loading sample data:', filename)
      const rawGraph = await SupplyChainGenerator.loadSampleData(filename)
      
      setFullGraphData(rawGraph)
      setCurrentDataset(filename)
      
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
      
      const optimizedGraph = applyLevelOfDetail(filteredGraph, currentZoomLevel)
      setGraphData(optimizedGraph)
      
      const cosmosData = GraphUtils.convertToCosmosFormat(optimizedGraph, colorMode)
      
      await PerformanceUtils.measureAsyncPerformance(
        'Graph Rendering',
        async () => {
          initializeCosmos(cosmosData, optimizedGraph)
          await PerformanceUtils.nextFrame()
        }
      )
      
      setRenderProgress(100)
      setLoading(false)
    } catch (error) {
      console.error('Error loading sample data:', error)
      setLoading(false)
    }
  }, [currentZoomLevel, applyLevelOfDetail, initializeCosmos, colorMode])

  const handleFilterChange = useCallback(async (nodeTypes: NodeType[], tiers: number[]) => {
    setSelectedNodeTypes(nodeTypes)
    setSelectedTiers(tiers)
    
    if (fullGraphData) {
      let filteredGraph = GraphUtils.filterGraphByNodeType(fullGraphData, nodeTypes)
      filteredGraph = GraphUtils.filterGraphByTier(filteredGraph, tiers)
      
      const optimizedGraph = applyLevelOfDetail(filteredGraph, currentZoomLevel)
      setGraphData(optimizedGraph)
      
      const cosmosData = GraphUtils.convertToCosmosFormat(optimizedGraph, colorMode)
      
      await PerformanceUtils.measureAsyncPerformance(
        'Filter Update',
        async () => {
          initializeCosmos(cosmosData, optimizedGraph)
          await PerformanceUtils.nextFrame()
        }
      )
    }
  }, [fullGraphData, currentZoomLevel, applyLevelOfDetail, initializeCosmos, colorMode])

  const handleColorModeChange = useCallback(async (newColorMode: ColorMode) => {
    setColorMode(newColorMode)
    
    if (graphData) {
      const cosmosData = GraphUtils.convertToCosmosFormat(graphData, newColorMode)
      
      await PerformanceUtils.measureAsyncPerformance(
        'Color Mode Update',
        async () => {
          initializeCosmos(cosmosData, graphData)
          await PerformanceUtils.nextFrame()
        }
      )
    }
  }, [graphData, initializeCosmos])

  const handlePhysicsToggle = useCallback(() => {
    if (cosmosRef.current) {
      if (enablePhysics) {
        console.log('Pausing physics simulation')
        cosmosRef.current.pause()
      } else {
        console.log('Starting physics simulation')
        cosmosRef.current.start()
      }
    }
  }, [enablePhysics])

  const handleZoomToFit = useCallback(() => {
    if (cosmosRef.current) {
      console.log('Fitting view to graph')
      cosmosRef.current.fitView()
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

  useEffect(() => {
    // Only generate on initial mount
    const initialGenerate = async () => {
      setLoading(true)
      setRenderProgress(0)
      try {
        const rawGraph = SupplyChainGenerator.generateGraph(nodeCount, 'Electronics', 'Global')
        setFullGraphData(rawGraph)
        
        const dataNodeTypes = [...new Set(rawGraph.nodes.map(n => n.type))] as NodeType[]
        const dataTiers = [...new Set(rawGraph.nodes.map(n => n.tier))].sort((a, b) => a - b)
        setAvailableNodeTypes(dataNodeTypes)
        setAvailableTiers(dataTiers)
        setSelectedNodeTypes(dataNodeTypes)
        setSelectedTiers(dataTiers)
        
        const optimizedGraph = applyLevelOfDetail(rawGraph, currentZoomLevel)
        setGraphData(optimizedGraph)
        setCurrentDataset(undefined)
        
        const cosmosData = GraphUtils.convertToCosmosFormat(optimizedGraph, colorMode)
        await PerformanceUtils.measureAsyncPerformance(
          'Graph Rendering',
          async () => {
            initializeCosmos(cosmosData, optimizedGraph)
            await PerformanceUtils.nextFrame()
          }
        )
        
        setRenderProgress(100)
        setLoading(false)
      } catch (error) {
        console.error('Error generating initial graph:', error)
        setLoading(false)
      }
    }
    
    initialGenerate()
    
    return () => {
      if (cosmosRef.current) {
        cosmosRef.current.destroy()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (cosmosRef.current && containerRef.current) {
        cosmosRef.current.fitView()
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Effect to refresh graph when data changes (e.g., risk score updates)
  useEffect(() => {
    if (graphData && cosmosRef.current) {
      console.log('Graph data changed, refreshing Cosmos visualization')
      const cosmosData = GraphUtils.convertToCosmosFormat(graphData, colorMode)
      initializeCosmos(cosmosData, graphData)
    }
  }, [graphData, colorMode, initializeCosmos])

  return (
    <div className="w-full h-full flex">
      <GraphControls
        isLoading={isLoading}
        nodeCount={graphData?.metadata.totalNodes || 0}
        edgeCount={graphData?.metadata.totalEdges || 0}
        fullNodeCount={fullGraphData?.metadata.totalNodes || 0}
        fullEdgeCount={fullGraphData?.metadata.totalEdges || 0}
        currentZoom={currentZoomLevel}
        renderProgress={renderProgress}
        performanceMode={performanceMode}
        onPerformanceModeToggle={() => setPerformanceMode(!performanceMode)}
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
          className="w-full h-full graph-container"
        />
      </div>
    </div>
  )
}

export default SupplyChainGraph