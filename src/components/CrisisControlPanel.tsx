import React, { useMemo } from 'react'
import { useSelectionStore } from '../store/selectionStore'

interface CrisisControlPanelProps {
  className?: string
}

const CrisisControlPanel: React.FC<CrisisControlPanelProps> = ({ className = '' }) => {
  const {
    crisis,
    graphData,
    enableCrisisMode,
    disableCrisisMode,
    toggleCrisisMode,
    setCrisisSource,
    getCrisisImpactStats,
    toggleCrisisLegend
  } = useSelectionStore()

  // Find available crisis sources (raw materials)
  const availableCrisisSources = useMemo(() => {
    if (!graphData) return []
    
    return graphData.nodes
      .filter(node => node.type === 'raw_materials')
      .map(node => ({
        id: node.id,
        label: node.label || node.id,
        material: node.material || 'unknown',
        origin: (node as any).origin || 'Unknown Location'
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [graphData])

  // Get lithium sources specifically
  const lithiumSources = useMemo(() => {
    return availableCrisisSources.filter(source => 
      source.label.toLowerCase().includes('lithium') ||
      source.material.toLowerCase().includes('lithium')
    )
  }, [availableCrisisSources])

  const impactStats = getCrisisImpactStats()

  const handleQuickLithiumCrisis = () => {
    if (lithiumSources.length > 0) {
      enableCrisisMode(lithiumSources[0].id, 'lithium_shortage')
    }
  }

  const handleSourceChange = (sourceId: string) => {
    const source = availableCrisisSources.find(s => s.id === sourceId)
    if (source) {
      const crisisType = source.material.includes('lithium') ? 'lithium_shortage' : 'material_shortage'
      setCrisisSource(sourceId, crisisType)
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
          <span>⚠️</span>
          <span>Crisis Simulation</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Simulate supply chain disruptions and analyze impact
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Crisis Mode Toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Crisis Mode</span>
            <button
              onClick={toggleCrisisMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                crisis.crisisMode ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  crisis.crisisMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {!crisis.crisisMode && lithiumSources.length > 0 && (
            <button
              onClick={handleQuickLithiumCrisis}
              className="w-full px-3 py-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 transition-colors"
            >
              🔋 Simulate Lithium Crisis
            </button>
          )}
        </div>

        {/* Crisis Source Selection */}
        {crisis.crisisMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crisis Source
            </label>
            <select
              value={crisis.crisisSource || ''}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select material...</option>
              {availableCrisisSources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.label} ({source.origin})
                </option>
              ))}
            </select>
            
            {crisis.crisisSource && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">Type:</span> {crisis.crisisType.replace('_', ' ')}
              </div>
            )}
          </div>
        )}

        {/* Impact Statistics */}
        {crisis.crisisMode && impactStats.affectedNodes > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-2">Impact Analysis</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-red-600 font-medium">Affected Nodes</span>
                <div className="text-red-800 font-semibold">{impactStats.affectedNodes}</div>
              </div>
              <div>
                <span className="text-red-600 font-medium">Critical Paths</span>
                <div className="text-red-800 font-semibold">{impactStats.criticalPaths}</div>
              </div>
              <div className="col-span-2">
                <span className="text-red-600 font-medium">Total Impact Score</span>
                <div className="text-red-800 font-semibold">{impactStats.totalImpact.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Crisis Legend */}
        {crisis.crisisMode && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Color Legend</span>
              <button
                onClick={toggleCrisisLegend}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {crisis.showCrisisLegend ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {crisis.showCrisisLegend && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Crisis Affected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Normal Operations</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Crisis Actions */}
        {crisis.crisisMode && (
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={disableCrisisMode}
              className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Reset to Normal Operations
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
          <div className="font-medium mb-1">💡 How to use:</div>
          <ul className="space-y-1 text-gray-600">
            <li>• Toggle crisis mode to simulate disruptions</li>
            <li>• Select a raw material as the crisis source</li>
            <li>• Red nodes show affected supply chain</li>
            <li>• Green nodes continue normal operations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CrisisControlPanel