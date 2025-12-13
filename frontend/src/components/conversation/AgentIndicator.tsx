/**
 * AgentIndicator Component (Week 6 - UI Redesign)
 *
 * Displays active agents with status indicators.
 * Shows which agents are active, thinking, or idle.
 */

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'thinking' | 'idle';
}

export interface AgentIndicatorProps {
  /**
   * List of active agents
   */
  agents: Agent[];

  /**
   * Current agent that is responding
   */
  currentAgent?: string;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * AgentIndicator - Shows active agents with status
 *
 * @example
 * ```tsx
 * <AgentIndicator
 *   agents={[
 *     { id: '1', name: 'Portfolio Architect', type: 'portfolio', status: 'active' },
 *     { id: '2', name: 'Tax Strategist', type: 'tax', status: 'thinking' }
 *   ]}
 *   currentAgent="Portfolio Architect"
 * />
 * ```
 */
export function AgentIndicator({
  agents,
  currentAgent,
  className = '',
}: AgentIndicatorProps) {
  if (agents.length === 0) {
    return null;
  }

  const getAgentShortName = (name: string) => {
    // Convert "Portfolio Architect" to "PORT"
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 4);
  };

  const getStatusColor = (status: Agent['status'], isCurrentAgent: boolean) => {
    if (isCurrentAgent && status === 'active') {
      return 'bg-green-500';
    }
    switch (status) {
      case 'active':
        return 'bg-blue-500';
      case 'thinking':
        return 'bg-yellow-500';
      case 'idle':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'thinking':
        return 'Thinking';
      case 'idle':
        return 'Idle';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Active Agents ({agents.filter((a) => a.status !== 'idle').length})
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {agents.map((agent) => {
          const isCurrentAgent = agent.name === currentAgent;

          return (
            <div
              key={agent.id}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border
                ${
                  isCurrentAgent
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                }
                transition-colors
              `}
            >
              {/* Status Indicator */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                  {getAgentShortName(agent.name)}
                </div>
                {/* Status Dot */}
                <div
                  className={`
                    absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
                    ${getStatusColor(agent.status, isCurrentAgent)}
                  `}
                  title={getStatusLabel(agent.status)}
                />
              </div>

              {/* Agent Name & Status */}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-900">
                  {agent.name}
                </span>
                {agent.status === 'thinking' && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                    Thinking...
                  </span>
                )}
                {isCurrentAgent && agent.status === 'active' && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                    Responding
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentIndicator;
