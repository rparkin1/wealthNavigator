/**
 * Main App Component
 * Root component with layout structure and routing
 */

import { useState, Suspense, lazy } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import Breadcrumbs from './components/common/Breadcrumbs';
import './index.css';

// Lazy load components for better error isolation
const ChatInterface = lazy(() =>
  import('./components/conversation').then(m => ({ default: m.ChatInterface }))
);

// Re-enabling portfolio with type-only imports fix
const PortfolioView = lazy(() =>
  import('./components/portfolio/PortfolioView').then(m => ({ default: m.PortfolioView }))
);

// Budget components
const BudgetManager = lazy(() =>
  import('./components/budget/BudgetManager').then(m => ({ default: m.BudgetManager }))
);

const RecurringTransactionsManager = lazy(() =>
  import('./components/budget/RecurringTransactionsManager').then(m => ({ default: m.RecurringTransactionsManager }))
);

// Goals components
const GoalsManager = lazy(() =>
  import('./components/goals/GoalsManager').then(m => ({ default: m.GoalsManager }))
);

// Portfolio data manager
const PortfolioDataManager = lazy(() =>
  import('./components/portfolio/PortfolioDataManager').then(m => ({ default: m.PortfolioDataManager }))
);

// Settings
const UserSettings = lazy(() =>
  import('./components/settings/UserSettings').then(m => ({ default: m.UserSettings }))
);

// Retirement Planning
const RetirementDashboard = lazy(() =>
  import('./components/retirement/RetirementDashboard').then(m => ({ default: m.RetirementDashboard }))
);

// Plaid Integration
const PlaidDashboard = lazy(() =>
  import('./components/plaid/PlaidDashboard').then(m => ({ default: m.PlaidDashboard }))
);

// Section 6: What-If Analysis & Scenarios
const WhatIfSliders = lazy(() =>
  import('./components/simulation/WhatIfSliders').then(m => ({ default: m.WhatIfSliders }))
);
const QuickWhatIf = lazy(() =>
  import('./components/simulation/QuickWhatIf').then(m => ({ default: m.QuickWhatIf }))
);
const DistributionHistogram = lazy(() =>
  import('./components/simulation/DistributionHistogram').then(m => ({ default: m.DistributionHistogram }))
);
const TornadoDiagram = lazy(() =>
  import('./components/analysis/TornadoDiagram').then(m => ({ default: m.TornadoDiagram }))
);
const ScenarioComparison = lazy(() =>
  import('./components/simulation/ScenarioComparison').then(m => ({ default: m.ScenarioComparison }))
);
const LifeEventManager = lazy(() =>
  import('./components/lifeEvents/LifeEventManager').then(m => ({ default: m.LifeEventManager }))
);
const HistoricalScenarioPlayer = lazy(() =>
  import('./components/scenarios/HistoricalScenarioPlayer').then(m => ({ default: m.HistoricalScenarioPlayer }))
);
const CustomScenarioBuilder = lazy(() =>
  import('./components/scenarios/CustomScenarioBuilder').then(m => ({ default: m.CustomScenarioBuilder }))
);

type View =
  | 'home'
  | 'chat'
  | 'goals'
  | 'portfolio'
  | 'portfolio-data'
  | 'budget'
  | 'recurring'
  | 'retirement'
  | 'plaid'
  | 'data-entry'
  | 'settings'
  | 'what-if'
  | 'life-events'
  | 'scenarios';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Test user ID matching backend database - in production, get from auth
  const userId = 'test-user-123';

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Chat' }]} />
            </div>
            <Suspense fallback={<LoadingView message="Loading chat interface..." />}>
              <ChatInterface userId={userId} />
            </Suspense>
          </>
        );
      case 'goals':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Goals' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading goals..." />}>
              <Suspense fallback={<LoadingView message="Loading goals..." />}>
                <GoalsManager userId={userId} />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'portfolio':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Portfolio' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading portfolio..." />}>
              <Suspense fallback={<LoadingView message="Loading portfolio..." />}>
                <PortfolioView userId={userId} />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'portfolio-data':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Portfolio Data' }]} />
            </div>
            <Suspense fallback={<LoadingView message="Loading portfolio data..." />}>
              <PortfolioDataManager userId={userId} />
            </Suspense>
          </>
        );
      case 'budget':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Budget' }]} />
            </div>
            <Suspense fallback={<LoadingView message="Loading budget manager..." />}>
              <BudgetManager userId={userId} />
            </Suspense>
          </>
        );
      case 'recurring':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Recurring' }]} />
            </div>
            <Suspense fallback={<LoadingView message="Loading recurring transactions..." />}>
              <RecurringTransactionsManager />
            </Suspense>
          </>
        );
      case 'data-entry':
        return (
          <div className="p-6">
            <div className="mb-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Data Entry' }]} />
            </div>
            <DataEntryView onNavigate={(view) => setCurrentView(view)} />
          </div>
        );
      case 'retirement':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Retirement' }]} />
            </div>
            <Suspense fallback={<LoadingView message="Loading retirement planner..." />}>
              <RetirementDashboard />
            </Suspense>
          </>
        );
      case 'plaid':
        return (
          <ErrorBoundary fallback={<LoadingView message="Loading bank connections..." />}>
            <Suspense fallback={<LoadingView message="Loading bank connections..." />}>
              <PlaidDashboard />
            </Suspense>
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Settings' }]} />
            </div>
            <Suspense fallback={<LoadingView message="Loading settings..." />}>
              <UserSettings userId={userId} />
            </Suspense>
          </>
        );
      case 'what-if':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'What-If Analysis' }]} />
            </div>
            <WhatIfAnalysisView userId={userId} />
          </>
        );
      case 'life-events':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Life Events' }]} />
            </div>
            <LifeEventsView />
          </>
        );
      case 'scenarios':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Scenarios' }]} />
            </div>
            <ScenariosView />
          </>
        );
      case 'home':
      default:
        return <HomeView onStartChat={() => setCurrentView('chat')} onNavigate={(view) => setCurrentView(view)} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {(currentView === 'home' || currentView === 'goals' || currentView === 'portfolio' || currentView === 'retirement' || currentView === 'budget' || currentView === 'recurring' || currentView === 'plaid' || currentView === 'data-entry' || currentView === 'what-if' || currentView === 'life-events' || currentView === 'scenarios') ? (
        sidebarOpen && (
          <aside className="w-64 transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">WealthNavigator AI</h2>
            <p className="text-sm text-gray-600 mt-1">Financial Planning Assistant</p>
          </div>

          <nav className="mt-6">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </h3>
            </div>
            <div className="mt-2 space-y-1 px-2">
              <button
                onClick={() => setCurrentView('home')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'home'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏠 Home
              </button>
              <button
                onClick={() => setCurrentView('data-entry')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'data-entry'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📝 Data Entry
              </button>
              <button
                onClick={() => setCurrentView('chat')}
                className="w-full px-3 py-2 text-left text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
              >
                💬 Chat
              </button>
            </div>

            <div className="px-4 py-2 mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Planning
              </h3>
            </div>
            <div className="mt-2 space-y-1 px-2">
              <button
                onClick={() => setCurrentView('goals')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'goals'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🎯 Goals
              </button>
              <button
                onClick={() => setCurrentView('budget')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'budget'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                💰 Budget
              </button>
              <button
                onClick={() => setCurrentView('recurring')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'recurring'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔄 Recurring
              </button>
              <button
                onClick={() => setCurrentView('portfolio')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'portfolio'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Portfolio
              </button>
              <button
                onClick={() => setCurrentView('retirement')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'retirement'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏖️ Retirement
              </button>
              <button
                onClick={() => setCurrentView('plaid')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'plaid'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏦 Bank Connections
              </button>
            </div>

            <div className="px-4 py-2 mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Analysis & Scenarios
              </h3>
            </div>
            <div className="mt-2 space-y-1 px-2">
              <button
                onClick={() => setCurrentView('what-if')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'what-if'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔮 What-If Analysis
              </button>
              <button
                onClick={() => setCurrentView('life-events')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'life-events'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Life Events
              </button>
              <button
                onClick={() => setCurrentView('scenarios')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'scenarios'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Historical Scenarios
              </button>
            </div>
          </nav>
        </aside>
        )
      ) : null}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {(currentView === 'home' || currentView === 'goals' || currentView === 'portfolio' || currentView === 'retirement' || currentView === 'what-if' || currentView === 'life-events' || currentView === 'scenarios') && (
          <header className="flex-none bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Financial Planning
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('settings')}
                  className="btn-secondary"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function LoadingView({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

function HomeView({ onStartChat, onNavigate }: { onStartChat: () => void; onNavigate: (view: View) => void }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Message */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to WealthNavigator AI
          </h2>
          <p className="text-gray-600 mb-4">
            Your intelligent financial planning assistant powered by AI.
          </p>
          <p className="text-sm text-gray-500">
            Start by entering your financial data, then chat with our AI to plan for retirement, education, or other financial goals.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('data-entry')}>
            <div className="flex items-start">
              <div className="text-blue-600 text-3xl mr-4">📝</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Your Financial Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Start by adding your budget, recurring transactions, and portfolio holdings.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Go to Data Entry →
                </button>
              </div>
            </div>
          </div>

          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={onStartChat}>
            <div className="flex items-start">
              <div className="text-green-600 text-3xl mr-4">💬</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat with AI Assistant</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Have a conversation with our AI to plan your financial goals and get personalized advice.
                </p>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                  Start Chatting →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Features</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-blue-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget Tracking</h3>
              <p className="text-sm text-gray-600">
                Track income, expenses, and savings with AI-powered categorization.
              </p>
            </div>

            <div className="card">
              <div className="text-purple-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Recurring Transactions</h3>
              <p className="text-sm text-gray-600">
                Automate regular income and expenses with smart scheduling.
              </p>
            </div>

            <div className="card">
              <div className="text-green-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Portfolio Management</h3>
              <p className="text-sm text-gray-600">
                Track holdings, analyze performance, and optimize allocations.
              </p>
            </div>

            <div className="card">
              <div className="text-orange-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Goal Planning</h3>
              <p className="text-sm text-gray-600">
                Set and track financial goals with Monte Carlo simulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatIfAnalysisView({ userId }: { userId: string }) {
  const mockBaseValues = {
    monthlyContribution: 1000,
    expectedReturnStocks: 0.08,
    expectedReturnBonds: 0.04,
    inflationRate: 0.03,
    retirementAge: 65,
    lifeExpectancy: 90,
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">What-If Analysis</h2>
          <p className="text-gray-600">
            Explore different financial scenarios with interactive sliders and Monte Carlo simulations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Suspense fallback={<div>Loading...</div>}>
            <WhatIfSliders
              goalId="test-goal-123"
              baseValues={mockBaseValues}
              onAdjustmentsChange={(adjustments) => {
                console.log('Adjustments changed:', adjustments);
              }}
            />
          </Suspense>

          <Suspense fallback={<div>Loading...</div>}>
            <QuickWhatIf
              onScenarioSelect={(scenario) => {
                console.log('Scenario selected:', scenario);
              }}
            />
          </Suspense>

          <Suspense fallback={<div>Loading...</div>}>
            <DistributionHistogram />
          </Suspense>

          <Suspense fallback={<div>Loading...</div>}>
            <TornadoDiagram />
          </Suspense>

          <div className="md:col-span-2">
            <Suspense fallback={<div>Loading...</div>}>
              <ScenarioComparison />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function LifeEventsView() {
  return (
    <ErrorBoundary fallback={<LoadingView message="Loading life events..." />}>
      <Suspense fallback={<LoadingView message="Loading life events..." />}>
        <LifeEventManager />
      </Suspense>
    </ErrorBoundary>
  );
}

function ScenariosView() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Market Scenarios</h2>
          <p className="text-gray-600">
            See how your portfolio would perform during major historical market events.
          </p>
        </div>

        <div className="grid gap-6">
          <Suspense fallback={<div>Loading...</div>}>
            <HistoricalScenarioPlayer />
          </Suspense>

          <Suspense fallback={<div>Loading...</div>}>
            <CustomScenarioBuilder />
          </Suspense>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Backend API Ready:</strong> Historical scenarios API with 6 endpoints operational at{' '}
            <code>/api/v1/historical-scenarios/*</code>
          </p>
        </div>
      </div>
    </div>
  );
}

function DataEntryView({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Data Entry</h2>
          <p className="text-gray-600">
            Enter your financial information to power AI-driven insights and planning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Goals */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('goals')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Financial Goals</h3>
              <p className="text-sm text-gray-600 mb-4">
                Set and track your financial goals with AI-powered planning and Monte Carlo simulations.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Retirement, education, home purchase</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Success probability calculations</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Priority-based planning</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Manage Goals
              </button>
            </div>
          </div>

          {/* Budget Entry */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('budget')}>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Budget Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Track your income, expenses, and savings. AI will analyze patterns and suggest optimizations.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Income tracking (salary, wages, bonuses)</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Expense categorization (50+ categories)</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">AI-powered budget analysis</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Manage Budget
              </button>
            </div>
          </div>

          {/* Recurring Transactions */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('recurring')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Recurring Transactions</h3>
              <p className="text-sm text-gray-600 mb-4">
                Automate regular income and expenses. Set it once, never forget again.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Automatic entry generation</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">5 frequencies (weekly to annual)</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Pause/resume functionality</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Setup Recurring
              </button>
            </div>
          </div>

          {/* Accounts & Holdings */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('portfolio-data')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🏦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Accounts & Holdings</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add investment accounts and holdings for portfolio tracking and analysis.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Multiple account types (401k, IRA, Brokerage)</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Stocks, bonds, ETFs, mutual funds</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">CSV import/export functionality</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Manage Accounts
              </button>
            </div>
          </div>

          {/* Portfolio Analysis */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('portfolio')}>
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Portfolio Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">
                View comprehensive portfolio analysis, performance, and optimization recommendations.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Performance metrics & charts</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Tax-loss harvesting opportunities</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Rebalancing recommendations</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                View Analysis
              </button>
            </div>
          </div>

          {/* Retirement Planning */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('retirement')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🏖️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Retirement Planning</h3>
              <p className="text-sm text-gray-600 mb-4">
                Plan your retirement with Social Security calculator, spending patterns, and Monte Carlo simulations.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Social Security benefit calculator</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Retirement spending patterns</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Longevity & income projections</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Plan Retirement
              </button>
            </div>
          </div>

          {/* User Settings */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('settings')}>
            <div className="text-center">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">User Settings</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure your profile, risk tolerance, tax rates, and preferences.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Risk tolerance configuration</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Tax rate settings</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Personal information</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Manage Settings
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Getting Started Tips</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>Step 1:</strong> Configure your risk tolerance and tax settings in Settings to personalize recommendations.
            </div>
            <div>
              <strong>Step 2:</strong> Set financial goals (retirement, education, etc.) to establish clear targets.
            </div>
            <div>
              <strong>Step 3:</strong> Enter your budget - income, expenses, and savings - to establish your baseline.
            </div>
            <div>
              <strong>Step 4:</strong> Set up recurring transactions for automatic tracking of regular income and expenses.
            </div>
            <div>
              <strong>Step 5:</strong> Add investment accounts and holdings for portfolio analysis and optimization.
            </div>
            <div>
              <strong>Step 6:</strong> Chat with AI to get personalized financial planning and recommendations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
