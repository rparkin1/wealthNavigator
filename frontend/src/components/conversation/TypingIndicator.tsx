/**
 * TypingIndicator Component (Week 6 - UI Redesign)
 *
 * Animated typing indicator for when agents are responding.
 * Professional, subtle animation that matches design system.
 */

export interface TypingIndicatorProps {
  /**
   * Name of the agent that is typing
   */
  agentName?: string;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * TypingIndicator - Shows animated typing indicator
 *
 * @example
 * ```tsx
 * <TypingIndicator agentName="Portfolio Architect" />
 * ```
 */
export function TypingIndicator({
  agentName,
  className = '',
}: TypingIndicatorProps) {
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex gap-3 max-w-[85%]">
        {/* Agent Avatar */}
        <div className="flex-none w-8 h-8 mt-1 rounded-full bg-blue-50 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-600 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        {/* Typing Bubble */}
        <div className="flex-1">
          {/* Agent Name */}
          {agentName && (
            <div className="text-xs font-medium text-gray-700 mb-1">
              {agentName}
            </div>
          )}

          {/* Typing Animation */}
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
