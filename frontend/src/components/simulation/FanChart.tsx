/**
 * FanChart Component
 *
 * D3.js-based fan chart for visualizing Monte Carlo simulation results.
 * Shows portfolio value projections over time with percentile bands.
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PortfolioProjection {
  year: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
}

interface FanChartProps {
  projections: PortfolioProjection[];
  goalAmount?: number;
  title?: string;
  width?: number;
  height?: number;
}

export function FanChart({
  projections,
  goalAmount,
  title = 'Portfolio Projections',
  width = 800,
  height = 500
}: FanChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !projections || projections.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 120, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(projections, d => d.year) || 30])
      .range([0, innerWidth]);

    const yMax = Math.max(
      d3.max(projections, d => d.p90) || 0,
      goalAmount || 0
    );
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([innerHeight, 0]);

    // Area generators for percentile bands
    const area90to75 = d3.area<PortfolioProjection>()
      .x(d => xScale(d.year))
      .y0(d => yScale(d.p75))
      .y1(d => yScale(d.p90))
      .curve(d3.curveMonotoneX);

    const area75to50 = d3.area<PortfolioProjection>()
      .x(d => xScale(d.year))
      .y0(d => yScale(d.median))
      .y1(d => yScale(d.p75))
      .curve(d3.curveMonotoneX);

    const area50to25 = d3.area<PortfolioProjection>()
      .x(d => xScale(d.year))
      .y0(d => yScale(d.p25))
      .y1(d => yScale(d.median))
      .curve(d3.curveMonotoneX);

    const area25to10 = d3.area<PortfolioProjection>()
      .x(d => xScale(d.year))
      .y0(d => yScale(d.p10))
      .y1(d => yScale(d.p25))
      .curve(d3.curveMonotoneX);

    // Draw percentile bands (darkest to lightest from center)
    g.append('path')
      .datum(projections)
      .attr('class', 'area-90-75')
      .attr('d', area90to75)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.15);

    g.append('path')
      .datum(projections)
      .attr('class', 'area-75-50')
      .attr('d', area75to50)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.25);

    g.append('path')
      .datum(projections)
      .attr('class', 'area-50-25')
      .attr('d', area50to25)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.25);

    g.append('path')
      .datum(projections)
      .attr('class', 'area-25-10')
      .attr('d', area25to10)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.15);

    // Draw median line
    const medianLine = d3.line<PortfolioProjection>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.median))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(projections)
      .attr('class', 'median-line')
      .attr('d', medianLine)
      .attr('fill', 'none')
      .attr('stroke', '#1e40af')
      .attr('stroke-width', 2.5);

    // Draw goal line if provided
    if (goalAmount) {
      g.append('line')
        .attr('class', 'goal-line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(goalAmount))
        .attr('y2', yScale(goalAmount))
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      g.append('text')
        .attr('class', 'goal-label')
        .attr('x', innerWidth + 5)
        .attr('y', yScale(goalAmount))
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('fill', '#10b981')
        .text('Goal');
    }

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => `Year ${d}`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '11px');

    // Y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(8)
      .tickFormat(d => `$${(Number(d) / 1000).toFixed(0)}k`);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '11px');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .ticks(8)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      );

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .attr('fill', '#111827')
      .text(title);

    // X-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text('Time Horizon (Years)');

    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text('Portfolio Value');

    // Legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);

    const legendData = [
      { label: '90th percentile', opacity: 0.15 },
      { label: '75th percentile', opacity: 0.25 },
      { label: 'Median (50th)', opacity: 1, stroke: true },
      { label: '25th percentile', opacity: 0.25 },
      { label: '10th percentile', opacity: 0.15 }
    ];

    legendData.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      if (item.stroke) {
        legendRow.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 8)
          .attr('y2', 8)
          .attr('stroke', '#1e40af')
          .attr('stroke-width', 2.5);
      } else {
        legendRow.append('rect')
          .attr('width', 20)
          .attr('height', 16)
          .attr('fill', '#3b82f6')
          .attr('fill-opacity', item.opacity);
      }

      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 8)
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('fill', '#374151')
        .text(item.label);
    });

  }, [projections, goalAmount, title, width, height]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="mx-auto" />
    </div>
  );
}
