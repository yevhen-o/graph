import React from 'react'
import { SelectedItem } from '../types/selection'
import { SupplyChainNode, SupplyChainEdge } from '../types/supplyChain'
import NodeDetailCard from './NodeDetailCard'
import EdgeDetailCard from './EdgeDetailCard'

interface SelectionAccordionProps {
  items: SelectedItem[]
  activeItems: string[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

const SelectionAccordion: React.FC<SelectionAccordionProps> = ({
  items,
  activeItems,
  onToggle,
  onRemove
}) => {
  const getItemTitle = (item: SelectedItem): string => {
    if (item.type === 'node') {
      const node = item.data as SupplyChainNode
      return node.label || node.id
    } else {
      const edge = item.data as SupplyChainEdge
      return edge.label || `${edge.source} → ${edge.target}`
    }
  }

  const getItemSubtitle = (item: SelectedItem): string => {
    if (item.type === 'node') {
      const node = item.data as SupplyChainNode
      return `${node.type} (Tier ${node.tier})`
    } else {
      const edge = item.data as SupplyChainEdge
      return edge.type
    }
  }

  const getItemIcon = (item: SelectedItem): string => {
    if (item.type === 'node') {
      const node = item.data as SupplyChainNode
      const icons = {
        raw_materials: '🏗️',
        supplier: '🏭',
        manufacturer: '🏢',
        distributor: '📦',
        retailer: '🏪',
        warehouse: '🏬',
        customer: '👤'
      }
      return icons[node.type as keyof typeof icons] || '⚪'
    } else {
      return '🔗'
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
        </svg>
        <p className="text-sm font-medium">No items selected</p>
        <p className="text-xs mt-1">Click on nodes or edges to view details</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isActive = activeItems.includes(item.id)
        
        return (
          <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onToggle(item.id)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">{getItemIcon(item)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {getItemTitle(item)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {getItemSubtitle(item)}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {formatTimestamp(item.timestamp)}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(item.id)
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove from selection"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <svg 
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${isActive ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isActive && (
              <div className="p-4 bg-white border-t border-gray-200">
                {item.type === 'node' ? (
                  <NodeDetailCard 
                    node={item.data as SupplyChainNode} 
                    onRemove={() => onRemove(item.id)}
                  />
                ) : (
                  <EdgeDetailCard 
                    edge={item.data as SupplyChainEdge} 
                    onRemove={() => onRemove(item.id)}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SelectionAccordion