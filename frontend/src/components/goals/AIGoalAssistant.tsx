/**
 * AI Goal Assistant Component
 *
 * Main interface for AI-powered natural language goal creation.
 * Provides conversational goal setup with intelligent recommendations.
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import { useState, useEffect } from 'react';
import { NaturalLanguageGoalInput } from './NaturalLanguageGoalInput';
import { GoalTemplateSelector } from './GoalTemplateSelector';
import { GoalFeasibilityReport } from './GoalFeasibilityReport';
import { AIGoalSuggestions } from './AIGoalSuggestions';
import type { Goal } from '../../types/goal';
import type {
  AIGoalAssistanceState,
  ParsedGoalData,
  ClarifyingQuestion,
  GoalRecommendations,
  GoalConflict,
  UserContext,
} from '../../types/aiGoalAssistance';
import * as aiGoalApi from '../../services/aiGoalAssistanceApi';
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

export interface AIGoalAssistantProps {
  userId: string;
  existingGoals: Goal[];
  userContext: UserContext;
  onGoalCreated: (goal: Partial<Goal>) => void;
  onCancel: () => void;
}

export function AIGoalAssistant({
  userId,
  existingGoals,
  userContext,
  onGoalCreated,
  onCancel,
}: AIGoalAssistantProps) {
  const [state, setState] = useState<AIGoalAssistanceState>({
    mode: 'natural-language',
    step: 'input',
    parsedGoal: null,
    clarifyingQuestions: [],
    recommendations: null,
    conflicts: [],
    isProcessing: false,
    error: null,
  });

  const [answers, setAnswers] = useState<Record<string, any>>({});

  /**
   * Handle natural language input submission
   */
  const handleNaturalLanguageInput = async (userInput: string) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await aiGoalApi.parseNaturalLanguageGoal({
        user_input: userInput,
        user_context: userContext,
      });

      setState(prev => ({
        ...prev,
        parsedGoal: result.parsed_goal,
        clarifyingQuestions: result.parsed_goal.clarifying_questions || [],
        step: result.needs_clarification ? 'clarification' : 'review',
        isProcessing: false,
      }));

      // If no clarification needed, get recommendations immediately
      if (!result.needs_clarification) {
        await fetchRecommendationsAndConflicts(result.parsed_goal);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to parse goal',
        isProcessing: false,
      }));
    }
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = async (templateId: string) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Get template details and pre-fill
      const template = getTemplateById(templateId);

      const parsedGoal: ParsedGoalData = {
        goal_category: template.category,
        title: template.title,
        priority: template.priority_suggestion,
        time_horizon_years: template.typical_timeframe_years,
      };

      // Get cost suggestions
      const costSuggestions = await aiGoalApi.suggestTypicalCosts(
        template.category,
        userContext.location,
        userContext
      );

      parsedGoal.target_amount = costSuggestions.cost_estimates.medium;

      // Get timeline recommendation
      if (userContext.age) {
        const timelineRec = await aiGoalApi.recommendTimeHorizon(
          template.category,
          userContext.age,
          parsedGoal.target_amount,
          userContext.current_savings,
          userContext.monthly_contribution
        );
        parsedGoal.target_date = timelineRec.target_date;
      }

      setState(prev => ({
        ...prev,
        parsedGoal,
        step: 'review',
        isProcessing: false,
      }));

      await fetchRecommendationsAndConflicts(parsedGoal);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load template',
        isProcessing: false,
      }));
    }
  };

  /**
   * Handle clarifying question answers
   */
  const handleAnswerQuestion = (questionIndex: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  /**
   * Submit clarifying answers and proceed
   */
  const handleSubmitClarification = async () => {
    if (!state.parsedGoal) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Update parsed goal with answers
      const updatedGoal = { ...state.parsedGoal };

      state.clarifyingQuestions.forEach((q, index) => {
        if (answers[index] !== undefined) {
          // Map answers to goal fields (simplified - would need more logic)
          if (q.question.toLowerCase().includes('amount')) {
            updatedGoal.target_amount = parseFloat(answers[index]);
          } else if (q.question.toLowerCase().includes('when') || q.question.toLowerCase().includes('date')) {
            updatedGoal.target_date = answers[index];
          }
        }
      });

      setState(prev => ({
        ...prev,
        parsedGoal: updatedGoal,
        step: 'review',
        isProcessing: false,
      }));

      await fetchRecommendationsAndConflicts(updatedGoal);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process answers',
        isProcessing: false,
      }));
    }
  };

  /**
   * Fetch recommendations and check for conflicts
   */
  const fetchRecommendationsAndConflicts = async (parsedGoal: ParsedGoalData) => {
    try {
      // Get recommendations
      const recommendations = await aiGoalApi.generateRecommendations(
        parsedGoal as Record<string, any>,
        userContext,
        existingGoals.map(g => ({ ...g, category: g.category }))
      );

      // Check for conflicts
      const conflictCheck = await aiGoalApi.checkGoalConflicts(
        parsedGoal as Record<string, any>,
        existingGoals.map(g => ({ ...g })),
        {
          annual_income: userContext.annual_income || 0,
          current_savings: userContext.current_savings || 0,
        }
      );

      setState(prev => ({
        ...prev,
        recommendations,
        conflicts: conflictCheck.conflicts,
      }));
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // Don't block the flow, just log the error
    }
  };

  /**
   * Finalize and create goal
   */
  const handleCreateGoal = () => {
    if (!state.parsedGoal) return;

    const newGoal: Partial<Goal> = {
      title: state.parsedGoal.title || 'Untitled Goal',
      category: state.parsedGoal.goal_category,
      priority: state.parsedGoal.priority || 'important',
      targetAmount: state.parsedGoal.target_amount || 0,
      targetDate: state.parsedGoal.target_date || new Date().toISOString().split('T')[0],
      monthlyContribution: state.recommendations?.monthly_contribution,
      description: state.parsedGoal.description,
    };

    onGoalCreated(newGoal);
  };

  /**
   * Switch mode
   */
  const handleModeChange = (mode: 'natural-language' | 'template' | 'quick-setup') => {
    setState(prev => ({
      ...prev,
      mode,
      step: 'input',
      parsedGoal: null,
      clarifyingQuestions: [],
      recommendations: null,
      conflicts: [],
      error: null,
    }));
    setAnswers({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">AI Goal Assistant</h2>
              <p className="text-blue-100">Let AI help you create and optimize your financial goals</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-blue-100 p-1"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleModeChange('natural-language')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                state.mode === 'natural-language'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Natural Language</span>
            </button>
            <button
              onClick={() => handleModeChange('template')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                state.mode === 'template'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <ClipboardDocumentListIcon className="w-5 h-5" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => handleModeChange('quick-setup')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                state.mode === 'quick-setup'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <BoltIcon className="w-5 h-5" />
              <span>Quick Setup</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {state.error && (
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-red-700">{state.error}</span>
              <button
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="text-red-600 hover:text-red-800 p-1"
                aria-label="Dismiss error"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Input */}
          {state.step === 'input' && (
            <>
              {state.mode === 'natural-language' && (
                <NaturalLanguageGoalInput
                  onSubmit={handleNaturalLanguageInput}
                  isProcessing={state.isProcessing}
                  userContext={userContext}
                />
              )}

              {state.mode === 'template' && (
                <GoalTemplateSelector
                  onSelectTemplate={handleTemplateSelect}
                  isProcessing={state.isProcessing}
                />
              )}

              {state.mode === 'quick-setup' && (
                <NaturalLanguageGoalInput
                  onSubmit={handleNaturalLanguageInput}
                  isProcessing={state.isProcessing}
                  userContext={userContext}
                  quickMode={true}
                />
              )}
            </>
          )}

          {/* Step: Clarification */}
          {state.step === 'clarification' && state.clarifyingQuestions.length > 0 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Help us refine your goal
                </h3>
                <p className="text-blue-700 text-sm">
                  Please answer a few questions to complete your goal setup
                </p>
              </div>

              <div className="space-y-4">
                {state.clarifyingQuestions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <label className="font-medium text-gray-900">
                        {question.question}
                        {question.importance === 'critical' && (
                          <span className="text-red-600 ml-1">*</span>
                        )}
                      </label>
                      <span className={`text-xs px-2 py-1 rounded ${
                        question.importance === 'critical' ? 'bg-red-100 text-red-700' :
                        question.importance === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {question.importance}
                      </span>
                    </div>

                    {question.help_text && (
                      <p className="text-sm text-gray-600 mb-3">{question.help_text}</p>
                    )}

                    {question.suggested_options ? (
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerQuestion(index, e.target.value)}
                      >
                        <option value="">Select an option...</option>
                        {question.suggested_options.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder={question.default_value || 'Enter your answer...'}
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerQuestion(index, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitClarification}
                  disabled={state.isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {state.isProcessing ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step: Review */}
          {state.step === 'review' && state.parsedGoal && (
            <div className="space-y-6">
              {/* Parsed Goal Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Goal Summary</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Goal Type</label>
                    <p className="font-semibold capitalize">{state.parsedGoal.goal_category}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Priority</label>
                    <p className="font-semibold capitalize">{state.parsedGoal.priority || 'Important'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Target Amount</label>
                    <p className="font-semibold">
                      ${state.parsedGoal.target_amount?.toLocaleString() || 'TBD'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Target Date</label>
                    <p className="font-semibold">
                      {state.parsedGoal.target_date || 'TBD'}
                    </p>
                  </div>
                </div>

                {state.parsedGoal.confidence && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">AI Confidence</span>
                      <span className="font-semibold text-blue-700">
                        {(state.parsedGoal.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${state.parsedGoal.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AI Suggestions */}
              {state.recommendations && (
                <AIGoalSuggestions recommendations={state.recommendations} />
              )}

              {/* Feasibility Report */}
              <GoalFeasibilityReport
                parsedGoal={state.parsedGoal}
                recommendations={state.recommendations}
                conflicts={state.conflicts}
                userContext={userContext}
              />

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Start Over
                </button>
                <button
                  onClick={handleCreateGoal}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold"
                >
                  Create Goal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Processing Overlay */}
        {state.isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">AI is analyzing your goal...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function - would typically come from an API or config
function getTemplateById(templateId: string) {
  const templates = [
    {
      id: 'retirement',
      category: 'retirement' as const,
      title: 'Retirement',
      typical_timeframe_years: 30,
      priority_suggestion: 'essential' as const,
    },
    {
      id: 'education',
      category: 'education' as const,
      title: 'Education',
      typical_timeframe_years: 15,
      priority_suggestion: 'important' as const,
    },
    {
      id: 'home',
      category: 'home' as const,
      title: 'Home Purchase',
      typical_timeframe_years: 5,
      priority_suggestion: 'important' as const,
    },
  ];

  return templates.find(t => t.id === templateId) || templates[0];
}
