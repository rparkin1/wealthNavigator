/**
 * Natural Language Goal Input Component
 *
 * Provides a conversational text input for describing goals in natural language.
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import { useState } from 'react';
import type { UserContext } from '../../types/aiGoalAssistance';
import {
  ChatBubbleLeftRightIcon,
  CheckIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { getCategoryIcon } from '../../utils/icons';

export interface NaturalLanguageGoalInputProps {
  onSubmit: (input: string) => void;
  isProcessing: boolean;
  userContext: UserContext;
  quickMode?: boolean;
}

export function NaturalLanguageGoalInput({
  onSubmit,
  isProcessing,
  userContext,
  quickMode = false,
}: NaturalLanguageGoalInputProps) {
  const [input, setInput] = useState('');
  const [showExamples, setShowExamples] = useState(true);

  const exampleGoals = [
    "I want to retire at 60 with $80,000 per year in income",
    "Save for my daughter's college education at Stanford in 15 years",
    "Buy a house in San Francisco with $200,000 down payment in 5 years",
    "Build an emergency fund of 6 months expenses",
    "Save $50,000 for a wedding in 2 years",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 10) {
      alert('Please provide more details about your goal (at least 10 characters)');
      return;
    }
    onSubmit(input.trim());
  };

  const useExample = (example: string) => {
    setInput(example);
    setShowExamples(false);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-primary-600">
            <ChatBubbleLeftRightIcon className="w-12 h-12" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {quickMode ? 'Quick Goal Setup' : 'Describe Your Goal Naturally'}
            </h3>
            <p className="text-gray-700 mb-3">
              {quickMode
                ? 'Tell me about your goal in your own words, and I\'ll set it up for you instantly.'
                : 'Tell me about your financial goal in your own words. Our AI will understand and help you refine it.'}
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-success-600 flex-shrink-0" />
                <span>No forms or complex fields</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-success-600 flex-shrink-0" />
                <span>AI understands context and intent</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-success-600 flex-shrink-0" />
                <span>Intelligent suggestions and clarifications</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Context Display */}
      {(userContext.age || userContext.annual_income) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">AI will use your profile information:</p>
          <div className="flex gap-4 text-sm">
            {userContext.age && (
              <span className="text-gray-700">
                <strong>Age:</strong> {userContext.age}
              </span>
            )}
            {userContext.annual_income && (
              <span className="text-gray-700">
                <strong>Income:</strong> ${userContext.annual_income.toLocaleString()}/year
              </span>
            )}
            {userContext.location && (
              <span className="text-gray-700">
                <strong>Location:</strong> {userContext.location}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your goal
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: I want to retire at 60 with $80,000 per year in income..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={isProcessing}
            minLength={10}
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500">
              {input.length}/1000 characters
            </span>
            {input.length < 10 && input.length > 0 && (
              <span className="text-sm text-orange-600">
                Please provide more details (min 10 characters)
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing || input.trim().length < 10}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              Analyzing with AI...
            </span>
          ) : (
            `${quickMode ? 'Create Goal Instantly' : 'Analyze My Goal'} →`
          )}
        </button>
      </form>

      {/* Example Goals */}
      {showExamples && (
        <div className="space-y-3">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1.5"
          >
            <LightBulbIcon className="w-4 h-4" />
            <span className="underline">See example goals</span>
          </button>

          <div className="grid gap-2">
            {exampleGoals.map((example, index) => {
              // Map example index to goal category
              const categoryMap = ['retirement', 'education', 'home', 'emergency', 'major_expense'] as const;
              const category = categoryMap[index] || 'retirement';
              const IconComponent = getCategoryIcon(category);

              return (
                <button
                  key={index}
                  onClick={() => useExample(example)}
                  className="text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-gray-400 group-hover:text-primary-600">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {example}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-1.5">
          <LightBulbIcon className="w-5 h-5" />
          <span>Tips for better results:</span>
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Be specific about amounts and timeframes</li>
          <li>• Mention your current age and life stage</li>
          <li>• Include any constraints or preferences</li>
          <li>• Don't worry about technical terms - just be natural!</li>
        </ul>
      </div>
    </div>
  );
}
