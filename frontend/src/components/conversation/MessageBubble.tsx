/**
 * MessageBubble Component (Week 6 - UI Redesign)
 *
 * Redesigned message bubble with professional styling.
 * Supports user, agent, and system message types.
 */

export interface MessageBubbleProps {
  /**
   * Message role: user, agent, or system
   */
  role: 'user' | 'agent' | 'system';

  /**
   * Message content (supports markdown/rich text)
   */
  content: string;

  /**
   * Timestamp of the message
   */
  timestamp: string;

  /**
   * Agent name (for agent messages)
   */
  agentName?: string;

  /**
   * Agent type for icon display
   */
  agentType?: string;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * MessageBubble - Professional message display component
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   role="agent"
 *   content="Based on your current savings..."
 *   timestamp="2025-12-12T10:30:00Z"
 *   agentName="Retirement Planner"
 *   agentType="retirement"
 * />
 * ```
 */
export function MessageBubble({
  role,
  content,
  timestamp,
  agentName,
  agentType,
  className = '',
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  // Format timestamp
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get agent icon based on type
  const getAgentIcon = (type?: string) => {
    switch (type) {
      case 'retirement':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'portfolio':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        );
      case 'tax':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'goal':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  // System messages (centered, lightweight)
  if (isSystem) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
          {content}
        </div>
      </div>
    );
  }

  // User messages (right-aligned, gray background)
  if (isUser) {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[85%]">
          <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    );
  }

  // Agent messages (left-aligned, white background with border)
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex gap-3 max-w-[85%]">
        {/* Agent Avatar */}
        <div className="flex-none w-8 h-8 mt-1 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          {getAgentIcon(agentType)}
        </div>

        {/* Message Content */}
        <div className="flex-1">
          {/* Agent Name */}
          {agentName && (
            <div className="text-xs font-medium text-gray-700 mb-1">
              {agentName}
            </div>
          )}

          {/* Message Bubble */}
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </p>
          </div>

          {/* Timestamp */}
          <div className="mt-1 text-xs text-gray-500">
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
