/**
 * Code Splitting Utilities
 * Provides lazy loading with error boundaries and loading states
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  delay?: number;
}

/**
 * Loading spinner component
 */
const DefaultLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Error fallback component
 */
const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-red-600 mb-2">
        Failed to load component
      </h3>
      {error && (
        <p className="text-sm text-gray-600">{error.message}</p>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reload Page
      </button>
    </div>
  </div>
);

/**
 * Error boundary for lazy loaded components
 */
class LazyLoadErrorBoundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Enhanced lazy loading with error handling and loading states
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const {
    fallback = <DefaultLoader />,
    errorFallback = <DefaultErrorFallback />,
    delay = 0,
  } = options;

  // Add artificial delay if specified (useful for testing)
  const delayedImport = delay > 0
    ? () => new Promise<{ default: T }>(resolve => {
        setTimeout(() => importFunc().then(resolve), delay);
      })
    : importFunc;

  const LazyComponent = React.lazy(delayedImport);

  // Return wrapped component with error boundary and suspense
  return ((props: any) => (
    <LazyLoadErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  )) as any;
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFunc: () => Promise<{ default: any }>) {
  importFunc().catch(err => {
    console.error('Failed to preload component:', err);
  });
}

/**
 * Route-based code splitting helper
 */
export const routes = {
  // Dashboard routes
  Dashboard: lazyLoad(() => import('../components/dashboard/Dashboard')),

  // Goal routes
  GoalsDashboard: lazyLoad(() => import('../components/goals/GoalsDashboard')),
  AIGoalAssistant: lazyLoad(() => import('../components/goals/AIGoalAssistant')),
  GoalDependencyGraph: lazyLoad(() => import('../components/goals/GoalDependencyGraph')),
  MilestoneManager: lazyLoad(() => import('../components/goals/MilestoneManager')),

  // Portfolio routes
  PortfolioView: lazyLoad(() => import('../components/portfolio/PortfolioView')),
  PortfolioOptimizationDashboard: lazyLoad(() =>
    import('../components/portfolio/PortfolioOptimizationDashboard')
  ),
  MultiGoalOptimizationDashboard: lazyLoad(() =>
    import('../components/portfolio/MultiGoalOptimizationDashboard')
  ),

  // Risk routes
  RiskDashboard: lazyLoad(() => import('../components/risk/RiskDashboard')),
  DiversificationAnalysisDashboard: lazyLoad(() =>
    import('../components/risk/DiversificationAnalysisDashboard')
  ),
  HedgingStrategyDashboard: lazyLoad(() =>
    import('../components/hedging/HedgingStrategyDashboard')
  ),
  ReserveMonitoringDashboard: lazyLoad(() =>
    import('../components/risk/ReserveMonitoringDashboard')
  ),

  // Simulation routes
  MonteCarloSimulation: lazyLoad(() =>
    import('../components/simulation/MonteCarloSimulation')
  ),
  ScenarioCreationWizard: lazyLoad(() =>
    import('../components/simulation/ScenarioCreationWizard')
  ),
  LifeEventPlanner: lazyLoad(() =>
    import('../components/lifeEvents/LifeEventPlanner')
  ),

  // Retirement routes
  RetirementDashboard: lazyLoad(() =>
    import('../components/retirement/RetirementDashboard')
  ),

  // Education routes
  EducationFundingDashboard: lazyLoad(() =>
    import('../components/education/EducationFundingDashboard')
  ),

  // Tax routes
  TaxDashboard: lazyLoad(() => import('../components/tax/TaxDashboard')),
  TaxLossHarvestingDashboard: lazyLoad(() =>
    import('../components/tax/TaxLossHarvestingDashboard')
  ),

  // Budget routes
  BudgetDashboard: lazyLoad(() => import('../components/budget/BudgetDashboard')),

  // Plaid routes
  PlaidDashboard: lazyLoad(() => import('../components/plaid/PlaidDashboard')),

  // Estate Planning routes
  EstatePlanningDashboard: lazyLoad(() =>
    import('../components/estatePlanning/EstatePlanningDashboard')
  ),

  // Insurance routes
  InsuranceOptimizationDashboard: lazyLoad(() =>
    import('../components/insurance/InsuranceOptimizationDashboard')
  ),

  // Sensitivity Analysis routes
  SensitivityAnalysisDashboard: lazyLoad(() =>
    import('../components/sensitivity/SensitivityAnalysisDashboard')
  ),

  // Reports routes
  CustomReportsDashboard: lazyLoad(() =>
    import('../components/reports/CustomReportsDashboard')
  ),
};

/**
 * Preload critical routes
 */
export function preloadCriticalRoutes() {
  // Preload most commonly accessed routes
  preloadComponent(() => import('../components/dashboard/Dashboard'));
  preloadComponent(() => import('../components/goals/GoalsDashboard'));
  preloadComponent(() => import('../components/portfolio/PortfolioView'));
}

export default lazyLoad;
