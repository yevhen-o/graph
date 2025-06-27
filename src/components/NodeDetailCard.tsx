import React, { useState, useCallback } from 'react'
import { SupplyChainNode, NodeType } from '../types/supplyChain'
import { useSelectionStore } from '../store/selectionStore'

interface NodeDetailCardProps {
  node: SupplyChainNode
  onRemove: () => void
}

const NodeDetailCard: React.FC<NodeDetailCardProps> = ({ node, onRemove }) => {
  const [isEditingRisk, setIsEditingRisk] = useState(false)
  const [tempRiskScore, setTempRiskScore] = useState(node.riskScore?.toString() || '0')
  const { updateNodeRiskScore } = useSelectionStore()
  const getNodeTypeColor = (type: NodeType): string => {
    const colors = {
      [NodeType.RAW_MATERIALS]: 'bg-amber-100 text-amber-800',
      [NodeType.SUPPLIER]: 'bg-red-100 text-red-800',
      [NodeType.MANUFACTURER]: 'bg-teal-100 text-teal-800',
      [NodeType.DISTRIBUTOR]: 'bg-blue-100 text-blue-800',
      [NodeType.RETAILER]: 'bg-green-100 text-green-800',
      [NodeType.WAREHOUSE]: 'bg-yellow-100 text-yellow-800',
      [NodeType.CUSTOMER]: 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getNodeTypeLabel = (type: NodeType): string => {
    const labels = {
      [NodeType.RAW_MATERIALS]: 'Raw Materials',
      [NodeType.SUPPLIER]: 'Supplier',
      [NodeType.MANUFACTURER]: 'Manufacturer',
      [NodeType.DISTRIBUTOR]: 'Distributor',
      [NodeType.RETAILER]: 'Retailer',
      [NodeType.WAREHOUSE]: 'Warehouse',
      [NodeType.CUSTOMER]: 'Customer'
    }
    return labels[type] || type
  }

  const getRiskLevel = (riskScore?: number): { label: string, color: string } => {
    if (riskScore === undefined) return { label: 'Unknown', color: 'text-gray-500' }
    
    if (riskScore < 0.3) return { label: 'Low Risk', color: 'text-green-600' }
    if (riskScore < 0.7) return { label: 'Medium Risk', color: 'text-yellow-600' }
    return { label: 'High Risk', color: 'text-red-600' }
  }

  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) return 'N/A'
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(2)
    }
    return String(value)
  }

  const riskInfo = getRiskLevel(node.riskScore)

  const handleStartEditing = useCallback(() => {
    setIsEditingRisk(true)
    setTempRiskScore(node.riskScore?.toString() || '0')
  }, [node.riskScore])

  const handleSaveRiskScore = useCallback(() => {
    const newRiskScore = parseFloat(tempRiskScore)
    if (!isNaN(newRiskScore) && newRiskScore >= 0 && newRiskScore <= 1) {
      updateNodeRiskScore(node.id, newRiskScore)
      setIsEditingRisk(false)
    } else {
      // Reset to original value if invalid
      setTempRiskScore(node.riskScore?.toString() || '0')
    }
  }, [tempRiskScore, node.id, node.riskScore, updateNodeRiskScore])

  const handleCancelEditing = useCallback(() => {
    setIsEditingRisk(false)
    setTempRiskScore(node.riskScore?.toString() || '0')
  }, [node.riskScore])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRiskScore()
    } else if (e.key === 'Escape') {
      handleCancelEditing()
    }
  }, [handleSaveRiskScore, handleCancelEditing])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNodeTypeColor(node.type)}`}>
              {getNodeTypeLabel(node.type)}
            </span>
            <span className="text-sm text-gray-500">Tier {node.tier}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm truncate" title={node.label}>
            {node.label}
          </h3>
          <p className="text-xs text-gray-500 font-mono">{node.id}</p>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Remove from selection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {node.riskScore !== undefined && (
          <div className="col-span-2">
            <dt className="text-gray-500 font-medium mb-1">Risk Score</dt>
            {isEditingRisk ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tempRiskScore}
                  onChange={(e) => setTempRiskScore(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00 - 1.00"
                  autoFocus
                />
                <button
                  onClick={handleSaveRiskScore}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Save"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCancelEditing}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Cancel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <dd className={`font-semibold ${riskInfo.color}`}>
                  {node.riskScore.toFixed(2)} ({riskInfo.label})
                </dd>
                <button
                  onClick={handleStartEditing}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit risk score"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {typeof node.size === 'number' && (
          <div>
            <dt className="text-gray-500 font-medium">Size</dt>
            <dd className="text-gray-900">{node.size}</dd>
          </div>
        )}

        {node.capacity !== undefined && (
          <div>
            <dt className="text-gray-500 font-medium">Capacity</dt>
            <dd className="text-gray-900">{formatValue(node.capacity)}</dd>
          </div>
        )}

        {node.leadTime !== undefined && (
          <div>
            <dt className="text-gray-500 font-medium">Lead Time</dt>
            <dd className="text-gray-900">{formatValue(node.leadTime)} days</dd>
          </div>
        )}

        {node.sustainability !== undefined && (
          <div>
            <dt className="text-gray-500 font-medium">Sustainability</dt>
            <dd className="text-gray-900">{formatValue(node.sustainability)}</dd>
          </div>
        )}

        {node.industry && (
          <div>
            <dt className="text-gray-500 font-medium">Industry</dt>
            <dd className="text-gray-900">{node.industry}</dd>
          </div>
        )}

        {node.established && (
          <div>
            <dt className="text-gray-500 font-medium">Established</dt>
            <dd className="text-gray-900">{node.established}</dd>
          </div>
        )}

        {node.location && (
          <div className="col-span-2">
            <dt className="text-gray-500 font-medium">Location</dt>
            <dd className="text-gray-900">
              {node.location.city}, {node.location.country}
              <span className="text-gray-500 ml-1">
                ({node.location.lat.toFixed(4)}, {node.location.lng.toFixed(4)})
              </span>
            </dd>
          </div>
        )}

        {(node.x !== undefined && node.y !== undefined) && (
          <div className="col-span-2">
            <dt className="text-gray-500 font-medium">Graph Position</dt>
            <dd className="text-gray-900 font-mono">
              x: {node.x.toFixed(1)}, y: {node.y.toFixed(1)}
            </dd>
          </div>
        )}
      </div>
    </div>
  )
}

export default NodeDetailCard