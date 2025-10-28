/**
 * Main App Component
 * Root component with layout structure
 */

import { useState } from 'react';
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900">WealthNavigator AI</h2>
          <p className="text-sm text-gray-600 mt-1">Financial Planning Assistant</p>
        </div>

        <nav className="mt-6">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Conversations
            </h3>
          </div>
          <div className="mt-2 space-y-1 px-2">
            <button className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-gray-900">New Conversation</span>
                <span className="text-gray-400 text-xs">+</span>
              </div>
            </button>
          </div>

          <div className="mt-6 px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recent
            </h3>
          </div>
          <div className="mt-2 space-y-1 px-2">
            <div className="px-3 py-2 text-sm text-gray-500">
              No conversations yet
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
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
              <button className="btn-primary text-lg px-8 py-3">
                Start Planning
              </button>
              <p className="mt-3 text-sm text-gray-500">
                Begin your conversation with our AI financial planning assistant
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
