import React from 'react'
import { useSelectionStore } from '../store/selectionStore'
import SelectionAccordion from './SelectionAccordion'

const DetailPanel: React.FC = () => {
  const {
    selectedItems,
    isPanelOpen,
    activeAccordionItems,
    togglePanel,
    setPanelOpen,
    toggleAccordionItem,
    removeItem,
    clearAll,
    pathHighlight,
    findPathsBetweenSelected,
    clearPathHighlight
  } = useSelectionStore()

  const nodeCount = selectedItems.filter(item => item.type === 'node').length
  const edgeCount = selectedItems.filter(item => item.type === 'edge').length

  return (
    <>
      {/* Panel Toggle Button */}
      {!isPanelOpen && selectedItems.length > 0 && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={togglePanel}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
            title={`View ${selectedItems.length} selected item${selectedItems.length === 1 ? '' : 's'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{selectedItems.length}</span>
          </button>
        </div>
      )}

      {/* Main Panel */}
      {isPanelOpen && (
        <div className="fixed top-4 right-4 z-50 w-96 max-h-[calc(100vh-2rem)] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div>
              <h2 className="font-semibold text-gray-900">Selection Details</h2>
              <div className="text-sm text-gray-500 mt-1">
                {selectedItems.length === 0 ? (
                  'No items selected'
                ) : (
                  <>
                    {nodeCount > 0 && `${nodeCount} node${nodeCount === 1 ? '' : 's'}`}
                    {nodeCount > 0 && edgeCount > 0 && ', '}
                    {edgeCount > 0 && `${edgeCount} edge${edgeCount === 1 ? '' : 's'}`}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedItems.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Clear all selections"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Close panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Path Finding Controls */}
          {nodeCount === 2 && (
            <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {pathHighlight.isActive ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-900">Path Found</span>
                      </div>
                      <div className="text-xs text-blue-700 space-y-1">
                        <div className="font-semibold">Shortest Path (Golden):</div>
                        <div>• Distance: {pathHighlight.pathMetrics?.distance} hops</div>
                        <div>• Weight: {pathHighlight.pathMetrics?.totalWeight.toFixed(1)}</div>
                        <div>• Risk Score: {pathHighlight.pathMetrics?.riskScore.toFixed(2)}</div>
                        <div className="font-semibold mt-2">All Paths (Red):</div>
                        <div>• Total paths: {pathHighlight.paths.length}</div>
                        <div>• Total nodes: {pathHighlight.allPathNodes.size}</div>
                        <div>• Total edges: {pathHighlight.allPathEdges.size}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-900">Find Path Between Nodes</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {pathHighlight.isActive ? (
                    <button
                      onClick={clearPathHighlight}
                      className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                      title="Clear path highlighting"
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      onClick={findPathsBetweenSelected}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      title="Find shortest path between selected nodes"
                    >
                      Find Path
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <SelectionAccordion
              items={selectedItems}
              activeItems={activeAccordionItems}
              onToggle={toggleAccordionItem}
              onRemove={removeItem}
            />
          </div>

          {/* Footer */}
          {selectedItems.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between text-xs text-gray-500">
                {pathHighlight.isActive ? (
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span>Golden = Shortest path</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Red = All {pathHighlight.paths.length} possible paths</span>
                    </span>
                  </div>
                ) : (
                  <span>Click items to expand details</span>
                )}
                <span>Max: {useSelectionStore.getState().maxSelections} items</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay for mobile */}
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}

export default DetailPanel