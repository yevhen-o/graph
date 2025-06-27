import React, { useState } from 'react'
import { NodeType } from '../types/supplyChain'
import { SupplyChainGenerator } from '../data/supplyChainGenerator'
import { GraphUtils, ColorMode } from '../utils/graphUtils'

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
  currentDataset,
  availableNodeTypes,
  availableTiers,
  colorMode = 'nodeType',
  onColorModeChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  
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
              </div>
            </div>
          )}

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