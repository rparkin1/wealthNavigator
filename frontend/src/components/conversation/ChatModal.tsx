/**
 * ChatModal Component (Week 6 - UI Redesign)
 *
 * Mobile full-screen modal version of the chat interface.
 * Features:
 * - Full-screen takeover on mobile
 * - Swipe-down to dismiss
 * - Bottom sheet behavior
 * - Touch-optimized UI
 */

import { useEffect, useRef, useState } from 'react';
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

export interface ChatModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * List of messages
   */
  messages?: Message[];

  /**
   * Active agents
   */
  agents?: Agent[];

  /**
   * Whether chat is streaming
   */
  isStreaming?: boolean;

  /**
   * Current agent responding
   */
  currentAgent?: string;

  /**
   * Callback when user sends message
   */
  onSendMessage?: (message: string) => void;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * ChatModal - Full-screen mobile chat interface
 *
 * @example
 * ```tsx
 * <ChatModal
 *   isOpen={isChatOpen}
 *   onClose={() => setIsChatOpen(false)}
 *   messages={messages}
 *   onSendMessage={handleSend}
 * />
 * ```
 */
export function ChatModal({
  isOpen,
  onClose,
  messages = [],
  agents = [],
  isStreaming = false,
  currentAgent,
  onSendMessage,
  className = '',
}: ChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState<number | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe-down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    // If swiping down and at top of scroll
    if (diff > 0 && modalRef.current?.scrollTop === 0) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startY) return;

    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY;

    // If swiped down more than 100px, close modal
    if (diff > 100 && modalRef.current?.scrollTop === 0) {
      onClose();
    }

    setStartY(null);
  };

  const handleSendMessage = (message: string) => {
    if (onSendMessage && message.trim()) {
      onSendMessage(message.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`
          fixed inset-0 z-50 lg:hidden
          flex flex-col bg-white
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-modal-title"
      >
        {/* Header with drag handle */}
        <div
          className="flex-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="pt-2 pb-1 flex justify-center">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header Content */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2
                id="chat-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Financial Planning Chat
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close chat"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Agent Indicators */}
          {agents.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100">
              <AgentIndicator agents={agents} currentAgent={currentAgent} />
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div
          ref={modalRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                Start Your Financial Planning
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mb-4">
                Ask about goals, retirement, investments, or tax strategies.
              </p>
              <div className="text-left bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-w-sm">
                <p className="font-medium mb-2">Try asking:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>"Retire at 60 with $80K/year"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>"Save for college education"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>"Optimize my portfolio"</span>
                  </li>
                </ul>
              </div>
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

        {/* Input Area (Fixed Bottom) */}
        <div className="flex-none px-4 py-4 border-t border-gray-200 bg-white">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isStreaming}
            placeholder="Type your message..."
          />
        </div>
      </div>
    </>
  );
}

export default ChatModal;
