/**
 * LifeEventImpactComparison Component
 *
 * Side-by-side comparison of goal outcomes with and without a life event.
 * Shows baseline vs. event scenario with detailed metrics and visualizations.
 */

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { LifeEvent } from './types';

export interface LifeEventImpactComparisonProps {
  event: LifeEvent;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  minimal: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  significant: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  severe: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function LifeEventImpactComparison({ event, onClose }: LifeEventImpactComparisonProps) {
  const chartRef = useRef<SVGSVGElement>(null);

  const results = event.simulation_results;
  if (!results) return null;

  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Data
    const data = [
      {
        scenario: 'Baseline',
        probability: results.baseline.success_probability,
        value: results.baseline.median_portfolio_value,
        color: '#10b981',
      },
      {
        scenario: 'With Event',
        probability: results.with_event.success_probability,
        value: results.with_event.median_portfolio_value,
        color: '#ef4444',
      },
    ];

    // X scale
    const x = d3
      .scaleBand()
      .domain(data.map(d => d.scenario))
      .range([0, innerWidth])
      .padding(0.3);

    // Y scale (probability)
    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    // Draw bars
    data.forEach(d => {
      const barWidth = x.bandwidth();
      const barX = x(d.scenario) || 0;

      // Probability bar
      g.append('rect')
        .attr('x', barX)
        .attr('y', y(d.probability))
        .attr('width', barWidth)
        .attr('height', innerHeight - y(d.probability))
        .attr('fill', d.color)
        .attr('opacity', 0.7)
        .attr('rx', 4);

      // Value label
      g.append('text')
        .attr('x', barX + barWidth / 2)
        .attr('y', y(d.probability) - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#111827')
        .text(`${(d.probability * 100).toFixed(1)}%`);

      // Scenario label
      g.append('text')
        .attr('x', barX + barWidth / 2)
        .attr('y', innerHeight + 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#6b7280')
        .text(d.scenario);
    });

    // Y axis
    const yAxis = d3.axisLeft(y).tickFormat(d => `${(d as number * 100).toFixed(0)}%`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px');

    // Axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Success Probability');

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#111827')
      .text('Impact on Goal Success');

  }, [results]);

  const severity = results.impact.severity;
  const severityStyle = SEVERITY_COLORS[severity] || SEVERITY_COLORS.moderate;

  const probDelta = results.impact.success_probability_delta;
  const valueDelta = results.impact.portfolio_value_delta;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Life Event Impact Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">{event.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Severity Badge */}
          <div className={`p-4 rounded-lg border ${severityStyle.bg} ${severityStyle.border}`}>
            <div className="flex items-center gap-3">
              <div className={`text-2xl ${severityStyle.text}`}>
                {severity === 'minimal' && '✓'}
                {severity === 'moderate' && '⚠'}
                {severity === 'significant' && '⚠'}
                {severity === 'severe' && '⚠'}
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${severityStyle.text} uppercase`}>
                  {severity} Impact
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  This event has a {severity} impact on your goal success probability
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <svg ref={chartRef}></svg>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 gap-6">
            {/* Baseline */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-3">Without Event (Baseline)</h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-green-700">Success Probability</div>
                  <div className="text-2xl font-bold text-green-900">
                    {(results.baseline.success_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-700">Median Portfolio Value</div>
                  <div className="text-lg font-semibold text-green-900">
                    ${(results.baseline.median_portfolio_value / 1000).toFixed(0)}k
                  </div>
                </div>
              </div>
            </div>

            {/* With Event */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="text-sm font-semibold text-red-900 mb-3">With Event</h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-red-700">Success Probability</div>
                  <div className="text-2xl font-bold text-red-900">
                    {(results.with_event.success_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-red-600 font-medium">
                    {probDelta > 0 ? '+' : ''}{(probDelta * 100).toFixed(1)}% vs. baseline
                  </div>
                </div>
                <div>
                  <div className="text-xs text-red-700">Median Portfolio Value</div>
                  <div className="text-lg font-semibold text-red-900">
                    ${(results.with_event.median_portfolio_value / 1000).toFixed(0)}k
                  </div>
                  <div className="text-xs text-red-600 font-medium">
                    {valueDelta > 0 ? '+' : ''}${(valueDelta / 1000).toFixed(0)}k vs. baseline
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Analysis */}
          {results.recovery_analysis && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Recovery Analysis</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-blue-700">Value to Recover</div>
                  <div className="text-lg font-semibold text-blue-900">
                    ${(results.recovery_analysis.value_to_recover / 1000).toFixed(0)}k
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Estimated Recovery Time</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {results.recovery_analysis.estimated_recovery_years.toFixed(1)} years
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Recovery Feasible?</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {results.recovery_analysis.recovery_feasible ? 'Yes ✓' : 'No ✗'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {results.impact.recommended_actions.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-900 mb-3">Recommended Actions</h4>
              <ul className="space-y-2">
                {results.impact.recommended_actions.map((action, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-purple-900">
                    <span className="text-purple-600 font-bold">{idx + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
            <p className="text-sm text-gray-700">
              {event.name} would reduce your goal success probability by{' '}
              <strong>{Math.abs(probDelta * 100).toFixed(1)}%</strong> (from{' '}
              {(results.baseline.success_probability * 100).toFixed(1)}% to{' '}
              {(results.with_event.success_probability * 100).toFixed(1)}%) and decrease your
              median portfolio value by{' '}
              <strong>${Math.abs(valueDelta / 1000).toFixed(0)}k</strong>.
              {results.recovery_analysis?.recovery_feasible && (
                <> Recovery is estimated to take approximately{' '}
                <strong>{results.recovery_analysis.estimated_recovery_years.toFixed(1)} years</strong>
                .</>
              )}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
