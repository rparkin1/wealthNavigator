/**
 * Tornado Diagram Component
 *
 * Visualizes one-way sensitivity analysis results showing which variables
 * have the greatest impact on goal success probability.
 *
 * Features:
 * - D3.js-powered horizontal bar chart
 * - Sorted by impact magnitude (tornado shape)
 * - Color-coded by impact severity
 * - Interactive tooltips with detailed information
 * - Responsive design
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type {
  VariableImpact,
  OneWaySensitivityResult,
} from '../../types/sensitivityAnalysis';
import {
  formatVariableName,
  formatVariableValue,
  getImpactSeverity,
  getSeverityColor,
} from '../../services/sensitivityAnalysisApi';

interface TornadoDiagramProps {
  data: OneWaySensitivityResult;
  width?: number;
  height?: number;
  onVariableClick?: (variable: string) => void;
}

export const TornadoDiagram: React.FC<TornadoDiagramProps> = ({
  data,
  width = 800,
  height = 500,
  onVariableClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });

  useEffect(() => {
    if (!svgRef.current || !data.analysis.variable_impacts.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 120, bottom: 60, left: 180 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const impacts = data.analysis.variable_impacts;
    const baseline = data.analysis.base_success_probability;

    // Y scale for variables
    const y = d3
      .scaleBand()
      .domain(impacts.map(d => d.variable))
      .range([0, chartHeight])
      .padding(0.2);

    // X scale for probability
    const minProb = Math.min(...impacts.map(d => d.min_probability));
    const maxProb = Math.max(...impacts.map(d => d.max_probability));
    const xPadding = (maxProb - minProb) * 0.1;

    const x = d3
      .scaleLinear()
      .domain([minProb - xPadding, maxProb + xPadding])
      .range([0, chartWidth]);

    // Draw baseline line
    g.append('line')
      .attr('x1', x(baseline))
      .attr('x2', x(baseline))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7);

    g.append('text')
      .attr('x', x(baseline))
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '12px')
      .text(`Baseline: ${(baseline * 100).toFixed(1)}%`);

    // Draw bars for each variable
    const bars = g
      .selectAll('.tornado-bar')
      .data(impacts)
      .enter()
      .append('g')
      .attr('class', 'tornado-bar')
      .style('cursor', onVariableClick ? 'pointer' : 'default');

    // Left bar (below baseline)
    bars
      .append('rect')
      .attr('x', (d) => x(Math.min(d.min_probability, baseline)))
      .attr('y', (d) => y(d.variable) || 0)
      .attr('width', (d) => Math.abs(x(d.min_probability) - x(baseline)))
      .attr('height', y.bandwidth())
      .attr('fill', (d) => {
        const severity = getImpactSeverity(d.impact_range);
        return severity === 'critical' || severity === 'high'
          ? '#ef4444'
          : '#f97316';
      })
      .attr('opacity', 0.7)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 1);
        showTooltip(event, d, 'min');
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.7);
        hideTooltip();
      })
      .on('click', (event, d) => {
        if (onVariableClick) onVariableClick(d.variable);
      });

    // Right bar (above baseline)
    bars
      .append('rect')
      .attr('x', (d) => x(Math.min(baseline, d.max_probability)))
      .attr('y', (d) => y(d.variable) || 0)
      .attr('width', (d) => Math.abs(x(d.max_probability) - x(baseline)))
      .attr('height', y.bandwidth())
      .attr('fill', (d) => {
        const severity = getImpactSeverity(d.impact_range);
        return severity === 'critical' || severity === 'high'
          ? '#10b981'
          : '#3b82f6';
      })
      .attr('opacity', 0.7)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 1);
        showTooltip(event, d, 'max');
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.7);
        hideTooltip();
      })
      .on('click', (event, d) => {
        if (onVariableClick) onVariableClick(d.variable);
      });

    // Add impact range labels
    bars
      .append('text')
      .attr('x', chartWidth + 10)
      .attr('y', (d) => (y(d.variable) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('fill', (d) => getSeverityColor(getImpactSeverity(d.impact_range)))
      .attr('font-weight', 'bold')
      .text((d) => `±${(d.impact_range * 100).toFixed(1)}%`);

    // Y axis with variable labels
    g.append('g')
      .call(d3.axisLeft(y).tickFormat(formatVariableName))
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#374151');

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(10)
          .tickFormat((d) => `${(Number(d) * 100).toFixed(0)}%`)
      )
      .selectAll('text')
      .attr('font-size', '11px');

    // X axis label
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('fill', '#374151')
      .text('Success Probability');

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#111827')
      .text('Sensitivity Analysis: Tornado Diagram');

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);

    const legendData = [
      { label: 'Decrease', color: '#ef4444' },
      { label: 'Increase', color: '#10b981' },
    ];

    legend
      .selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .each(function (d) {
        const item = d3.select(this);
        item
          .append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', d.color)
          .attr('opacity', 0.7);
        item
          .append('text')
          .attr('x', 20)
          .attr('y', 12)
          .attr('font-size', '11px')
          .attr('fill', '#374151')
          .text(d.label);
      });

    function showTooltip(event: any, d: VariableImpact, type: 'min' | 'max') {
      const prob = type === 'min' ? d.min_probability : d.max_probability;
      const value = type === 'min' ? d.min_value : d.max_value;
      const change = ((prob - baseline) / baseline) * 100;

      setTooltip({
        visible: true,
        x: event.pageX,
        y: event.pageY,
        content: `
          <div style="font-weight: bold; margin-bottom: 8px;">
            ${formatVariableName(d.variable)}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>${type === 'min' ? 'Minimum' : 'Maximum'} Value:</strong><br/>
            ${formatVariableValue(d.variable, value)}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Success Probability:</strong><br/>
            ${(prob * 100).toFixed(1)}% (${change >= 0 ? '+' : ''}${change.toFixed(1)}%)
          </div>
          <div>
            <strong>Impact Range:</strong> ${(d.impact_range * 100).toFixed(1)}%
          </div>
        `,
      });
    }

    function hideTooltip() {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
    }
  }, [data, width, height, onVariableClick]);

  return (
    <div className="relative">
      <svg ref={svgRef} />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 10}px`,
            maxWidth: '300px',
            fontSize: '12px',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Summary Statistics */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Analysis Summary
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Variables Analyzed:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.analysis.variable_impacts.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Baseline Probability:</span>
            <span className="ml-2 font-medium text-gray-900">
              {(data.analysis.base_success_probability * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Highest Impact:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formatVariableName(data.analysis.variable_impacts[0]?.variable || '')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Impact Range:</span>
            <span className="ml-2 font-medium text-gray-900">
              ±{((data.analysis.variable_impacts[0]?.impact_range || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TornadoDiagram;
