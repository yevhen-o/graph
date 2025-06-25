import React, { useEffect, useRef, useState, useCallback } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import { circular } from 'graphology-layout'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { SupplyChainGenerator } from '../data/supplyChainGenerator'
import { GraphUtils } from '../utils/graphUtils'
import { SupplyChainGraph as SupplyChainGraphType, NodeType } from '../types/supplyChain'
import GraphControls from './GraphControls'

interface SigmaGraphProps {
  nodeCount?: number
  enablePhysics?: boolean
}

const SigmaGraph: React.FC<SigmaGraphProps> = ({ 
  nodeCount = 50, 
  enablePhysics = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const [graphData, setGraphData] = useState<SupplyChainGraphType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<NodeType[]>(Object.values(NodeType))
  const [selectedTiers, setSelectedTiers] = useState<number[]>([1, 2, 3, 4, 5])
  const [currentDataset, setCurrentDataset] = useState<string | undefined>(undefined)

  const initializeSigma = useCallback((data: SupplyChainGraphType) => {
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

    // Create a graphology graph
    const graph = GraphUtils.createGraphologyGraph(data)
    
    // Apply circular layout initially
    circular.assign(graph)
    
    // Create Sigma instance
    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultNodeColor: '#69b3a2',
      defaultEdgeColor: '#ccc',
      nodeProgramClasses: {},
      edgeProgramClasses: {}
    })
    
    console.log('Sigma instance created successfully')
    
    // Store references
    sigmaRef.current = sigma
    graphRef.current = graph
    
    // Apply force layout if physics enabled
    if (enablePhysics) {
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
      console.log('Clicked node:', event.node)
    })
    
  }, [enablePhysics])

  const generateGraph = useCallback(async () => {
    setIsLoading(true)
    
    try {
      console.log('Generating graph with', nodeCount, 'nodes')
      const rawGraph = SupplyChainGenerator.generateGraph(nodeCount, 'Electronics', 'Global')
      
      let filteredGraph = GraphUtils.filterGraphByNodeType(rawGraph, selectedNodeTypes)
      filteredGraph = GraphUtils.filterGraphByTier(filteredGraph, selectedTiers)
      
      setGraphData(filteredGraph)
      setCurrentDataset(undefined) // Clear current dataset when generating new graph
      initializeSigma(filteredGraph)
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error generating graph:', error)
      setIsLoading(false)
    }
  }, [nodeCount, selectedNodeTypes, selectedTiers, initializeSigma])

  const handleLoadSampleData = useCallback(async (filename: string) => {
    setIsLoading(true)
    
    try {
      console.log('Loading sample data:', filename)
      const rawGraph = await SupplyChainGenerator.loadSampleData(filename)
      
      let filteredGraph = GraphUtils.filterGraphByNodeType(rawGraph, selectedNodeTypes)
      filteredGraph = GraphUtils.filterGraphByTier(filteredGraph, selectedTiers)
      
      setGraphData(filteredGraph)
      setCurrentDataset(filename)
      initializeSigma(filteredGraph)
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading sample data:', error)
      setIsLoading(false)
    }
  }, [selectedNodeTypes, selectedTiers, initializeSigma])

  const handleFilterChange = useCallback(async (nodeTypes: NodeType[], tiers: number[]) => {
    setSelectedNodeTypes(nodeTypes)
    setSelectedTiers(tiers)
    
    if (graphData) {
      let filteredGraph = GraphUtils.filterGraphByNodeType(graphData, nodeTypes)
      filteredGraph = GraphUtils.filterGraphByTier(filteredGraph, tiers)
      
      initializeSigma(filteredGraph)
    }
  }, [graphData, initializeSigma])

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

  useEffect(() => {
    generateGraph()
    
    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill()
      }
    }
  }, [generateGraph])

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

  return (
    <div className="w-full h-full flex">
      <GraphControls
        isLoading={isLoading}
        nodeCount={graphData?.metadata.totalNodes || 0}
        edgeCount={graphData?.metadata.totalEdges || 0}
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
        />
      </div>
    </div>
  )
}

export default SigmaGraph