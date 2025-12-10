/**
 * MessageList Component
 *
 * Displays chat messages with differentiation between user, assistant, and agent responses.
 */

import { type MessageEvent, type AgentProgressEvent } from '../../services/streaming';

interface MessageListProps {
  messages: MessageEvent[];
  agentUpdates: AgentProgressEvent[];
  isStreaming: boolean;
}

export function MessageList({ messages, agentUpdates, isStreaming }: MessageListProps) {
  // Combine and sort messages and agent updates by timestamp
  const allItems = [
    ...messages.map(m => ({ ...m, type: 'message' as const })),
    ...agentUpdates.map(u => ({ ...u, type: 'agent' as const }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (allItems.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Your Financial Planning Journey
          </h3>
          <p className="text-gray-600 mb-4">
            Ask me about retirement planning, goal setting, portfolio optimization, or tax strategies.
          </p>
          <div className="text-left bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-medium mb-2">Try asking:</p>
            <ul className="space-y-1">
              <li>• "I want to retire at 60 with $80,000 per year"</li>
              <li>• "Help me save for my child's college education"</li>
              <li>• "Optimize my portfolio with 70/30 stocks/bonds"</li>
              <li>• "What are my chances of reaching my retirement goal?"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allItems.map((item, index) => {
        if (item.type === 'message') {
          const message = item as MessageEvent & { type: 'message' };
          return (
            <MessageBubble
              key={`msg-${index}-${message.timestamp}`}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          );
        } else {
          const update = item as AgentProgressEvent & { type: 'agent' };
          return (
            <AgentUpdateCard
              key={`agent-${index}-${update.timestamp}`}
              agentName={update.agent_name}
              response={update.response}
              timestamp={update.timestamp}
            />
          );
        }
      })}

      {isStreaming && (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">Analyzing...</span>
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  role: string;
  content: string;
  timestamp: string;
}

function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-600' : 'bg-gray-200'
          }`}>
            {isUser ? (
              <span className="text-white text-sm font-medium">You</span>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1">
            <div className={`rounded-lg px-4 py-3 ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1 px-1">
              {new Date(timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AgentUpdateCardProps {
  agentName: string;
  response: string;
  timestamp: string;
}

function AgentUpdateCard({ agentName, response, timestamp }: AgentUpdateCardProps) {
  const agentColors: Record<string, string> = {
    'Goal Planner': 'bg-green-50 border-green-200 text-green-800',
    'Portfolio Architect': 'bg-purple-50 border-purple-200 text-purple-800',
    'Monte Carlo Simulator': 'bg-orange-50 border-orange-200 text-orange-800',
    'Risk Manager': 'bg-red-50 border-red-200 text-red-800',
    'Tax Strategist': 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const colorClass = agentColors[agentName] || 'bg-gray-50 border-gray-200 text-gray-800';

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl w-full">
        <div className={`border rounded-lg p-4 ${colorClass}`}>
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">{agentName}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{response}</p>
          <p className="text-xs opacity-75 mt-2">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
