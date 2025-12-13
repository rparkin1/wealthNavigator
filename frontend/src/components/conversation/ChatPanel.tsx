/**
 * ChatPanel Component (Week 6 - UI Redesign)
 *
 * Desktop right sidebar chat panel following new design system.
 * Features:
 * - Clean, professional layout
 * - Agent activity indicators
 * - Collapsible/expandable
 * - Message streaming support
 */

import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { AgentIndicator } from './AgentIndicator';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { Button } from '../ui';

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  agentName?: string;
  agentType?: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'thinking' | 'idle';
}

export interface ChatPanelProps {
  /**
   * List of messages in the conversation
   */
  messages?: Message[];

  /**
   * Active agents in the current session
   */
  agents?: Agent[];

  /**
   * Whether the chat is currently streaming
   */
  isStreaming?: boolean;

  /**
   * Current agent that is responding
   */
  currentAgent?: string;

  /**
   * Callback when user sends a message
   */
  onSendMessage?: (message: string) => void;

  /**
   * Callback when panel is closed
   */
  onClose?: () => void;

  /**
   * Whether panel is collapsible
   */
  collapsible?: boolean;

  /**
   * Initial collapsed state
   */
  defaultCollapsed?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * ChatPanel - Desktop right sidebar chat interface
 *
 * @example
 * ```tsx
 * <ChatPanel
 *   messages={messages}
 *   agents={activeAgents}
 *   isStreaming={isStreaming}
 *   onSendMessage={handleSend}
 *   onClose={handleClose}
 * />
 * ```
 */
export function ChatPanel({
  messages = [],
  agents = [],
  isStreaming = false,
  currentAgent,
  onSendMessage,
  onClose,
  collapsible = true,
  defaultCollapsed = false,
  className = '',
}: ChatPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isCollapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);

  const handleSendMessage = (message: string) => {
    if (onSendMessage && message.trim()) {
      onSendMessage(message.trim());
    }
  };

  if (isCollapsed) {
    return (
      <div className={`flex flex-col bg-white border-l border-gray-200 ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-4 hover:bg-gray-50 transition-colors text-left"
          aria-label="Expand chat panel"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Chat</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white border-l border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Planning Chat
          </h2>
          <div className="flex items-center gap-2">
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                aria-label="Collapse chat panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close chat panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Indicators */}
      {agents.length > 0 && (
        <div className="flex-none px-6 py-3 border-b border-gray-100">
          <AgentIndicator agents={agents} currentAgent={currentAgent} />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 mb-4 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Start Planning
            </h3>
            <p className="text-xs text-gray-500 max-w-xs">
              Ask about goals, retirement, investments, or tax strategies.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                agentName={message.agentName}
                agentType={message.agentType}
              />
            ))}
            {isStreaming && <TypingIndicator agentName={currentAgent} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-none px-6 py-4 border-t border-gray-200">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
          placeholder="Type your message..."
        />
        <div className="mt-2 text-xs text-gray-400 text-center">
          ⌘ + Enter to send
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
