import React from 'react'
import { SupplyChainEdge, EdgeType } from '../types/supplyChain'

interface EdgeDetailCardProps {
  edge: SupplyChainEdge
  onRemove: () => void
}

const EdgeDetailCard: React.FC<EdgeDetailCardProps> = ({ edge, onRemove }) => {
  const getEdgeTypeColor = (type: EdgeType): string => {
    const colors = {
      [EdgeType.MATERIAL_FLOW]: 'bg-green-100 text-green-800',
      [EdgeType.INFORMATION_FLOW]: 'bg-blue-100 text-blue-800',
      [EdgeType.FINANCIAL_FLOW]: 'bg-orange-100 text-orange-800',
      [EdgeType.TRANSPORTATION]: 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getEdgeTypeLabel = (type: EdgeType): string => {
    const labels = {
      [EdgeType.MATERIAL_FLOW]: 'Material Flow',
      [EdgeType.INFORMATION_FLOW]: 'Information Flow',
      [EdgeType.FINANCIAL_FLOW]: 'Financial Flow',
      [EdgeType.TRANSPORTATION]: 'Transportation'
    }
    return labels[type] || type
  }

  const getEdgeTypeIcon = (type: EdgeType): string => {
    const icons = {
      [EdgeType.MATERIAL_FLOW]: '📦',
      [EdgeType.INFORMATION_FLOW]: '📊',
      [EdgeType.FINANCIAL_FLOW]: '💰',
      [EdgeType.TRANSPORTATION]: '🚛'
    }
    return icons[type] || '🔗'
  }

  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) return 'N/A'
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(2)
    }
    return String(value)
  }

  const getWeightLevel = (weight: number): { label: string, color: string } => {
    if (weight < 30) return { label: 'Low', color: 'text-green-600' }
    if (weight < 70) return { label: 'Medium', color: 'text-yellow-600' }
    return { label: 'High', color: 'text-red-600' }
  }

  const weightInfo = getWeightLevel(edge.weight)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEdgeTypeColor(edge.type)}`}>
              {getEdgeTypeIcon(edge.type)} {getEdgeTypeLabel(edge.type)}
            </span>
          </div>
          {edge.label && (
            <h3 className="font-semibold text-gray-900 text-sm truncate mb-1" title={edge.label}>
              {edge.label}
            </h3>
          )}
          <p className="text-xs text-gray-500 font-mono">{edge.id}</p>
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

      {/* Connection Flow */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex-1">
            <div className="text-gray-500 text-xs">From</div>
            <div className="font-medium text-gray-900 truncate" title={edge.source}>
              {edge.source}
            </div>
          </div>
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">To</div>
            <div className="font-medium text-gray-900 truncate" title={edge.target}>
              {edge.target}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-gray-500 font-medium">Weight</dt>
          <dd className={`font-semibold ${weightInfo.color}`}>
            {formatValue(edge.weight)} ({weightInfo.label})
          </dd>
        </div>

        {edge.volume !== undefined && (
          <div>
            <dt className="text-gray-500 font-medium">Volume</dt>
            <dd className="text-gray-900">{formatValue(edge.volume)}</dd>
          </div>
        )}

        {edge.cost !== undefined && (
          <div>
            <dt className="text-gray-500 font-medium">Cost</dt>
            <dd className="text-gray-900">${formatValue(edge.cost)}</dd>
          </div>
        )}

        {edge.reliability !== undefined && (
          <div>
            <dt className="text-gray-500 font-medium">Reliability</dt>
            <dd className="text-gray-900">{formatValue(edge.reliability)}%</dd>
          </div>
        )}

        {edge.speed !== undefined && (
          <div>
            <dt className="text-gray-500 font-medium">Speed</dt>
            <dd className="text-gray-900">{formatValue(edge.speed)}</dd>
          </div>
        )}
      </div>
    </div>
  )
}

export default EdgeDetailCard