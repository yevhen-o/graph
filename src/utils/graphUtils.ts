import Graph from "graphology";
import {
  SupplyChainGraph,
  SupplyChainNode,
  NodeType,
  EdgeType,
} from "../types/supplyChain";

export type ColorMode = 'nodeType' | 'riskScore' | 'crisis';

export interface CosmosNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  tier?: number;
}

export interface CosmosEdge {
  source: string;
  target: string;
  weight?: number;
  color?: string;
}

export interface CosmosGraphData {
  nodes: CosmosNode[];
  links: CosmosEdge[];
}

export class GraphUtils {
  static convertToCosmosFormat(
    graph: SupplyChainGraph, 
    colorMode: ColorMode = 'nodeType',
    affectedNodes?: Set<string>
  ): CosmosGraphData {
    // Note: nodeColorScale removed as it's not used in crisis mode

    const nodes: CosmosNode[] = graph.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      x: node.x,
      y: node.y,
      color: this.getNodeColor(node, colorMode, affectedNodes),
      size: this.getNodeSize(node),
      tier: node.tier,
    }));

    const links: CosmosEdge[] = graph.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      color: this.getEdgeColor(edge.type),
    }));

    return { nodes, links };
  }

  static createGraphologyGraph(
    graph: SupplyChainGraph,
    useStaticLayout: boolean = true,
    colorMode: ColorMode = 'nodeType',
    affectedNodes?: Set<string>
  ): Graph {
    const g = new Graph({ type: "directed", multi: false });

    graph.nodes.forEach((node) => {
      const nodeColor = this.getNodeColor(node, colorMode, affectedNodes);
      
      const nodeSize = this.getNodeSize(node);
      const nodeAttributes: any = {
        label: node.label,
        // Remove 'type' attribute that causes Sigma issues, store as nodeType instead
        nodeType: node.type,
        tier: node.tier,
        // Use pre-calculated positions if available and static layout is enabled
        x:
          useStaticLayout && node.x !== undefined
            ? node.x
            : Math.random() * 1000,
        y:
          useStaticLayout && node.y !== undefined
            ? node.y
            : Math.random() * 1000,
      };
      
      // Add size and color explicitly
      nodeAttributes.size = nodeSize;
      nodeAttributes.color = nodeColor;
      
      g.addNode(node.id, nodeAttributes);
    });

    // Track added edges to prevent duplicates
    const addedEdges = new Set<string>();

    graph.edges.forEach((edge) => {
      if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
        // Create a unique key for this edge (considering direction)
        const edgeKey = `${edge.source}->${edge.target}`;

        // Only add if this edge doesn't already exist
        if (!addedEdges.has(edgeKey) && !g.hasEdge(edge.source, edge.target)) {
          try {
            g.addEdge(edge.source, edge.target, {
              weight: edge.weight,
              // Store edge type as edgeType to avoid conflicts
              edgeType: edge.type,
              color: this.getEdgeColor(edge.type),
            });
            addedEdges.add(edgeKey);
          } catch (error) {
            // Skip duplicate edges silently
            console.warn(`Skipped duplicate edge: ${edgeKey}`);
          }
        }
      }
    });

    return g;
  }

  private static getNodeSize(node: SupplyChainNode): number {
    // If node has a numeric size (pre-calculated), use it directly
    if (typeof node.size === 'number') {
      return node.size;
    }
    
    // Fallback to original logic for string-based sizes
    const baseSize = 5;
    const sizeMultiplier = {
      small: 1,
      medium: 1.5,
      large: 2.5,
    };

    const tierMultiplier = {
      1: 0.8,
      2: 1.2,
      3: 1.0,
      4: 0.9,
      5: 0.7,
    };

    return (
      baseSize *
      sizeMultiplier[node.size || "medium"] *
      (tierMultiplier[node.tier as keyof typeof tierMultiplier] || 1)
    );
  }

  private static getNodeColor(
    node: SupplyChainNode | NodeType, 
    colorMode: ColorMode = 'nodeType', 
    affectedNodes?: Set<string>
  ): string {
    // Handle legacy calls with just NodeType
    if (typeof node === 'string') {
      return this.getNodeTypeColor(node)
    }

    // Crisis mode takes priority
    if (colorMode === 'crisis' && affectedNodes) {
      return this.getCrisisNodeColor(node, affectedNodes)
    }

    // Risk score mode
    if (colorMode === 'riskScore') {
      return this.getRiskScoreColor(node)
    }

    // Default to node type colors
    return this.getNodeTypeColor(node.type)
  }

  private static getNodeTypeColor(type: NodeType): string {
    const colors = {
      [NodeType.RAW_MATERIALS]: "#8b4513",
      [NodeType.SUPPLIER]: "#ff6b6b",
      [NodeType.MANUFACTURER]: "#4ecdc4",
      [NodeType.DISTRIBUTOR]: "#45b7d1",
      [NodeType.RETAILER]: "#96ceb4",
      [NodeType.WAREHOUSE]: "#feca57",
      [NodeType.CUSTOMER]: "#a29bfe",
    };
    return colors[type] || "#95a5a6";
  }

  private static getCrisisNodeColor(node: SupplyChainNode, affectedNodes: Set<string>): string {
    if (affectedNodes.has(node.id)) {
      // Red for crisis-affected nodes
      return "#e74c3c"  // Crisis red
    } else {
      // Green for normal operations
      return "#27ae60"  // Normal green
    }
  }

  private static getRiskScoreColor(node: SupplyChainNode): string {
    const riskScore = node.riskScore || 0;
    
    // Clamp risk score between 0 and 1
    const normalizedRisk = Math.max(0, Math.min(1, riskScore));
    
    // Create gradient from green (low risk) to red (high risk)
    // Green to Yellow to Red gradient
    let r, g, b;
    
    if (normalizedRisk < 0.5) {
      // Green to Yellow (0 to 0.5)
      const ratio = normalizedRisk * 2;
      r = Math.round(255 * ratio);
      g = 255;
      b = 0;
    } else {
      // Yellow to Red (0.5 to 1)
      const ratio = (normalizedRisk - 0.5) * 2;
      r = 255;
      g = Math.round(255 * (1 - ratio));
      b = 0;
    }
    
    // Convert to hex
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private static getEdgeColor(type: EdgeType): string {
    const colors = {
      [EdgeType.MATERIAL_FLOW]: "#2ecc71",
      [EdgeType.INFORMATION_FLOW]: "#3498db",
      [EdgeType.FINANCIAL_FLOW]: "#f39c12",
      [EdgeType.TRANSPORTATION]: "#9b59b6",
    };
    return colors[type] || "#95a5a6";
  }

  static calculateGraphMetrics(graph: Graph) {
    const metrics = {
      nodeCount: graph.order,
      edgeCount: graph.size,
      density: graph.size / (graph.order * (graph.order - 1)),
      averageDegree: (2 * graph.size) / graph.order,
      components: 0,
    };

    return metrics;
  }

  static filterGraphByTier(
    graph: SupplyChainGraph,
    tiers: number[]
  ): SupplyChainGraph {
    const filteredNodes = graph.nodes.filter((node) =>
      tiers.includes(node.tier)
    );
    const nodeIds = new Set(filteredNodes.map((node) => node.id));
    const filteredEdges = graph.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        ...graph.metadata,
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length,
      },
    };
  }

  static filterGraphByNodeType(
    graph: SupplyChainGraph,
    nodeTypes: NodeType[]
  ): SupplyChainGraph {
    const filteredNodes = graph.nodes.filter((node) =>
      nodeTypes.includes(node.type)
    );
    const nodeIds = new Set(filteredNodes.map((node) => node.id));
    const filteredEdges = graph.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        ...graph.metadata,
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length,
      },
    };
  }

  static formatNumber(num: number): string {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B";
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  }
}
