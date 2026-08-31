import { Entity, Relationship } from "@/data/types";

// Adjacency list representation
type Graph = Record<string, Set<string>>;

export function buildGraph(relationships: Relationship[]): Graph {
  const graph: Graph = {};
  relationships.forEach(rel => {
    if (!graph[rel.sourceId]) graph[rel.sourceId] = new Set();
    if (!graph[rel.targetId]) graph[rel.targetId] = new Set();
    
    // Treat as undirected for centrality
    graph[rel.sourceId].add(rel.targetId);
    graph[rel.targetId].add(rel.sourceId);
  });
  return graph;
}

// Calculate Degree Centrality
export function calculateDegreeCentrality(graph: Graph): Record<string, number> {
  const centrality: Record<string, number> = {};
  for (const node in graph) {
    centrality[node] = graph[node].size;
  }
  return centrality;
}

// Power Iteration for Eigenvector Centrality
export function calculateEigenvectorCentrality(graph: Graph, maxIterations = 100, tolerance = 1e-6): Record<string, number> {
  const nodes = Object.keys(graph);
  let centrality: Record<string, number> = {};
  
  // Initialize with 1
  nodes.forEach(node => {
    centrality[node] = 1;
  });

  for (let i = 0; i < maxIterations; i++) {
    const nextCentrality: Record<string, number> = {};
    let sumSquares = 0;

    nodes.forEach(node => {
      let sum = 0;
      graph[node].forEach(neighbor => {
        sum += centrality[neighbor];
      });
      nextCentrality[node] = sum;
      sumSquares += sum * sum;
    });

    const norm = Math.sqrt(sumSquares) || 1;
    let maxDiff = 0;

    nodes.forEach(node => {
      nextCentrality[node] /= norm;
      maxDiff = Math.max(maxDiff, Math.abs(nextCentrality[node] - centrality[node]));
    });

    centrality = nextCentrality;
    if (maxDiff < tolerance) break;
  }

  return centrality;
}

// Jaccard Similarity between two nodes
export function calculateJaccardSimilarity(graph: Graph, nodeA: string, nodeB: string): number {
  const neighborsA = graph[nodeA] || new Set();
  const neighborsB = graph[nodeB] || new Set();
  
  let intersectionSize = 0;
  neighborsA.forEach(n => {
    if (neighborsB.has(n)) intersectionSize++;
  });
  
  const unionSize = neighborsA.size + neighborsB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
