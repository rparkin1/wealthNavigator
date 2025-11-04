/**
 * Break-Even Calculator Component
 *
 * Visualizes the break-even frontier between two variables showing
 * combinations that achieve the target success probability.
 *
 * Features:
 * - D3.js break-even curve visualization
 * - Current position indicator
 * - Safe/at-risk zone shading
 * - Delta analysis from break-even
 * - Interactive point selection
 * - Actionable recommendations
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { BreakEvenAnalysisResult } from '../../types/sensitivityAnalysis';
import {
  formatVariableName,
  formatVariableValue,
} from '../../services/sensitivityAnalysisApi';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface BreakEvenCalculatorProps {
  data: BreakEvenAnalysisResult;
  width?: number;
  height?: number;
  onPointClick?: (value1: number, value2: number) => void;
}

export const BreakEvenCalculator: React.FC<BreakEvenCalculatorProps> = ({
  data,
  width = 800,
  height = 500,
  onPointClick,
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
    if (!svgRef.current || !data.analysis.break_even_curve.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 60, right: 140, bottom: 80, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const {
      variable1,
      variable2,
      break_even_curve,
      current_value1,
      current_value2,
      target_probability,
      current_delta,
    } = data.analysis;

    // Extract values from break-even points
    const values1 = break_even_curve.map((p) => p[variable1]);
    const values2 = break_even_curve.map((p) => p[variable2]);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([d3.min(values1)! * 0.95, d3.max(values1)! * 1.05])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(values2)! * 0.95, d3.max(values2)! * 1.05])
      .range([chartHeight, 0]);

    // Define areas above and below curve
    const area = d3
      .area<{ [key: string]: number }>()
      .x((d) => xScale(d[variable1]))
      .y0(0)
      .y1((d) => yScale(d[variable2]))
      .curve(d3.curveMonotoneX);

    // Draw safe zone (above curve)
    g.append('path')
      .datum(break_even_curve)
      .attr('fill', '#d1fae5')
      .attr('fill-opacity', 0.3)
      .attr('d', area);

    // Draw at-risk zone (below curve)
    const atRiskArea = d3
      .area<{ [key: string]: number }>()
      .x((d) => xScale(d[variable1]))
      .y0((d) => yScale(d[variable2]))
      .y1(chartHeight)
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(break_even_curve)
      .attr('fill', '#fecaca')
      .attr('fill-opacity', 0.3)
      .attr('d', atRiskArea);

    // Draw break-even curve
    const line = d3
      .line<{ [key: string]: number }>()
      .x((d) => xScale(d[variable1]))
      .y((d) => yScale(d[variable2]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(break_even_curve)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Draw break-even points
    g.selectAll('.break-even-point')
      .data(break_even_curve)
      .enter()
      .append('circle')
      .attr('class', 'break-even-point')
      .attr('cx', (d) => xScale(d[variable1]))
      .attr('cy', (d) => yScale(d[variable2]))
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', onPointClick ? 'pointer' : 'default')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 6);
        showTooltip(event, d[variable1], d[variable2], true);
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 4);
        hideTooltip();
      })
      .on('click', (event, d) => {
        if (onPointClick) onPointClick(d[variable1], d[variable2]);
      });

    // Draw current position
    const currentX = xScale(current_value1);
    const currentY = yScale(current_value2);

    g.append('circle')
      .attr('cx', currentX)
      .attr('cy', currentY)
      .attr('r', 8)
      .attr('fill', current_delta.above_break_even ? '#10b981' : '#ef4444')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('mouseover', function (event) {
        d3.select(this).attr('r', 10);
        showTooltip(event, current_value1, current_value2, false);
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 8);
        hideTooltip();
      });

    // Add "Current" label
    g.append('text')
      .attr('x', currentX + 15)
      .attr('y', currentY - 5)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', current_delta.above_break_even ? '#10b981' : '#ef4444')
      .text('Current Position');

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickFormat((d) => formatVariableValue(variable1, Number(d)))
      )
      .selectAll('text')
      .attr('font-size', '11px');

    // X axis label
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 60)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('fill', '#111827')
      .text(formatVariableName(variable1));

    // Y axis
    g.append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(8)
          .tickFormat((d) => formatVariableValue(variable2, Number(d)))
      )
      .selectAll('text')
      .attr('font-size', '11px');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -70)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('fill', '#111827')
      .text(formatVariableName(variable2));

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#111827')
      .text(`Break-Even Analysis (${(target_probability * 100).toFixed(0)}% Target)`);

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);

    const legendData = [
      { label: 'Safe Zone', color: '#d1fae5', border: '#10b981' },
      { label: 'At Risk', color: '#fecaca', border: '#ef4444' },
      { label: 'Break-Even Curve', color: 'none', border: '#3b82f6' },
    ];

    legend
      .selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 30})`)
      .each(function (d) {
        const item = d3.select(this);
        item
          .append('rect')
          .attr('width', 20)
          .attr('height', 15)
          .attr('fill', d.color === 'none' ? 'transparent' : d.color)
          .attr('stroke', d.border)
          .attr('stroke-width', d.color === 'none' ? 3 : 1);
        item
          .append('text')
          .attr('x', 25)
          .attr('y', 12)
          .attr('font-size', '11px')
          .attr('fill', '#374151')
          .text(d.label);
      });

    function showTooltip(
      event: any,
      value1: number,
      value2: number,
      isBreakEven: boolean
    ) {
      setTooltip({
        visible: true,
        x: event.pageX,
        y: event.pageY,
        content: `
          <div style="font-weight: bold; margin-bottom: 8px;">
            ${isBreakEven ? 'Break-Even Point' : 'Current Position'}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>${formatVariableName(variable1)}:</strong><br/>
            ${formatVariableValue(variable1, value1)}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>${formatVariableName(variable2)}:</strong><br/>
            ${formatVariableValue(variable2, value2)}
          </div>
          ${
            isBreakEven
              ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                   Achieves ${(target_probability * 100).toFixed(0)}% success probability
                 </div>`
              : ''
          }
        `,
      });
    }

    function hideTooltip() {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
    }
  }, [data, width, height, onPointClick]);

  const { current_delta, variable1, variable2 } = data.analysis;

  return (
    <div className="space-y-6">
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

      {/* Status Card */}
      <div
        className={`rounded-lg p-4 border ${
          current_delta.above_break_even
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center mb-3">
          {current_delta.above_break_even ? (
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
          ) : (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
          )}
          <h4
            className={`text-lg font-semibold ${
              current_delta.above_break_even ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {current_delta.above_break_even
              ? 'Above Break-Even (Safe)'
              : 'Below Break-Even (At Risk)'}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span
              className={
                current_delta.above_break_even ? 'text-green-700' : 'text-red-700'
              }
            >
              Required {formatVariableName(variable2)}:
            </span>
            <div
              className={`text-lg font-bold mt-1 ${
                current_delta.above_break_even ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {formatVariableValue(variable2, current_delta.required_value)}
            </div>
          </div>
          <div>
            <span
              className={
                current_delta.above_break_even ? 'text-green-700' : 'text-red-700'
              }
            >
              Current {formatVariableName(variable2)}:
            </span>
            <div
              className={`text-lg font-bold mt-1 ${
                current_delta.above_break_even ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {formatVariableValue(variable2, current_delta.current_value)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-center">
            <span
              className={`text-sm font-medium ${
                current_delta.above_break_even ? 'text-green-700' : 'text-red-700'
              }`}
            >
              Delta from Break-Even:
            </span>
            <span
              className={`text-xl font-bold ${
                current_delta.above_break_even ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {current_delta.above_break_even ? '+' : ''}
              {formatVariableValue(variable2, current_delta.delta)}
              <span className="text-sm ml-2">
                ({current_delta.delta_percentage >= 0 ? '+' : ''}
                {current_delta.delta_percentage.toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">
          Recommendations
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          {!current_delta.above_break_even ? (
            <>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  Increase {formatVariableName(variable2).toLowerCase()} by{' '}
                  {Math.abs(current_delta.delta_percentage).toFixed(1)}% to reach
                  break-even.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  Alternatively, reduce {formatVariableName(variable1).toLowerCase()}{' '}
                  if feasible.
                </span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>
                  Current position is{' '}
                  {Math.abs(current_delta.delta_percentage).toFixed(1)}% above
                  break-even.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>
                  You have a safety margin to absorb unexpected changes in{' '}
                  {formatVariableName(variable1).toLowerCase()}.
                </span>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default BreakEvenCalculator;
