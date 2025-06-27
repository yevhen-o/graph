import SupplyChainGraph from './components/SupplyChainGraph'
import SigmaGraph from './components/SigmaGraph'
import DetailPanel from './components/DetailPanel'
import { useState } from 'react'

function App() {
  const [useCosmosGraph, setUseCosmosGraph] = useState(false)

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setUseCosmosGraph(!useCosmosGraph)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Switch to {useCosmosGraph ? 'Sigma.js' : 'Cosmos Graph'}
        </button>
      </div>
      
      {useCosmosGraph ? <SupplyChainGraph /> : <SigmaGraph />}
      
      <DetailPanel />
    </div>
  )
}

export default App