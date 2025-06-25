export class PerformanceUtils {
  static async chunkedProcessing<T, R>(
    items: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number = 1000,
    onProgress?: (progress: number) => void
  ): Promise<R[]> {
    const results: R[] = []
    const totalChunks = Math.ceil(items.length / chunkSize)

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      const chunkResults = await processor(chunk)
      results.push(...chunkResults)

      if (onProgress) {
        const progress = Math.min(100, ((i / chunkSize + 1) / totalChunks) * 100)
        onProgress(progress)
      }

      await this.nextFrame()
    }

    return results
  }

  static nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()))
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = window.setTimeout(() => func(...args), wait)
    }
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= wait) {
        lastCall = now
        func(...args)
      }
    }
  }

  static measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  }

  static async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  }

  static getNodeCountByZoomLevel(totalNodes: number, zoomLevel: number): number {
    if (zoomLevel >= 1.0) return totalNodes
    if (zoomLevel >= 0.5) return Math.floor(totalNodes * 0.8)
    if (zoomLevel >= 0.2) return Math.floor(totalNodes * 0.5)
    if (zoomLevel >= 0.1) return Math.floor(totalNodes * 0.2)
    return Math.floor(totalNodes * 0.1)
  }

  static getEdgeCountByZoomLevel(totalEdges: number, zoomLevel: number): number {
    if (zoomLevel >= 1.0) return totalEdges
    if (zoomLevel >= 0.5) return Math.floor(totalEdges * 0.6)
    if (zoomLevel >= 0.2) return Math.floor(totalEdges * 0.3)
    if (zoomLevel >= 0.1) return Math.floor(totalEdges * 0.1)
    return Math.floor(totalEdges * 0.05)
  }

  static sampleNodes<T>(nodes: T[], count: number): T[] {
    if (nodes.length <= count) return nodes
    
    const step = nodes.length / count
    const sampled: T[] = []
    
    for (let i = 0; i < count; i++) {
      const index = Math.floor(i * step)
      sampled.push(nodes[index])
    }
    
    return sampled
  }

  static sampleEdges<T extends { source: string; target: string }>(
    edges: T[], 
    nodes: { id: string }[], 
    count: number
  ): T[] {
    if (edges.length <= count) return edges
    
    const nodeIdSet = new Set(nodes.map(n => n.id))
    const validEdges = edges.filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
    
    if (validEdges.length <= count) return validEdges
    
    const step = validEdges.length / count
    const sampled: T[] = []
    
    for (let i = 0; i < count; i++) {
      const index = Math.floor(i * step)
      sampled.push(validEdges[index])
    }
    
    return sampled
  }
}