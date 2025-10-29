/**
 * ChatInterface Component
 *
 * Main conversation interface with SSE streaming support.
 * Displays messages, agent progress, and visualizations in real-time.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSSEStream } from '../../hooks/useSSEStream';
import { MessageList } from './MessageList';
import { AgentProgress } from './AgentProgress';
import { MessageInput } from './MessageInput';
import { VisualizationPanel } from './VisualizationPanel';

interface ChatInterfaceProps {
  threadId?: string;
  userId: string;
  onThreadCreate?: (threadId: string) => void;
}

export function ChatInterface({ threadId, userId }: ChatInterfaceProps) {
  const [currentThreadId] = useState<string | undefined>(threadId);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isStreaming,
    currentAgent,
    messages,
    agentUpdates,
    visualizations,
    error,
    connect,
    disconnect,
  } = useSSEStream();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentUpdates]);

  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim() || isStreaming) return;

    // Connect to SSE stream
    connect(currentThreadId || '', message, userId);

    // If no thread ID, one will be created by the backend
    // We'll receive it in the 'connected' event

    setInputValue('');
  }, [currentThreadId, userId, isStreaming, connect]);

  const handleStop = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-none bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              WealthNavigator AI
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentThreadId ? 'Conversation' : 'New Conversation'}
            </p>
          </div>

          {isStreaming && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop Generation
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Agent Progress Bar */}
          {isStreaming && currentAgent && (
            <div className="flex-none">
              <AgentProgress
                currentAgent={currentAgent}
                agentUpdates={agentUpdates}
              />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <MessageList
              messages={messages}
              agentUpdates={agentUpdates}
              isStreaming={isStreaming}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex-none mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-none border-t border-gray-200 bg-white px-6 py-4">
            <MessageInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              disabled={isStreaming}
              placeholder="Ask about your financial goals, portfolio, or retirement planning..."
            />
          </div>
        </div>

        {/* Visualizations Panel */}
        {visualizations.length > 0 ? (
          <div className="flex-none w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <VisualizationPanel visualizations={visualizations} />
          </div>
        ) : (
          <div className="hidden">
            {/* Debug: visualizations count = {visualizations.length} */}
          </div>
        )}
      </div>
    </div>
  );
}
