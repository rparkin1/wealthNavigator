/**
 * Goals Manager Component
 *
 * Complete interface for managing financial goals with dashboard and forms.
 */

import { useState, useEffect } from 'react';
import { GoalDashboardRedesign } from './GoalDashboardRedesign';
import { GoalForm } from './GoalForm';
import { GoalCreationWizard } from './wizard';
import type { WizardFormData } from './wizard/types';
import { AIGoalAssistant } from './AIGoalAssistant';
import { GoalDependencyGraph } from './GoalDependencyGraph';
import { DependencyEditor } from './DependencyEditor';
import { SequentialGoalPlanner } from './SequentialGoalPlanner';
import { DependencyValidator } from './DependencyValidator';
import { MilestoneManager } from './MilestoneManager';
import { MilestoneTimeline } from './MilestoneTimeline';
import { MilestoneProgressBar } from './MilestoneProgressBar';
import { MentalAccountBuckets } from './MentalAccountBuckets';
import { BucketAllocationEditor } from './BucketAllocationEditor';
import { FundingWaterfallChart } from './FundingWaterfallChart';
import { BucketRebalancer } from './BucketRebalancer';
import { GoalFundingCalculator } from './GoalFundingCalculator';
import type { Goal } from './GoalCard';
import type { UserContext } from '../../types/aiGoalAssistance';
import type { GoalDependency } from '../../types/goalDependencies';
import type { MentalAccountBucket } from '../../types/mentalAccounting';
import * as dependencyApi from '../../services/goalDependenciesApi';
import * as mentalAccountingApi from '../../services/mentalAccountingApi';

export interface GoalsManagerProps {
  userId: string;
  userContext?: UserContext;
}

export function GoalsManager({ userId, userContext }: GoalsManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dependencies, setDependencies] = useState<GoalDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Dependency modals
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);
  const [showDependencyEditor, setShowDependencyEditor] = useState(false);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showDependencyValidator, setShowDependencyValidator] = useState(false);
  const [editingDependency, setEditingDependency] = useState<GoalDependency | null>(null);

  // Milestone modals
  const [showMilestoneManager, setShowMilestoneManager] = useState(false);
  const [showMilestoneTimeline, setShowMilestoneTimeline] = useState(false);
  const [showMilestoneProgress, setShowMilestoneProgress] = useState(false);
  const [selectedGoalForMilestones, setSelectedGoalForMilestones] = useState<Goal | null>(null);

  // Mental Accounting modals
  const [showMentalAccountBuckets, setShowMentalAccountBuckets] = useState(false);
  const [showBucketAllocationEditor, setShowBucketAllocationEditor] = useState(false);
  const [showFundingWaterfall, setShowFundingWaterfall] = useState(false);
  const [showBucketRebalancer, setShowBucketRebalancer] = useState(false);
  const [selectedGoalForMentalAccounting, setSelectedGoalForMentalAccounting] = useState<Goal | null>(null);
  const [mentalAccountBuckets, setMentalAccountBuckets] = useState<MentalAccountBucket[]>([]);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number>(100000); // TODO: Get from actual accounts

  // Goal Funding modal
  const [showGoalFundingCalculator, setShowGoalFundingCalculator] = useState(false);
  const [selectedGoalForFunding, setSelectedGoalForFunding] = useState<Goal | null>(null);

  // Default user context if not provided
  const defaultUserContext: UserContext = userContext || {
    age: 35,
    annual_income: 100000,
    location: 'United States',
    existing_goals: goals,
  };

  useEffect(() => {
    loadGoals();
    loadDependencies();
    loadMentalAccounts();
  }, [userId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/goals?user_id=${userId}`);
      // const data = await response.json();
      // setGoals(data.goals);

      // Mock data for now
      setGoals([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const deps = await dependencyApi.getAllDependencies();
      setDependencies(deps);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  };

  const loadMentalAccounts = async () => {
    try {
      const result = await mentalAccountingApi.getAllMentalAccounts(userId);
      setMentalAccountBuckets(result.mental_accounts);
    } catch (err) {
      console.error('Failed to load mental accounts:', err);
    }
  };

  const handleNewGoal = () => {
    setEditingGoal(null);
    setShowForm(true);
  };

  const handleNewGoalWithAI = () => {
    setShowAIAssistant(true);
  };

  const handleAIGoalCreated = (goalData: Partial<Goal>) => {
    // Create goal from AI-generated data
    const newGoal: Goal = {
      ...goalData as Goal,
      id: crypto.randomUUID(),
      currentAmount: 0,
      status: 'on_track',
    };
    setGoals(prev => [...prev, newGoal]);
    setShowAIAssistant(false);
  };

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setEditingGoal(goal);
      setShowForm(true);
    }
  };

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    try {
      // TODO: API call
      if (editingGoal) {
        // Update
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalData } as Goal : g));
      } else {
        // Create
        const newGoal: Goal = {
          ...goalData as Goal,
          id: crypto.randomUUID(),
          currentAmount: 0,
          status: 'on_track',
        };
        setGoals(prev => [...prev, newGoal]);
      }
      setShowForm(false);
      setEditingGoal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return;

    try {
      // TODO: API call
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  const handleViewDetails = (goalId: string) => {
    // Navigate to goal details or open detailed modal
    console.log('View details for goal:', goalId);
  };

  // Dependency handlers
  const handleCreateDependency = () => {
    setEditingDependency(null);
    setShowDependencyEditor(true);
  };

  const handleEditDependency = (dependency: GoalDependency) => {
    setEditingDependency(dependency);
    setShowDependencyEditor(true);
  };

  const handleSaveDependency = async (dependency: GoalDependency) => {
    await loadDependencies();
    setShowDependencyEditor(false);
    setEditingDependency(null);
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    if (!confirm('Delete this dependency?')) return;

    try {
      await dependencyApi.deleteDependency(dependencyId);
      await loadDependencies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dependency');
    }
  };

  const handleNodeClick = (goalId: string) => {
    handleViewDetails(goalId);
  };

  const handleLinkClick = (dependency: GoalDependency) => {
    handleEditDependency(dependency);
  };

  // Milestone handlers
  const handleManageMilestones = (goal: Goal) => {
    setSelectedGoalForMilestones(goal);
    setShowMilestoneManager(true);
  };

  const handleShowTimeline = (goal: Goal) => {
    setSelectedGoalForMilestones(goal);
    setShowMilestoneTimeline(true);
  };

  const handleShowProgress = (goal: Goal) => {
    setSelectedGoalForMilestones(goal);
    setShowMilestoneProgress(true);
  };

  const handleMilestonesUpdated = async () => {
    // Reload goals to get updated progress
    await loadGoals();
  };

  // Mental Accounting handlers
  const handleAllocateAccount = (goal: Goal) => {
    setSelectedGoalForMentalAccounting(goal);
    setShowBucketAllocationEditor(true);
  };

  const handleAllocationUpdated = async () => {
    await loadMentalAccounts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary Actions Row */}
        <div className="flex gap-3 justify-between items-center">
          {/* Dependency Management Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDependencyGraph(true)}
              disabled={goals.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>🔗</span>
              <span>Dependencies</span>
            </button>
            <button
              onClick={handleCreateDependency}
              disabled={goals.length < 2}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>➕</span>
              <span>Add Dependency</span>
            </button>
            <button
              onClick={() => setShowGoalPlanner(true)}
              disabled={goals.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>📅</span>
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setShowDependencyValidator(true)}
              disabled={dependencies.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>✅</span>
              <span>Validate</span>
            </button>
          </div>

          {/* Goal Creation Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleNewGoalWithAI}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg flex items-center gap-2"
            >
              <span>🤖</span>
              <span>Create Goal with AI</span>
            </button>
            <button
              onClick={handleNewGoal}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              + Manual Entry
            </button>
          </div>
        </div>

        {/* Milestone Management Row */}
        {goals.length > 0 && (
          <div className="flex gap-2 pl-4 border-l-2 border-purple-300">
            <span className="text-sm font-medium text-gray-600 self-center mr-2">Milestones:</span>
            {goals.map((goal) => (
              <div key={goal.id} className="relative group">
                <button
                  onClick={() => handleManageMilestones(goal)}
                  className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-100 hover:border-purple-300 transition-colors"
                >
                  {goal.title}
                </button>
                {/* Quick Actions Dropdown */}
                <div className="hidden group-hover:block absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => handleManageMilestones(goal)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>⚙️</span>
                    <span>Manage</span>
                  </button>
                  <button
                    onClick={() => handleShowTimeline(goal)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📊</span>
                    <span>Timeline</span>
                  </button>
                  <button
                    onClick={() => handleShowProgress(goal)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📈</span>
                    <span>Progress</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mental Accounting Row */}
        {goals.length > 0 && (
          <div className="flex gap-2 pl-4 border-l-2 border-teal-300">
            <span className="text-sm font-medium text-gray-600 self-center mr-2">Mental Accounting:</span>
            <button
              onClick={() => setShowMentalAccountBuckets(true)}
              className="px-4 py-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium flex items-center gap-2"
            >
              <span>🪣</span>
              <span>View Buckets</span>
            </button>
            <button
              onClick={() => setShowFundingWaterfall(true)}
              className="px-4 py-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium flex items-center gap-2"
            >
              <span>💧</span>
              <span>Funding Waterfall</span>
            </button>
            <button
              onClick={() => setShowBucketRebalancer(true)}
              className="px-4 py-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium flex items-center gap-2"
            >
              <span>⚖️</span>
              <span>Rebalance</span>
            </button>
          </div>
        )}

        {/* Goal Funding Row */}
        {goals.length > 0 && (
          <div className="flex gap-2 pl-4 border-l-2 border-green-300">
            <span className="text-sm font-medium text-gray-600 self-center mr-2">Goal Funding:</span>
            {goals.map((goal) => (
              <div key={goal.id} className="relative group">
                <button
                  onClick={() => {
                    setSelectedGoalForFunding(goal);
                    setShowGoalFundingCalculator(true);
                  }}
                  className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 hover:border-green-300 transition-colors flex items-center gap-2"
                >
                  <span>💰</span>
                  <span>{goal.title}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Dashboard */}
      <GoalDashboardRedesign
        goals={goals}
        onNewGoal={handleNewGoal}
        onEditGoal={handleEditGoal}
        onDeleteGoal={handleDeleteGoal}
        onViewDetails={handleViewDetails}
      />

      {/* AI Goal Assistant Modal */}
      {showAIAssistant && (
        <AIGoalAssistant
          userId={userId}
          existingGoals={goals}
          userContext={defaultUserContext}
          onGoalCreated={handleAIGoalCreated}
          onCancel={() => setShowAIAssistant(false)}
        />
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSubmit={handleSaveGoal}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
          mode={editingGoal ? 'edit' : 'create'}
        />
      )}

      {/* Dependency Graph Modal */}
      {showDependencyGraph && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Goal Dependency Graph</h2>
                <button
                  onClick={() => setShowDependencyGraph(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <GoalDependencyGraph
                goals={goals}
                dependencies={dependencies}
                onNodeClick={handleNodeClick}
                onLinkClick={handleLinkClick}
                width={1000}
                height={700}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dependency Editor Modal */}
      {showDependencyEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <DependencyEditor
                goals={goals}
                existingDependency={editingDependency || undefined}
                onSave={handleSaveDependency}
                onCancel={() => {
                  setShowDependencyEditor(false);
                  setEditingDependency(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Goal Planner Modal */}
      {showGoalPlanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Sequential Goal Planner</h2>
                <button
                  onClick={() => setShowGoalPlanner(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <SequentialGoalPlanner
                goals={goals}
                dependencies={dependencies}
                onReorder={(optimizedSequence) => {
                  console.log('Optimized sequence:', optimizedSequence);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dependency Validator Modal */}
      {showDependencyValidator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Dependency Validation</h2>
                <button
                  onClick={() => setShowDependencyValidator(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <DependencyValidator
                goals={goals}
                dependencies={dependencies}
                autoValidate={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Milestone Manager Modal */}
      {showMilestoneManager && selectedGoalForMilestones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <MilestoneManager
              goal={selectedGoalForMilestones}
              onClose={() => {
                setShowMilestoneManager(false);
                setSelectedGoalForMilestones(null);
              }}
              onMilestonesUpdated={handleMilestonesUpdated}
            />
          </div>
        </div>
      )}

      {/* Milestone Timeline Modal */}
      {showMilestoneTimeline && selectedGoalForMilestones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Milestone Timeline</h2>
                <button
                  onClick={() => {
                    setShowMilestoneTimeline(false);
                    setSelectedGoalForMilestones(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <MilestoneTimeline goal={selectedGoalForMilestones} />
            </div>
          </div>
        </div>
      )}

      {/* Milestone Progress Modal */}
      {showMilestoneProgress && selectedGoalForMilestones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Progress Metrics</h2>
                <button
                  onClick={() => {
                    setShowMilestoneProgress(false);
                    setSelectedGoalForMilestones(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <MilestoneProgressBar goal={selectedGoalForMilestones} compact={false} />
            </div>
          </div>
        </div>
      )}

      {/* Mental Account Buckets Modal */}
      {showMentalAccountBuckets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Mental Account Buckets</h2>
                <button
                  onClick={() => setShowMentalAccountBuckets(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <MentalAccountBuckets
                goals={goals}
                onAllocateAccount={handleAllocateAccount}
                userId={userId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bucket Allocation Editor Modal */}
      {showBucketAllocationEditor && selectedGoalForMentalAccounting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <BucketAllocationEditor
              goal={selectedGoalForMentalAccounting}
              availableAccounts={[]} // TODO: Get from actual accounts
              existingAllocations={[]}
              onClose={() => {
                setShowBucketAllocationEditor(false);
                setSelectedGoalForMentalAccounting(null);
              }}
              onAllocationUpdated={handleAllocationUpdated}
            />
          </div>
        </div>
      )}

      {/* Funding Waterfall Modal */}
      {showFundingWaterfall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Funding Waterfall Analysis</h2>
                <button
                  onClick={() => setShowFundingWaterfall(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <FundingWaterfallChart
                buckets={mentalAccountBuckets}
                totalAvailable={totalPortfolioValue}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bucket Rebalancer Modal */}
      {showBucketRebalancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Portfolio Rebalancing</h2>
                <button
                  onClick={() => setShowBucketRebalancer(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <BucketRebalancer
                userId={userId}
                buckets={mentalAccountBuckets}
                totalPortfolioValue={totalPortfolioValue}
                onRebalanceComplete={() => {
                  loadMentalAccounts();
                  setShowBucketRebalancer(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Goal Funding Calculator Modal */}
      {showGoalFundingCalculator && selectedGoalForFunding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <GoalFundingCalculator
                goalId={selectedGoalForFunding.id}
                initialTargetAmount={selectedGoalForFunding.targetAmount}
                initialCurrentAmount={selectedGoalForFunding.currentAmount || 0}
                initialMonthlyContribution={selectedGoalForFunding.monthlyContribution || 0}
                initialYearsToGoal={
                  selectedGoalForFunding.targetDate
                    ? Math.max(
                        1,
                        Math.round(
                          (new Date(selectedGoalForFunding.targetDate).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24 * 365)
                        )
                      )
                    : 20
                }
                onClose={() => {
                  setShowGoalFundingCalculator(false);
                  setSelectedGoalForFunding(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
