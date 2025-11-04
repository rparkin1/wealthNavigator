/**
 * Goal Dependency Graph Component
 *
 * D3.js visualization of goal dependencies and relationships.
 * Displays goals as nodes and dependencies as directed edges.
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Goal } from '../../types/goal';
import type {
  GoalDependency,
  DependencyGraph,
  DependencyGraphNode,
  DependencyGraphLink,
} from '../../types/goalDependencies';

export interface GoalDependencyGraphProps {
  goals: Goal[];
  dependencies: GoalDependency[];
  onNodeClick?: (goalId: string) => void;
  onLinkClick?: (dependency: GoalDependency) => void;
  highlightedGoalId?: string;
  width?: number;
  height?: number;
}

export function GoalDependencyGraph({
  goals,
  dependencies,
  onNodeClick,
  onLinkClick,
  highlightedGoalId,
  width = 800,
  height = 600,
}: GoalDependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || goals.length === 0) return;

    // Build graph data structure
    const graph = buildGraph(goals, dependencies);

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Define arrow markers for different dependency types
    const defs = svg.append('defs');

    const markerTypes = [
      { id: 'arrow-sequential', color: '#3b82f6' },
      { id: 'arrow-conditional', color: '#f59e0b' },
      { id: 'arrow-blocking', color: '#ef4444' },
      { id: 'arrow-linked', color: '#8b5cf6' },
    ];

    markerTypes.forEach(({ id, color }) => {
      defs
        .append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    // Create force simulation
    const simulation = d3
      .forceSimulation<DependencyGraphNode>(graph.nodes)
      .force(
        'link',
        d3
          .forceLink<DependencyGraphNode, DependencyGraphLink>(graph.links)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    // Create links
    const link = g
      .append('g')
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('class', 'dependency-link')
      .attr('stroke', (d) => getDependencyColor(d.dependency.dependency_type))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', (d) => `url(#arrow-${d.dependency.dependency_type})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onLinkClick) onLinkClick(d.dependency);
      })
      .append('title')
      .text((d) => `${d.dependency.dependency_type}: ${d.dependency.description || ''}`);

    // Create nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .attr('class', 'dependency-node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.id);
        if (onNodeClick) onNodeClick(d.id);
      })
      .call(
        d3
          .drag<SVGGElement, DependencyGraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', 30)
      .attr('fill', (d) => getNodeColor(d.goal))
      .attr('stroke', (d) =>
        d.id === highlightedGoalId || d.id === selectedNode ? '#1f2937' : '#fff'
      )
      .attr('stroke-width', (d) =>
        d.id === highlightedGoalId || d.id === selectedNode ? 4 : 2
      );

    // Add goal category icons
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '20px')
      .text((d) => getGoalIcon(d.goal.category));

    // Add goal titles
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '45px')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#374151')
      .text((d) => truncateText(d.goal.title, 15));

    // Add dependency count badge
    node
      .filter((d) => d.dependencies.length > 0)
      .append('circle')
      .attr('cx', 20)
      .attr('cy', -20)
      .attr('r', 10)
      .attr('fill', '#ef4444')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node
      .filter((d) => d.dependencies.length > 0)
      .append('text')
      .attr('x', 20)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text((d) => d.dependencies.length);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as any).x)
        .attr('y1', (d) => (d.source as any).y)
        .attr('x2', (d) => (d.target as any).x)
        .attr('y2', (d) => (d.target as any).y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: DependencyGraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: DependencyGraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: DependencyGraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [goals, dependencies, highlightedGoalId, selectedNode, width, height]);

  if (goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No goals to display</p>
          <p className="text-gray-400 text-sm">Create some goals to see the dependency graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 border border-gray-200">
        <h4 className="font-semibold text-xs text-gray-700 mb-2">Dependency Types</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Sequential</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-0.5 bg-amber-500"></div>
            <span className="text-gray-600">Conditional</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-gray-600">Blocking</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-0.5 bg-purple-500"></div>
            <span className="text-gray-600">Linked</span>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 border border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Drag nodes to rearrange • Scroll to zoom • Click to select
        </p>
      </div>

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}

/**
 * Build graph data structure from goals and dependencies
 */
function buildGraph(
  goals: Goal[],
  dependencies: GoalDependency[]
): DependencyGraph {
  const nodes: DependencyGraphNode[] = goals.map((goal) => {
    const goalDeps = dependencies.filter((d) => d.target_goal_id === goal.id);
    const goalDependents = dependencies.filter((d) => d.source_goal_id === goal.id);

    return {
      id: goal.id,
      goal,
      dependencies: goalDeps,
      dependents: goalDependents,
      depth: calculateDepth(goal.id, dependencies, new Set()),
    };
  });

  const links: DependencyGraphLink[] = dependencies
    .filter(
      (dep) =>
        goals.some((g) => g.id === dep.source_goal_id) &&
        goals.some((g) => g.id === dep.target_goal_id)
    )
    .map((dep) => ({
      source: dep.source_goal_id,
      target: dep.target_goal_id,
      dependency: dep,
    }));

  const cycles = detectCycles(nodes, links);
  const critical_path = findCriticalPath(nodes, links);

  return { nodes, links, cycles, critical_path };
}

/**
 * Calculate depth level for node positioning
 */
function calculateDepth(
  goalId: string,
  dependencies: GoalDependency[],
  visited: Set<string>
): number {
  if (visited.has(goalId)) return 0;
  visited.add(goalId);

  const deps = dependencies.filter((d) => d.target_goal_id === goalId);
  if (deps.length === 0) return 0;

  return (
    1 +
    Math.max(
      ...deps.map((d) => calculateDepth(d.source_goal_id, dependencies, new Set(visited)))
    )
  );
}

/**
 * Detect cycles in dependency graph using DFS
 */
function detectCycles(
  nodes: DependencyGraphNode[],
  links: DependencyGraphLink[]
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  nodes.forEach((node) => adjacencyList.set(node.id, []));
  links.forEach((link) => {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
    const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
    adjacencyList.get(sourceId)?.push(targetId);
  });

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    currentPath.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - extract the cycle from currentPath
        const cycleStartIndex = currentPath.indexOf(neighbor);
        const cycle = currentPath.slice(cycleStartIndex);
        cycles.push([...cycle, neighbor]);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    currentPath.pop();
    return false;
  }

  // Try DFS from each unvisited node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return cycles;
}

/**
 * Find critical path (longest path through graph)
 */
function findCriticalPath(
  nodes: DependencyGraphNode[],
  links: DependencyGraphLink[]
): string[] {
  // Build adjacency list with reverse direction (targets -> sources)
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  links.forEach((link) => {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
    const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
    adjacencyList.get(sourceId)?.push(targetId);
    inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
  });

  // Find nodes with no incoming edges (starting points)
  const queue: string[] = [];
  const distance = new Map<string, number>();
  const previous = new Map<string, string | null>();

  nodes.forEach((node) => {
    distance.set(node.id, 0);
    previous.set(node.id, null);
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
    }
  });

  // Topological sort with longest path tracking
  let maxDistance = 0;
  let endNode: string | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDistance = distance.get(current) || 0;

    if (currentDistance > maxDistance) {
      maxDistance = currentDistance;
      endNode = current;
    }

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      const newDistance = currentDistance + 1;
      if (newDistance > (distance.get(neighbor) || 0)) {
        distance.set(neighbor, newDistance);
        previous.set(neighbor, current);
      }

      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Reconstruct path from endNode
  if (!endNode) return [];

  const path: string[] = [];
  let current: string | null = endNode;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  return path;
}

/**
 * Get color for dependency type
 */
function getDependencyColor(type: string): string {
  switch (type) {
    case 'sequential':
      return '#3b82f6'; // blue
    case 'conditional':
      return '#f59e0b'; // amber
    case 'blocking':
      return '#ef4444'; // red
    case 'linked':
      return '#8b5cf6'; // purple
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get color for goal node based on status/priority
 */
function getNodeColor(goal: Goal): string {
  if (goal.status === 'achieved') return '#10b981'; // green
  if (goal.status === 'at_risk') return '#ef4444'; // red
  if (goal.priority === 'essential') return '#3b82f6'; // blue
  if (goal.priority === 'important') return '#8b5cf6'; // purple
  return '#6b7280'; // gray
}

/**
 * Get icon for goal category
 */
function getGoalIcon(category: string): string {
  const icons: Record<string, string> = {
    retirement: '🏖️',
    education: '🎓',
    home: '🏠',
    major_expense: '💎',
    emergency: '💰',
    legacy: '🌳',
  };
  return icons[category] || '🎯';
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
