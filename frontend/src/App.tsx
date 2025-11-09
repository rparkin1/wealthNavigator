/**
 * Main App Component
 * Root component with layout structure and routing
 */

import { useState, Suspense, lazy, useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import Breadcrumbs from './components/common/Breadcrumbs';
import NotificationSystem from './components/common/NotificationSystem';
import HelpMenu from './components/help/HelpMenu';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import InAppDocumentation from './components/help/InAppDocumentation';
import { SkipLink } from './components/common/SkipLink';
import { useOnboarding } from './hooks/useOnboarding';
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

// Tax Management
const TaxDashboard = lazy(() =>
  import('./components/tax/TaxDashboard').then(m => ({ default: m.TaxDashboard }))
);

// Estate Planning
const EstatePlanningDashboard = lazy(() =>
  import('./components/estatePlanning/EstatePlanningDashboard').then(m => ({ default: m.default }))
);

// Hedging Strategies
const HedgingStrategyDashboard = lazy(() =>
  import('./components/hedging/HedgingStrategyDashboard').then(m => ({ default: m.HedgingStrategyDashboard }))
);

// Insurance Optimization
const InsuranceOptimizationDashboard = lazy(() =>
  import('./components/insurance/InsuranceOptimizationDashboard').then(m => ({ default: m.default }))
);

// Sensitivity Analysis
const SensitivityAnalysisDashboard = lazy(() =>
  import('./components/sensitivity/SensitivityAnalysisDashboard').then(m => ({ default: m.SensitivityAnalysisDashboard }))
);

// Risk Management
const RiskDashboard = lazy(() =>
  import('./components/risk/RiskDashboard').then(m => ({ default: m.RiskDashboard }))
);

// Reserve Monitoring
const ReserveMonitoringDashboard = lazy(() =>
  import('./components/risk/ReserveMonitoringDashboard').then(m => ({ default: m.ReserveMonitoringDashboard }))
);

// Diversification Analysis
const DiversificationAnalysisDashboard = lazy(() =>
  import('./components/risk/DiversificationAnalysisDashboard').then(m => ({ default: m.DiversificationAnalysisDashboard }))
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

// Education Funding (Section 2.5)
const EducationFundingDashboard = lazy(() =>
  import('./components/education/EducationFundingDashboard').then(m => ({ default: m.EducationFundingDashboard }))
);
const Plan529Calculator = lazy(() =>
  import('./components/education/Plan529Calculator').then(m => ({ default: m.Plan529Calculator }))
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
  | 'education'
  | '529-calculator'
  | 'tax'
  | 'estate-planning'
  | 'hedging'
  | 'insurance'
  | 'sensitivity'
  | 'risk'
  | 'reserves'
  | 'diversification'
  | 'plaid'
  | 'data-entry'
  | 'settings'
  | 'what-if'
  | 'life-events'
  | 'scenarios';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');

  // Test user ID matching backend database - in production, get from auth
  const userId = 'test-user-123';

  // Onboarding state
  const {
    shouldShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    startOnboarding,
  } = useOnboarding();

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding should be shown
  useEffect(() => {
    if (shouldShowOnboarding()) {
      // Delay to allow app to render first
      setTimeout(() => {
        setShowOnboarding(true);
        startOnboarding();
      }, 500);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    skipOnboarding();
  };

  const handleOpenDocumentation = (docPath: string) => {
    setCurrentDocPath(docPath);
    setShowDocumentation(true);
  };

  const handleOpenTutorial = (tutorialId: string) => {
    setCurrentDocPath(tutorialId);
    setShowDocumentation(true);
  };

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
      case 'education':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Education Funding' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading education planning..." />}>
              <Suspense fallback={<LoadingView message="Loading education planning..." />}>
                <EducationFundingDashboard userId={userId} />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'tax':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Tax Management' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading tax management..." />}>
              <Suspense fallback={<LoadingView message="Loading tax management..." />}>
                <TaxDashboard />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'estate-planning':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Estate Planning' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading estate planning..." />}>
              <Suspense fallback={<LoadingView message="Loading estate planning..." />}>
                <EstatePlanningDashboard />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'hedging':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Hedging Strategies' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading hedging strategies..." />}>
              <Suspense fallback={<LoadingView message="Loading hedging strategies..." />}>
                <HedgingStrategyDashboard
                  portfolioValue={500000}
                  allocation={{ stocks: 0.7, bonds: 0.3 }}
                  riskMetrics={{ volatility: 0.15, beta: 1.1 }}
                />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'insurance':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Insurance Optimization' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading insurance optimization..." />}>
              <Suspense fallback={<LoadingView message="Loading insurance optimization..." />}>
                <InsuranceOptimizationDashboard userId={userId} />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'sensitivity':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Sensitivity Analysis' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading sensitivity analysis..." />}>
              <Suspense fallback={<LoadingView message="Loading sensitivity analysis..." />}>
                <SensitivityAnalysisDashboard goalId="sample-goal-123" />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'risk':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Risk Management' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading risk management..." />}>
              <Suspense fallback={<LoadingView message="Loading risk management..." />}>
                <RiskDashboard
                  portfolioValue={500000}
                  allocation={{ stocks: 0.6, bonds: 0.3, cash: 0.1 }}
                  expectedReturn={0.08}
                  volatility={0.15}
                />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'reserves':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Reserve Monitoring' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading reserve monitoring..." />}>
              <Suspense fallback={<LoadingView message="Loading reserve monitoring..." />}>
                <ReserveMonitoringDashboard
                  currentReserves={25000}
                  monthlyExpenses={5000}
                  monthlyIncome={8000}
                  hasDependents={true}
                  incomeStability="stable"
                  jobSecurity="secure"
                />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case 'diversification':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs items={[{ label: 'Home', onClick: () => setCurrentView('home') }, { label: 'Diversification Analysis' }]} />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading diversification analysis..." />}>
              <Suspense fallback={<LoadingView message="Loading diversification analysis..." />}>
                <DiversificationAnalysisDashboard
                  portfolioValue={500000}
                  holdings={[]}
                />
              </Suspense>
            </ErrorBoundary>
          </>
        );
      case '529-calculator':
        return (
          <>
            <div className="px-6 pt-4">
              <Breadcrumbs
                items={[
                  { label: 'Home', onClick: () => setCurrentView('home') },
                  { label: 'Education Funding', onClick: () => setCurrentView('education') },
                  { label: '529 Calculator' }
                ]}
              />
            </div>
            <ErrorBoundary fallback={<LoadingView message="Loading 529 calculator..." />}>
              <Suspense fallback={<LoadingView message="Loading 529 calculator..." />}>
                <Plan529Calculator />
              </Suspense>
            </ErrorBoundary>
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
    <>
      {/* Skip Navigation Link */}
      <SkipLink targetId="main-content" label="Skip to main content" />

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          userId={userId}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Documentation Viewer */}
      {showDocumentation && (
        <InAppDocumentation
          docPath={currentDocPath}
          onClose={() => setShowDocumentation(false)}
        />
      )}

      <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      {(currentView === 'home' || currentView === 'goals' || currentView === 'portfolio' || currentView === 'retirement' || currentView === 'education' || currentView === '529-calculator' || currentView === 'tax' || currentView === 'estate-planning' || currentView === 'hedging' || currentView === 'insurance' || currentView === 'risk' || currentView === 'reserves' || currentView === 'diversification' || currentView === 'sensitivity' || currentView === 'budget' || currentView === 'recurring' || currentView === 'plaid' || currentView === 'data-entry' || currentView === 'what-if' || currentView === 'life-events' || currentView === 'scenarios') ? (
        sidebarOpen && (
          <aside
            className="w-64 transition-all duration-300 bg-white border-r border-gray-200 flex flex-col h-screen"
            role="navigation"
            aria-label="Main navigation"
          >
          <div className="flex-none p-4">
            <h2 className="text-lg font-semibold text-gray-900">WealthNavigator AI</h2>
            <p className="text-sm text-gray-600 mt-1">Financial Planning Assistant</p>
          </div>

          <nav className="flex-1 overflow-y-auto mt-6" aria-label="Main menu">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider" id="nav-heading">
                Navigation
              </h3>
            </div>
            <div className="mt-2 space-y-1 px-2" role="list" aria-labelledby="nav-heading">
              <button
                onClick={() => setCurrentView('home')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'home'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={currentView === 'home' ? 'page' : undefined}
                aria-label="Home"
              >
                <span aria-hidden="true">🏠</span> Home
              </button>
              <button
                onClick={() => setCurrentView('data-entry')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'data-entry'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={currentView === 'data-entry' ? 'page' : undefined}
                aria-label="Data Entry"
              >
                <span aria-hidden="true">📝</span> Data Entry
              </button>
              <button
                onClick={() => setCurrentView('chat')}
                className="w-full px-3 py-2 text-left text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                aria-label="Chat with AI Assistant"
              >
                <span aria-hidden="true">💬</span> Chat
              </button>
            </div>

            <div className="px-4 py-2 mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider" id="planning-heading">
                Planning
              </h3>
            </div>
            <div className="mt-2 space-y-1 px-2" role="list" aria-labelledby="planning-heading">
              <button
                onClick={() => setCurrentView('goals')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'goals'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={currentView === 'goals' ? 'page' : undefined}
                aria-label="Financial Goals"
              >
                <span aria-hidden="true">🎯</span> Goals
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
                onClick={() => setCurrentView('education')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'education' || currentView === '529-calculator'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🎓 Education Funding
              </button>
              <button
                onClick={() => setCurrentView('tax')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'tax'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                💰 Tax Management
              </button>
              <button
                onClick={() => setCurrentView('estate-planning')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'estate-planning'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏛️ Estate Planning
              </button>
              <button
                onClick={() => setCurrentView('hedging')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'hedging'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🛡️ Hedging Strategies
              </button>
              <button
                onClick={() => setCurrentView('insurance')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'insurance'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏥 Insurance Optimization
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
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider" id="analysis-heading">
                Analysis & Scenarios
              </h3>
            </div>
            <div className="mt-2 space-y-1 px-2" role="list" aria-labelledby="analysis-heading">
              <button
                onClick={() => setCurrentView('risk')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'risk'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={currentView === 'risk' ? 'page' : undefined}
                aria-label="Risk Management"
              >
                <span aria-hidden="true">⚠️</span> Risk Management
              </button>
              <button
                onClick={() => setCurrentView('reserves')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'reserves'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                💰 Reserve Monitoring
              </button>
              <button
                onClick={() => setCurrentView('diversification')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'diversification'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🎯 Diversification
              </button>
              <button
                onClick={() => setCurrentView('sensitivity')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'sensitivity'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Sensitivity Analysis
              </button>
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
        {(currentView === 'home' || currentView === 'goals' || currentView === 'portfolio' || currentView === 'retirement' || currentView === 'tax' || currentView === 'estate-planning' || currentView === 'hedging' || currentView === 'insurance' || currentView === 'risk' || currentView === 'reserves' || currentView === 'diversification' || currentView === 'sensitivity' || currentView === 'what-if' || currentView === 'life-events' || currentView === 'scenarios') && (
          <header className="flex-none bg-white border-b border-gray-200 px-6 py-4" role="banner">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                  aria-expanded={sidebarOpen}
                  aria-controls="sidebar-navigation"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                  <span className="sr-only">{sidebarOpen ? 'Close' : 'Open'} navigation menu</span>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Financial Planning
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationSystem maxNotifications={10} autoHideDuration={5000} />
                <HelpMenu
                  onOpenDocumentation={handleOpenDocumentation}
                  onOpenTutorial={handleOpenTutorial}
                />
                <button
                  onClick={() => setCurrentView('settings')}
                  className="btn-secondary"
                  aria-label="Open settings"
                >
                  <span aria-hidden="true">⚙️</span> Settings
                </button>
              </div>
            </div>
          </header>
        )}

        <main
          id="main-content"
          className="flex-1 overflow-hidden"
          role="main"
          aria-label="Main content"
          tabIndex={-1}
        >
          {renderView()}
        </main>
      </div>
    </div>
    </>
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

          {/* Tax Management */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('tax')}>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Tax Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive tax optimization tools including Backdoor Roth conversion analysis and tax-loss harvesting.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Backdoor Roth conversion analyzer</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Tax-loss harvesting opportunities</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Municipal bond optimization</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Optimize Taxes
              </button>
            </div>
          </div>

          {/* Estate Planning */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('estate-planning')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🏛️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Estate Planning</h3>
              <p className="text-sm text-gray-600 mb-4">
                Plan your legacy with estate tax projections, trust structures, and beneficiary optimization.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Estate tax calculator & projections</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Trust structure recommendations</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Beneficiary & gifting strategies</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Plan Estate
              </button>
            </div>
          </div>

          {/* Hedging Strategies */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('hedging')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Hedging Strategies</h3>
              <p className="text-sm text-gray-600 mb-4">
                Protect your portfolio with options strategies, downside protection, and risk management tools.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Protective put calculator</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Collar strategy builder</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Market volatility hedging</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Explore Hedging
              </button>
            </div>
          </div>

          {/* Insurance Optimization */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('insurance')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🏥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Insurance Optimization</h3>
              <p className="text-sm text-gray-600 mb-4">
                Optimize your insurance coverage with comprehensive analysis for life, disability, and long-term care.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Life insurance needs calculator</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Disability coverage analyzer</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Long-term care planning</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Optimize Coverage
              </button>
            </div>
          </div>

          {/* Risk Management */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('risk')}>
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Risk Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive risk assessment, stress testing, and hedging strategies for your portfolio.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Portfolio risk assessment (VaR, Sharpe)</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Stress testing & scenario analysis</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Diversification & hedging strategies</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Assess Risk
              </button>
            </div>
          </div>

          {/* Reserve Monitoring */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('reserves')}>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Reserve Monitoring</h3>
              <p className="text-sm text-gray-600 mb-4">
                Monitor your emergency fund and ensure adequate reserves for unexpected expenses.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Emergency fund status & alerts</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Replenishment planning</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Reserve growth simulator</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Monitor Reserves
              </button>
            </div>
          </div>

          {/* Diversification Analysis */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('diversification')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Diversification Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">
                Analyze portfolio diversification and identify concentration risks across holdings.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Concentration risk analysis</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Sector & geographic exposure</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Diversification recommendations</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Analyze Diversification
              </button>
            </div>
          </div>

          {/* Sensitivity Analysis */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('sensitivity')}>
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sensitivity Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">
                Advanced sensitivity analysis to understand which variables impact your financial goals the most.
              </p>
              <div className="text-left space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Tornado diagrams (one-way)</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Heat maps (two-way)</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">Threshold & break-even analysis</span>
                </div>
              </div>
              <button className="w-full btn-primary">
                Analyze Sensitivity
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
