/**
 * Two-Way Sensitivity Heatmap Component
 *
 * Visualizes the interaction between two variables using a heat map showing
 * success probability across a grid of variable combinations.
 *
 * Features:
 * - D3.js-powered heat map visualization
 * - Color gradient showing probability levels
 * - Interactive cells with detailed tooltips
 * - Axis labels with formatted values
 * - Current position indicator
 * - Responsive design
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TwoWaySensitivityResult } from '../../types/sensitivityAnalysis';
import {
  formatVariableName,
  formatVariableValue,
} from '../../services/sensitivityAnalysisApi';

interface TwoWaySensitivityHeatmapProps {
  data: TwoWaySensitivityResult;
  width?: number;
  height?: number;
  onCellClick?: (value1: number, value2: number, probability: number) => void;
}

export const TwoWaySensitivityHeatmap: React.FC<TwoWaySensitivityHeatmapProps> = ({
  data,
  width = 800,
  height = 600,
  onCellClick,
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
    if (!svgRef.current || !data.analysis.probability_grid.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 60, right: 140, bottom: 80, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const { variable1, variable2, test_values1, test_values2, probability_grid, min_probability, max_probability } =
      data.analysis;

    const gridSize = test_values1.length;
    const cellWidth = chartWidth / gridSize;
    const cellHeight = chartHeight / gridSize;

    // Color scale from red (low) to yellow (medium) to green (high)
    const colorScale = d3
      .scaleSequential()
      .domain([min_probability, max_probability])
      .interpolator(d3.interpolateRdYlGn);

    // Draw cells
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const probability = probability_grid[i][j];
        const value1 = test_values1[i];
        const value2 = test_values2[j];

        g.append('rect')
          .attr('x', i * cellWidth)
          .attr('y', (gridSize - 1 - j) * cellHeight) // Invert Y axis
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', colorScale(probability))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', onCellClick ? 'pointer' : 'default')
          .on('mouseover', function (event) {
            d3.select(this).attr('stroke-width', 3).attr('stroke', '#000');
            showTooltip(event, value1, value2, probability);
          })
          .on('mouseout', function () {
            d3.select(this).attr('stroke-width', 1).attr('stroke', '#fff');
            hideTooltip();
          })
          .on('click', () => {
            if (onCellClick) onCellClick(value1, value2, probability);
          });
      }
    }

    // X axis
    const xScale = d3
      .scaleLinear()
      .domain([test_values1[0], test_values1[test_values1.length - 1]])
      .range([0, chartWidth]);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => formatVariableValue(variable1, Number(d)))
      )
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

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
    const yScale = d3
      .scaleLinear()
      .domain([test_values2[0], test_values2[test_values2.length - 1]])
      .range([chartHeight, 0]);

    g.append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => formatVariableValue(variable2, Number(d)))
      )
      .selectAll('text')
      .attr('font-size', '11px');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -80)
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
      .text('Two-Way Sensitivity Analysis: Heat Map');

    // Color legend
    const legendWidth = 20;
    const legendHeight = 200;
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - margin.right + 30}, ${margin.top + (chartHeight - legendHeight) / 2})`);

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = min_probability + t * (max_probability - min_probability);
      gradient
        .append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(value));
    }

    // Draw legend rectangle
    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1);

    // Legend scale
    const legendScale = d3
      .scaleLinear()
      .domain([min_probability, max_probability])
      .range([legendHeight, 0]);

    legend
      .append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(
        d3
          .axisRight(legendScale)
          .ticks(5)
          .tickFormat((d) => `${(Number(d) * 100).toFixed(0)}%`)
      )
      .selectAll('text')
      .attr('font-size', '11px');

    // Legend title
    legend
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text('Success Probability');

    function showTooltip(
      event: any,
      value1: number,
      value2: number,
      probability: number
    ) {
      setTooltip({
        visible: true,
        x: event.pageX,
        y: event.pageY,
        content: `
          <div style="font-weight: bold; margin-bottom: 8px;">
            Variable Combination
          </div>
          <div style="margin-bottom: 4px;">
            <strong>${formatVariableName(variable1)}:</strong><br/>
            ${formatVariableValue(variable1, value1)}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>${formatVariableName(variable2)}:</strong><br/>
            ${formatVariableValue(variable2, value2)}
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <strong>Success Probability:</strong><br/>
            <span style="font-size: 16px; color: ${colorScale(probability)}; font-weight: bold;">
              ${(probability * 100).toFixed(1)}%
            </span>
          </div>
        `,
      });
    }

    function hideTooltip() {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
    }
  }, [data, width, height, onCellClick]);

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
            <span className="text-gray-600">Variable 1:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formatVariableName(data.analysis.variable1)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Variable 2:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formatVariableName(data.analysis.variable2)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Min Probability:</span>
            <span className="ml-2 font-medium text-gray-900">
              {(data.analysis.min_probability * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Max Probability:</span>
            <span className="ml-2 font-medium text-gray-900">
              {(data.analysis.max_probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Grid Resolution:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data.analysis.test_values1.length} × {data.analysis.test_values2.length} cells
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoWaySensitivityHeatmap;
