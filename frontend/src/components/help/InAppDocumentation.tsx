/**
 * In-App Documentation Viewer Component
 *
 * Displays documentation and tutorials within the application
 */

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface InAppDocumentationProps {
  docPath: string;
  onClose: () => void;
}

// Documentation content mapping
const DOCS_CONTENT: Record<string, { title: string; content: string }> = {
  'quick-start': {
    title: 'Quick Start Guide',
    content: `
# Quick Start Guide

Get up and running with WealthNavigator AI in just 5 minutes!

## Step 1: Create Your First Goal (2 minutes)

Simply tell the AI what you want:

> "I want to retire at age 65 with $80,000 per year in retirement income."

The AI will ask clarifying questions:
- Current age?
- Current savings?
- Monthly contribution amount?
- Risk tolerance?

## Step 2: Get Your Portfolio Recommendation (1 minute)

The AI will automatically:
1. Analyze your profile
2. Recommend optimal allocation
3. Show efficient frontier

Example recommendation:
- 70% Stocks (US & International)
- 25% Bonds
- 5% Cash

## Step 3: Run Monte Carlo Simulation (1 minute)

Instead of one projection, we run **5,000 different scenarios**:

**Success Probability: 87%**
- ✅ In 87% of scenarios, you reach your goal
- ❌ In 13% of scenarios, you fall short

## Next Steps

- Add more goals (education, home purchase)
- Connect bank accounts
- Set up budget tracking
- Explore tax strategies
    `,
  },
  'faq': {
    title: 'Frequently Asked Questions',
    content: `
# Frequently Asked Questions

## Security & Privacy

### Is my financial data secure?
**Yes.** We use bank-level security:
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **OAuth**: We never see your bank passwords
- **Multi-factor auth**: Optional 2FA available

### Do you sell my data?
**No, never.** We do not sell, rent, or share your personal financial data.

## Financial Planning

### How accurate are the projections?
Projections are **estimates** based on:
- Historical market data
- Your inputs
- Industry-standard assumptions

**Important:** Past performance doesn't guarantee future results.

### What is Monte Carlo simulation?
Instead of showing one projection, we run **5,000 different scenarios** to calculate realistic success probabilities.

**Example:**
- Success probability: 85%
- Means: In 85 out of 100 scenarios, you reach your goal

### Why is my success probability low?
Common reasons:
1. **Aggressive goal**: Wanting too much too soon
2. **Insufficient savings**: Not enough monthly contributions
3. **Short timeline**: Not enough time for growth
4. **Conservative allocation**: Lower risk = lower returns

**Solutions**: Increase savings, extend timeline, or adjust goal.

## Goals & Planning

### How many goals can I create?
**Unlimited** during beta. We recommend starting with 1-3 primary goals:
- Retirement (essential)
- Education (if applicable)
- Emergency fund (recommended)

### What if my goals compete for resources?
The AI will help you:
1. **Prioritize**: Essential > Important > Aspirational
2. **Trade off**: "Fund retirement at 90%, education at 75%"
3. **Adjust**: Lower one goal to fully fund another

## Portfolios & Investments

### Do you execute trades?
**No.** We provide **recommendations only**. You execute trades with your broker.

### How often should I rebalance?
**Recommendation**: Every 6-12 months, or when allocation drifts >5% from target.
    `,
  },
};

export const InAppDocumentation: React.FC<InAppDocumentationProps> = ({
  docPath,
  onClose,
}) => {
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load documentation content
    setLoading(true);

    // Simulate async load (in real app, this would fetch from API or files)
    setTimeout(() => {
      const doc = DOCS_CONTENT[docPath];
      if (doc) {
        setContent(doc);
      } else {
        setContent({
          title: 'Documentation Not Found',
          content: `# Documentation Not Found\n\nThe requested documentation page "${docPath}" could not be found.`,
        });
      }
      setLoading(false);
    }, 300);
  }, [docPath]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{content?.title || 'Loading...'}</h2>
            <p className="text-blue-100 text-sm mt-1">WealthNavigator AI Help</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            aria-label="Close documentation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="prose prose-blue max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-gray-900 mb-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2" {...props} />,
                  p: ({ node, ...props }) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                  li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4 bg-blue-50 py-2" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-blue-600" {...props} />
                    ) : (
                      <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                    ),
                  strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                }}
              >
                {content?.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Need more help? <a href="mailto:support@wealthnavigator.ai" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default InAppDocumentation;
