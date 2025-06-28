import React, { useState } from 'react'
import { NodeType, SupplyChainGraph } from '../types/supplyChain'
import { SupplyChainGenerator } from '../data/supplyChainGenerator'
import { GraphUtils, ColorMode } from '../utils/graphUtils'
import CrisisControlPanel from './CrisisControlPanel'

interface GraphControlsProps {
  isLoading: boolean
  nodeCount: number
  edgeCount: number
  fullNodeCount?: number
  fullEdgeCount?: number
  currentZoom?: number
  renderProgress?: number
  performanceMode?: boolean
  onPerformanceModeToggle?: () => void
  selectedNodeTypes: NodeType[]
  selectedTiers: number[]
  onFilterChange: (nodeTypes: NodeType[], tiers: number[]) => void
  onRegenerateGraph: () => void
  onPhysicsToggle: () => void
  onZoomToFit: () => void
  onExportPNG: () => void
  physicsEnabled: boolean
  onLoadSampleData?: (filename: string) => void
  onLoadCustomData?: (data: SupplyChainGraph) => void
  currentDataset?: string
  availableNodeTypes?: NodeType[]
  availableTiers?: number[]
  hasStaticLayout?: boolean
  onStaticLayoutToggle?: () => void
  useStaticLayout?: boolean
  colorMode?: ColorMode
  onColorModeChange?: (mode: ColorMode) => void
}

const GraphControls: React.FC<GraphControlsProps> = ({
  isLoading,
  nodeCount,
  edgeCount,
  fullNodeCount,
  fullEdgeCount,
  currentZoom,
  renderProgress,
  performanceMode,
  onPerformanceModeToggle,
  selectedNodeTypes,
  selectedTiers,
  onFilterChange,
  onRegenerateGraph,
  onPhysicsToggle,
  onZoomToFit,
  onExportPNG,
  physicsEnabled,
  onLoadSampleData,
  onLoadCustomData,
  currentDataset,
  availableNodeTypes,
  availableTiers,
  colorMode = 'nodeType',
  onColorModeChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  
  // Use available options or fallback to all options
  const allNodeTypes = availableNodeTypes || Object.values(NodeType)
  const allTiers = availableTiers || [0, 1, 2, 3, 4, 5]
  const hasActiveNodeFilter = selectedNodeTypes.length !== allNodeTypes.length
  const hasActiveTierFilter = selectedTiers.length !== allTiers.length
  const hasActiveFilters = hasActiveNodeFilter || hasActiveTierFilter

  const handleNodeTypeChange = (nodeType: NodeType) => {
    const newSelection = selectedNodeTypes.includes(nodeType)
      ? selectedNodeTypes.filter(type => type !== nodeType)
      : [...selectedNodeTypes, nodeType]
    
    onFilterChange(newSelection, selectedTiers)
  }

  const handleTierChange = (tier: number) => {
    const newSelection = selectedTiers.includes(tier)
      ? selectedTiers.filter(t => t !== tier)
      : [...selectedTiers, tier]
    
    onFilterChange(selectedNodeTypes, newSelection)
  }

  const handleSelectAllNodeTypes = () => {
    onFilterChange(allNodeTypes, selectedTiers)
  }

  const handleDeselectAllNodeTypes = () => {
    onFilterChange([], selectedTiers)
  }

  const handleSelectAllTiers = () => {
    onFilterChange(selectedNodeTypes, allTiers)
  }

  const handleDeselectAllTiers = () => {
    onFilterChange(selectedNodeTypes, [])
  }

  const handleClearAllFilters = () => {
    onFilterChange(allNodeTypes, allTiers)
  }

  const autoFixDataFormat = (data: any): any => {
    if (!data || !data.nodes) return data

    console.log('🔧 Auto-fixing data format issues...')
    
    // Fix nodes: add missing labels and other common issues
    const fixedNodes = data.nodes.map((node: any, index: number) => {
      const fixedNode = { ...node }
      
      // Auto-generate label if missing
      if (!fixedNode.label) {
        fixedNode.label = fixedNode.id || fixedNode.name || `Node ${index}`
        if (fixedNode.label !== fixedNode.id) {
          console.log(`🔧 Fixed node ${index}: added label "${fixedNode.label}"`)
        }
      }
      
      // Ensure tier is a number
      if (typeof fixedNode.tier === 'string') {
        fixedNode.tier = parseInt(fixedNode.tier, 10) || 0
      }
      
      return fixedNode
    })

    // Fix edges: ensure all required fields
    const fixedEdges = data.edges?.map((edge: any, index: number) => {
      const fixedEdge = { ...edge }
      
      // Auto-generate edge ID if missing
      if (!fixedEdge.id) {
        fixedEdge.id = `edge_${index}`
      }
      
      // Set default edge type if missing
      if (!fixedEdge.type) {
        fixedEdge.type = 'material_flow'
      }
      
      // Ensure weight is a number
      if (typeof fixedEdge.weight !== 'number') {
        fixedEdge.weight = 1.0
      }
      
      return fixedEdge
    }) || []

    const result = {
      ...data,
      nodes: fixedNodes,
      edges: fixedEdges
    }

    console.log(`🔧 Auto-fix complete: ${fixedNodes.length} nodes, ${fixedEdges.length} edges`)
    return result
  }

  const validateSupplyChainData = (data: any): { isValid: boolean; error?: string } => {
    console.log('Validating uploaded data structure:', {
      type: typeof data,
      keys: Object.keys(data || {}),
      nodesType: typeof data?.nodes,
      nodesLength: data?.nodes?.length,
      edgesType: typeof data?.edges,
      edgesLength: data?.edges?.length,
      metadataType: typeof data?.metadata,
      metadataKeys: Object.keys(data?.metadata || {})
    })

    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid JSON format' }
    }

    if (!data.nodes || !Array.isArray(data.nodes)) {
      return { isValid: false, error: `Missing or invalid "nodes" array. Found: ${typeof data.nodes}. Available keys: [${Object.keys(data).join(', ')}]` }
    }

    if (!data.edges || !Array.isArray(data.edges)) {
      return { isValid: false, error: `Missing or invalid "edges" array. Found: ${typeof data.edges}. Available keys: [${Object.keys(data).join(', ')}]` }
    }

    if (!data.metadata || typeof data.metadata !== 'object') {
      return { isValid: false, error: `Missing or invalid "metadata" object. Found: ${typeof data.metadata}. Available keys: [${Object.keys(data).join(', ')}]` }
    }

    // Validate first few nodes for required fields with detailed debugging
    for (let i = 0; i < Math.min(data.nodes.length, 3); i++) {
      const node = data.nodes[i]
      const nodeKeys = Object.keys(node || {})
      
      console.log(`Node ${i} structure:`, {
        keys: nodeKeys,
        id: node?.id,
        label: node?.label,
        type: node?.type,
        tier: node?.tier,
        tierType: typeof node?.tier
      })
      
      const missingFields = []
      if (!node.id) missingFields.push('id')
      if (!node.label) missingFields.push('label')
      if (!node.type) missingFields.push('type')
      if (typeof node.tier !== 'number') missingFields.push(`tier (found: ${typeof node.tier}, value: ${node.tier})`)
      
      if (missingFields.length > 0) {
        // Try to suggest field mapping if common alternatives exist
        const suggestions = []
        if (!node.id && (node.nodeId || node.node_id || node.name)) {
          suggestions.push(`Consider mapping ${node.nodeId ? 'nodeId' : node.node_id ? 'node_id' : 'name'} → id`)
        }
        if (!node.label && (node.name || node.title || node.description)) {
          suggestions.push(`Consider mapping ${node.name ? 'name' : node.title ? 'title' : 'description'} → label`)
        }
        if (!node.type && (node.category || node.class || node.nodeType)) {
          suggestions.push(`Consider mapping ${node.category ? 'category' : node.class ? 'class' : 'nodeType'} → type`)
        }
        if (typeof node.tier !== 'number' && (node.level || node.depth || node.layer)) {
          suggestions.push(`Consider mapping ${node.level ? 'level' : node.depth ? 'depth' : 'layer'} → tier`)
        }
        
        const suggestionText = suggestions.length > 0 ? ` Suggestions: ${suggestions.join(', ')}` : ''
        
        return { 
          isValid: false, 
          error: `Node ${i}: missing/invalid fields: [${missingFields.join(', ')}]. Available fields: [${nodeKeys.join(', ')}].${suggestionText}` 
        }
      }
    }

    // Validate first few edges for required fields
    for (let i = 0; i < Math.min(data.edges.length, 3); i++) {
      const edge = data.edges[i]
      if (!edge.id || !edge.source || !edge.target || !edge.type || typeof edge.weight !== 'number') {
        return { isValid: false, error: `Edge ${i}: missing required fields (id, source, target, type, weight)` }
      }
    }

    return { isValid: true }
  }

  const handleFileUpload = async (file: File) => {
    if (!onLoadCustomData) return

    setUploadStatus('uploading')
    setUploadError(null)

    // Set timeout for very large files to prevent browser hangs
    const timeoutId = setTimeout(() => {
      setUploadStatus('error')
      setUploadProgress('')
      setUploadError('File processing timed out. File may be too large or complex. Try a smaller dataset or contact support.')
    }, 5 * 60 * 1000) // 5 minute timeout

    try {
      // File size validation - now supports very large files
      const maxFileSize = 500 * 1024 * 1024 // 500MB limit
      if (file.size > maxFileSize) {
        setUploadStatus('error')
        setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 500MB. This is a browser memory limit.`)
        return
      }

      // Large file warning
      if (file.size > 50 * 1024 * 1024) { // 50MB warning
        setUploadError(`Very large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB). Processing may take several minutes and use significant memory. Continue?`)
        // Show the warning but allow processing
      }

      // Performance warning for large files
      if (file.size > 2 * 1024 * 1024) { // 2MB warning
        console.warn(`Large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB). This may impact performance.`)
      }

      // Use progressive reading for larger files with status updates
      let data: any
      setUploadProgress('Reading file...')
      
      if (file.size > 10 * 1024 * 1024) { // 10MB threshold for progressive reading
        console.log(`Processing large file: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
        const reader = new FileReader()
        
        data = await new Promise((resolve, reject) => {
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100)
              setUploadProgress(`Reading file... ${percentComplete}%`)
            }
          }
          
          reader.onload = (e) => {
            try {
              setUploadProgress('Parsing JSON...')
              const result = JSON.parse(e.target?.result as string)
              setUploadProgress('Processing data...')
              resolve(result)
            } catch (parseError) {
              reject(new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`))
            }
          }
          
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsText(file)
        })
      } else {
        const text = await file.text()
        setUploadProgress('Parsing JSON...')
        data = JSON.parse(text)
      }
      
      // Auto-fix common data format issues before validation
      const fixedData = autoFixDataFormat(data)
      
      const validation = validateSupplyChainData(fixedData)
      if (!validation.isValid) {
        setUploadStatus('error')
        setUploadError(validation.error || 'Invalid data format')
        return
      }

      // Performance warning and memory estimation for large datasets
      const nodeCount = fixedData.nodes?.length || 0
      const edgeCount = fixedData.edges?.length || 0
      const estimatedMemoryMB = Math.round((nodeCount * 0.5 + edgeCount * 0.2) / 1000) // Rough estimate
      
      if (nodeCount > 100000 || edgeCount > 500000) {
        console.warn(`MASSIVE dataset: ${nodeCount} nodes, ${edgeCount} edges. Estimated memory usage: ~${estimatedMemoryMB}MB`)
        setUploadError(`⚠️ MASSIVE dataset (${nodeCount.toLocaleString()} nodes, ${edgeCount.toLocaleString()} edges). Est. memory: ~${estimatedMemoryMB}MB. Browser may become unresponsive. Consider using a smaller subset for visualization.`)
      } else if (nodeCount > 10000 || edgeCount > 50000) {
        console.warn(`Very large dataset: ${nodeCount} nodes, ${edgeCount} edges. Estimated memory usage: ~${estimatedMemoryMB}MB`)
        setUploadError(`Very large dataset (${nodeCount.toLocaleString()} nodes, ${edgeCount.toLocaleString()} edges). Est. memory: ~${estimatedMemoryMB}MB. This may cause browser slowdown or crashes. Continue with caution.`)
      } else if (nodeCount > 1000 || edgeCount > 5000) {
        console.warn(`Large dataset detected: ${nodeCount} nodes, ${edgeCount} edges. Consider enabling performance mode.`)
        setUploadError(`Large dataset (${nodeCount.toLocaleString()} nodes, ${edgeCount.toLocaleString()} edges). Performance may be impacted. Consider enabling Performance Mode in controls.`)
      }
      
      // Log memory info if available
      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        console.log(`Memory before processing: Used: ${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB, Limit: ${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`)
      }

      console.log('✅ Validation passed, calling onLoadCustomData with:', fixedData.nodes.length, 'nodes')
      onLoadCustomData(fixedData)
      console.log('✅ onLoadCustomData called, setting success status')
      setUploadStatus('success')
      setUploadProgress('')
      clearTimeout(timeoutId)
      setTimeout(() => setUploadStatus('idle'), 3000)
    } catch (error) {
      setUploadStatus('error')
      setUploadProgress('')
      clearTimeout(timeoutId)
      setUploadError(error instanceof Error ? error.message : 'Failed to parse JSON file')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        handleFileUpload(file)
      } else {
        setUploadStatus('error')
        setUploadError('Please drop a valid JSON file (.json extension required)')
      }
    } else {
      setUploadStatus('error')
      setUploadError('No file detected. Please drop a JSON file.')
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const nodeTypeColors = {
    [NodeType.RAW_MATERIALS]: '#8b4513',
    [NodeType.SUPPLIER]: '#ff6b6b',
    [NodeType.MANUFACTURER]: '#4ecdc4',
    [NodeType.DISTRIBUTOR]: '#45b7d1',
    [NodeType.RETAILER]: '#96ceb4',
    [NodeType.WAREHOUSE]: '#feca57',
    [NodeType.CUSTOMER]: '#a29bfe'
  }

  const nodeTypeLabels = {
    [NodeType.RAW_MATERIALS]: 'Raw Materials',
    [NodeType.SUPPLIER]: 'Suppliers',
    [NodeType.MANUFACTURER]: 'Manufacturers',
    [NodeType.DISTRIBUTOR]: 'Distributors',
    [NodeType.RETAILER]: 'Retailers',
    [NodeType.WAREHOUSE]: 'Warehouses',
    [NodeType.CUSTOMER]: 'Customers'
  }

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 ${isExpanded ? 'w-80' : 'w-12'} flex flex-col border-r border-gray-700`}>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className={`${isExpanded ? 'block' : 'hidden'}`}>
          <h2 className="font-bold text-lg">Supply Chain Graph</h2>
          {hasActiveFilters && (
            <div className="text-xs text-orange-400 flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Filters active</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded hover:bg-gray-700 transition-colors relative"
          title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}
        >
          {hasActiveFilters && !isExpanded && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full"></div>
          )}
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto" data-testid="left-panel-content">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold mb-3">Graph Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Displayed Nodes:</span>
                <span className="font-mono">{nodeCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Displayed Edges:</span>
                <span className="font-mono">{edgeCount.toLocaleString()}</span>
              </div>
              {fullNodeCount && fullNodeCount !== nodeCount && (
                <>
                  <div className="flex justify-between text-gray-400">
                    <span>Total Nodes:</span>
                    <span className="font-mono">{fullNodeCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Total Edges:</span>
                    <span className="font-mono">{fullEdgeCount?.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Density:</span>
                <span className="font-mono">
                  {nodeCount > 0 ? ((edgeCount / (nodeCount * (nodeCount - 1))) * 100).toFixed(4) + '%' : '0%'}
                </span>
              </div>
              {currentZoom !== undefined && (
                <div className="flex justify-between">
                  <span>Zoom Level:</span>
                  <span className="font-mono">{(currentZoom * 100).toFixed(1)}%</span>
                </div>
              )}
              {renderProgress !== undefined && renderProgress < 100 && (
                <div className="flex justify-between">
                  <span>Render Progress:</span>
                  <span className="font-mono">{renderProgress.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-b border-gray-700" data-testid="controls-section">
            <h3 className="font-semibold mb-3">Controls</h3>
            <div className="space-y-3">
              <button
                onClick={onRegenerateGraph}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
              >
                {isLoading ? 'Generating...' : 'Regenerate Graph'}
              </button>
              
              <button
                onClick={onPhysicsToggle}
                className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                  physicsEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {physicsEnabled ? 'Pause Physics' : 'Start Physics'}
              </button>
              
              <button
                onClick={onZoomToFit}
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
              >
                Zoom to Fit
              </button>
              
              <button
                onClick={onExportPNG}
                className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 rounded text-sm font-medium transition-colors"
              >
                Export PNG
              </button>
              
              {onPerformanceModeToggle && (
                <button
                  onClick={onPerformanceModeToggle}
                  className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                    performanceMode 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {performanceMode ? 'Performance Mode: ON' : 'Performance Mode: OFF'}
                </button>
              )}
              
              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 rounded text-sm font-medium transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {onColorModeChange && (
            <div className="p-4 border-b border-gray-700" data-testid="color-mode-section">
              <h3 className="font-semibold mb-3">Color Mode</h3>
              <div className="space-y-3">
                <div className="flex space-x-2" data-testid="color-mode-buttons">
                  <button
                    onClick={() => onColorModeChange('nodeType')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      colorMode === 'nodeType' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    data-testid="color-mode-node-type"
                  >
                    Node Types
                  </button>
                  <button
                    onClick={() => onColorModeChange('riskScore')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      colorMode === 'riskScore' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    data-testid="color-mode-risk-score"
                  >
                    Risk Score
                  </button>
                  <button
                    onClick={() => onColorModeChange('crisis')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      colorMode === 'crisis' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    data-testid="color-mode-crisis"
                  >
                    Crisis Mode
                  </button>
                </div>
                
                {colorMode === 'riskScore' && (
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-300 mb-2">Risk Score Legend:</div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs">0.0 - Low Risk</span>
                    </div>
                    <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded mb-1"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs">1.0 - High Risk</span>
                    </div>
                  </div>
                )}
                
                {colorMode === 'nodeType' && (
                  <div className="text-xs text-gray-400">
                    <p>• Colors represent node types</p>
                    <p>• Each type has a distinct color</p>
                  </div>
                )}

                {colorMode === 'crisis' && (
                  <div className="bg-red-900 rounded p-3">
                    <div className="text-xs text-red-200 mb-2">Crisis Mode Active:</div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <span className="text-xs text-red-200">Crisis Affected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="text-xs text-red-200">Normal Operations</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Crisis Control Panel */}
          <div className="p-4 border-b border-gray-700">
            <CrisisControlPanel />
          </div>

          {onLoadSampleData && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold mb-3">Sample Datasets</h3>
              <div className="space-y-3">
                <select
                  onChange={(e) => {
                    if (e.target.value && e.target.value !== '') {
                      onLoadSampleData(e.target.value)
                    }
                  }}
                  disabled={isLoading}
                  value={currentDataset || ''}
                  className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:border-indigo-500 focus:outline-none disabled:bg-gray-600 disabled:text-gray-400"
                >
                  <option value="" disabled>
                    {isLoading ? 'Loading...' : currentDataset ? 'Switch dataset...' : 'Select a dataset...'}
                  </option>
                  {SupplyChainGenerator.SAMPLE_DATASETS.map((dataset) => (
                    <option
                      key={dataset.filename}
                      value={dataset.filename}
                      title={`${dataset.industry} supply chain with ${GraphUtils.formatNumber(dataset.nodeCount)} nodes`}
                    >
                      {dataset.name}
                    </option>
                  ))}
                </select>
                
                {isLoading && (
                  <div className="text-xs text-blue-400 bg-blue-900/20 rounded p-2 flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent"></div>
                    <p>Loading dataset...</p>
                  </div>
                )}
                
                {currentDataset && !isLoading && (
                  <div className="text-xs text-green-400 bg-green-900/20 rounded p-2">
                    <p>✅ Loaded: {SupplyChainGenerator.SAMPLE_DATASETS.find(d => d.filename === currentDataset)?.name || 'Custom dataset'}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  <p>• Pre-generated realistic datasets</p>
                  <p>• Industry-specific supply chains</p>
                  <p>• Instant loading for demonstrations</p>
                </div>
              </div>
            </div>
          )}

          {onLoadCustomData && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold mb-3">Custom Data</h3>
              <div className="space-y-3">
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-900/20' 
                      : uploadStatus === 'error'
                      ? 'border-red-400 bg-red-900/20'
                      : uploadStatus === 'success'
                      ? 'border-green-400 bg-green-900/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isLoading || uploadStatus === 'uploading'}
                  />
                  
                  <div className="text-center">
                    {uploadStatus === 'uploading' ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="animate-spin rounded-full h-4 w-4 border border-blue-400 border-t-transparent"></div>
                        <span className="text-sm text-blue-400">
                          {uploadProgress || 'Processing file...'}
                        </span>
                      </div>
                    ) : uploadStatus === 'success' ? (
                      <div className="text-green-400">
                        <div className="text-lg mb-1">✅</div>
                        <div className="text-sm">File loaded successfully!</div>
                      </div>
                    ) : (
                      <>
                        <div className="text-gray-400 mb-2">
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-300 mb-1">
                          Click to select or drag & drop JSON file
                        </div>
                        <div className="text-xs text-gray-500">
                          Supply chain data format required
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <div className="text-xs text-red-400 bg-red-900/20 rounded p-2">
                    <p>❌ {uploadError}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  <p>• Upload your own supply chain JSON files (max 500MB)</p>
                  <p>• Large files (&gt;50MB) may take several minutes to process</p>
                  <p>• Must include nodes, edges, and metadata</p>
                  <p>• Very large datasets may impact browser performance</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Node Types</h3>
                {hasActiveNodeFilter && (
                  <div className="text-xs text-orange-400">
                    {selectedNodeTypes.length}/{allNodeTypes.length} selected
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAllNodeTypes}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  All
                </button>
                <button
                  onClick={handleDeselectAllNodeTypes}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  None
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {allNodeTypes.map(nodeType => (
                <label key={nodeType} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedNodeTypes.includes(nodeType)}
                    onChange={() => handleNodeTypeChange(nodeType)}
                    className="rounded"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: nodeTypeColors[nodeType] }}
                  />
                  <span className="text-sm">{nodeTypeLabels[nodeType]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Supply Chain Tiers</h3>
                {hasActiveTierFilter && (
                  <div className="text-xs text-orange-400">
                    {selectedTiers.length}/{allTiers.length} selected
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAllTiers}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  All
                </button>
                <button
                  onClick={handleDeselectAllTiers}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  None
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {allTiers.map(tier => (
                <label key={tier} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(tier)}
                    onChange={() => handleTierChange(tier)}
                    className="rounded"
                  />
                  <span className="text-sm">Tier {tier} {tier === 0 ? '(Raw Materials)' : ''}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 space-y-1">
              <p>• GPU-accelerated with WebGL</p>
              <p>• Powered by Cosmos Graph</p>
              <p>• Level-of-detail rendering</p>
              <p>• Real-time force simulation</p>
              {performanceMode && (
                <p className="text-yellow-400">• Performance mode enabled</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GraphControls