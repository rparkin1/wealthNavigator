/**
 * AgentProgress Component
 *
 * Displays current agent activity and progress during streaming.
 */

import { type AgentProgressEvent } from '../../services/streaming';

interface AgentProgressProps {
  currentAgent: string | null;
  agentUpdates: AgentProgressEvent[];
}

export function AgentProgress({ currentAgent, agentUpdates }: AgentProgressProps) {
  if (!currentAgent) return null;

  const agentIcons: Record<string, string> = {
    'orchestrator': '🎯',
    'Goal Planner': '📊',
    'Portfolio Architect': '🏗️',
    'Monte Carlo Simulator': '🎲',
    'Risk Manager': '🛡️',
    'Tax Strategist': '💰',
    'Budgeting Agent': '💵',
    'Retirement Planner': '🏖️',
    'Visualization Agent': '📈',
  };

  const icon = agentIcons[currentAgent] || '🤖';
  const latestUpdate = agentUpdates[agentUpdates.length - 1];

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {currentAgent}
              </p>
              {latestUpdate && (
                <p className="text-xs text-blue-700 mt-0.5">
                  {latestUpdate.response.substring(0, 60)}
                  {latestUpdate.response.length > 60 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active indicator */}
        <div className="flex items-center space-x-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <span className="text-xs font-medium text-blue-900">Active</span>
        </div>
      </div>

      {/* Agent team visualization */}
      <div className="mt-3 flex items-center space-x-2 overflow-x-auto">
        {Object.entries(agentIcons).map(([name, emoji]) => {
          const isActive = name === currentAgent;
          const hasUpdated = agentUpdates.some(u => u.agent_name === name);

          return (
            <div
              key={name}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white scale-110'
                  : hasUpdated
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-500'
              }`}
              title={name}
            >
              <span className="mr-1">{emoji}</span>
              <span className="hidden sm:inline">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
