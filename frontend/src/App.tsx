/**
 * Main App Component
 * Root component with layout structure and routing
 */

import { useState, Suspense, lazy } from 'react';
import './index.css';

// Lazy load components for better error isolation
const ChatInterface = lazy(() =>
  import('./components/conversation').then(m => ({ default: m.ChatInterface }))
);

// Re-enabling portfolio with type-only imports fix
const PortfolioView = lazy(() =>
  import('./components/portfolio/PortfolioView').then(m => ({ default: m.PortfolioView }))
);

type View = 'home' | 'chat' | 'goals' | 'portfolio';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Test user ID matching backend database - in production, get from auth
  const userId = 'test-user-123';

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return (
          <Suspense fallback={<LoadingView message="Loading chat interface..." />}>
            <ChatInterface userId={userId} />
          </Suspense>
        );
      case 'portfolio':
        return (
          <Suspense fallback={<LoadingView message="Loading portfolio..." />}>
            <PortfolioView userId={userId} />
          </Suspense>
        );
      case 'home':
      default:
        return <HomeView onStartChat={() => setCurrentView('chat')} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {(currentView === 'home' || currentView === 'goals' || currentView === 'portfolio') ? (
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
                Home
              </button>
              <button
                onClick={() => setCurrentView('chat')}
                className="w-full px-3 py-2 text-left text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
              >
                Chat
              </button>
              <button
                onClick={() => setCurrentView('goals')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'goals'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Goals
              </button>
              <button
                onClick={() => setCurrentView('portfolio')}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentView === 'portfolio'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Portfolio
              </button>
            </div>
          </nav>
        </aside>
        )
      ) : null}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {(currentView === 'home' || currentView === 'goals' || currentView === 'portfolio') && (
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
                <button className="btn-secondary">
                  Settings
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

function HomeView({ onStartChat }: { onStartChat: () => void }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Message */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to WealthNavigator AI
          </h2>
          <p className="text-gray-600 mb-4">
            Your intelligent financial planning assistant powered by AI.
          </p>
          <p className="text-sm text-gray-500">
            Start a conversation to begin planning for retirement, education, or other financial goals.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-primary-600 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Goal-Based Planning</h3>
            <p className="text-sm text-gray-600">
              Define and track your financial goals with AI-powered guidance.
            </p>
          </div>

          <div className="card">
            <div className="text-primary-600 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Portfolio Optimization</h3>
            <p className="text-sm text-gray-600">
              Build optimal portfolios based on Modern Portfolio Theory.
            </p>
          </div>

          <div className="card">
            <div className="text-primary-600 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Monte Carlo Simulation</h3>
            <p className="text-sm text-gray-600">
              Assess success probability with 5,000+ scenario simulations.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <button
            onClick={onStartChat}
            className="btn-primary text-lg px-8 py-3"
          >
            Start Planning
          </button>
          <p className="mt-3 text-sm text-gray-500">
            Begin your conversation with our AI financial planning assistant
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
