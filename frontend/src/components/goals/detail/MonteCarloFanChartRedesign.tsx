/**
 * MonteCarloFanChartRedesign Component
 *
 * Enhanced D3.js-based fan chart following UI redesign specifications.
 * Responsive design with mobile-optimized layout and touch interactions.
 *
 * Following UI Redesign specifications - Week 8
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface PortfolioProjection {
  year: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
}

interface MonteCarloFanChartRedesignProps {
  projections: PortfolioProjection[];
  goalAmount?: number;
  width?: number;
  height?: number;
}

export function MonteCarloFanChartRedesign({
  projections,
  goalAmount,
  width = 800,
  height = 400,
}: MonteCarloFanChartRedesignProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width: containerWidth } = entries[0].contentRect;
      // Maintain aspect ratio for mobile
      const isMobile = containerWidth < 640;
      setDimensions({
        width: containerWidth,
        height: isMobile ? containerWidth * 0.75 : Math.min(height, containerWidth * 0.5),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height]);

  useEffect(() => {
    if (!svgRef.current || !projections || projections.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 60, left: 60 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('class', 'font-sans');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(projections, (d) => d.year) || 30])
      .range([0, innerWidth]);

    const yMax = Math.max(d3.max(projections, (d) => d.p90) || 0, goalAmount || 0);
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .range([innerHeight, 0]);

    // Area generators for percentile bands
    const area90to75 = d3
      .area<PortfolioProjection>()
      .x((d) => xScale(d.year))
      .y0((d) => yScale(d.p75))
      .y1((d) => yScale(d.p90))
      .curve(d3.curveMonotoneX);

    const area75to50 = d3
      .area<PortfolioProjection>()
      .x((d) => xScale(d.year))
      .y0((d) => yScale(d.median))
      .y1((d) => yScale(d.p75))
      .curve(d3.curveMonotoneX);

    const area50to25 = d3
      .area<PortfolioProjection>()
      .x((d) => xScale(d.year))
      .y0((d) => yScale(d.p25))
      .y1((d) => yScale(d.median))
      .curve(d3.curveMonotoneX);

    const area25to10 = d3
      .area<PortfolioProjection>()
      .x((d) => xScale(d.year))
      .y0((d) => yScale(d.p10))
      .y1((d) => yScale(d.p25))
      .curve(d3.curveMonotoneX);

    // Draw percentile bands (using design system colors)
    g.append('path')
      .datum(projections)
      .attr('d', area90to75)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.1);

    g.append('path')
      .datum(projections)
      .attr('d', area75to50)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.2);

    g.append('path')
      .datum(projections)
      .attr('d', area50to25)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.2);

    g.append('path')
      .datum(projections)
      .attr('d', area25to10)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.1);

    // Draw median line
    const medianLine = d3
      .line<PortfolioProjection>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.median))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(projections)
      .attr('d', medianLine)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3);

    // Draw goal line if provided
    if (goalAmount) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(goalAmount))
        .attr('y2', yScale(goalAmount))
        .attr('stroke', '#16a34a')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,4');

      // Goal label
      g.append('text')
        .attr('x', innerWidth + 5)
        .attr('y', yScale(goalAmount))
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#16a34a')
        .text('Goal');
    }

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // X-axis
    const xAxis = d3.axisBottom(xScale).ticks(Math.min(10, innerWidth / 80));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((g) => g.select('.domain').attr('stroke', '#e5e7eb'))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280');

    // Y-axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => {
        const value = Number(d);
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value}`;
      });

    g.append('g')
      .call(yAxis)
      .call((g) => g.select('.domain').attr('stroke', '#e5e7eb'))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280');

    // Axis labels
    svg
      .append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', dimensions.height - 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#6b7280')
      .text('Years');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -dimensions.height / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#6b7280')
      .text('Portfolio Value');

    // Interactive tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'monte-carlo-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(17, 24, 39, 0.95)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('box-shadow', '0 10px 15px -3px rgba(0, 0, 0, 0.1)');

    // Overlay for mouse events
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function (event) {
        const [xPos] = d3.pointer(event);
        const year = Math.round(xScale.invert(xPos));
        const data = projections.find((d) => d.year === year);

        if (data) {
          tooltip
            .style('visibility', 'visible')
            .html(
              `
              <div style="font-weight: 600; margin-bottom: 8px;">Year ${data.year}</div>
              <div style="display: grid; grid-template-columns: auto auto; gap: 8px; font-size: 11px;">
                <div style="color: #93c5fd;">90th %:</div><div style="text-align: right; font-family: monospace;">${formatCurrency(
                  data.p90
                )}</div>
                <div style="color: #93c5fd;">75th %:</div><div style="text-align: right; font-family: monospace;">${formatCurrency(
                  data.p75
                )}</div>
                <div style="color: #60a5fa; font-weight: 600;">Median:</div><div style="text-align: right; font-family: monospace; font-weight: 600;">${formatCurrency(
                  data.median
                )}</div>
                <div style="color: #93c5fd;">25th %:</div><div style="text-align: right; font-family: monospace;">${formatCurrency(
                  data.p25
                )}</div>
                <div style="color: #93c5fd;">10th %:</div><div style="text-align: right; font-family: monospace;">${formatCurrency(
                  data.p10
                )}</div>
              </div>
            `
            )
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 15}px`);
        }
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });

    return () => {
      tooltip.remove();
    };
  }, [projections, goalAmount, dimensions]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full" />

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
          <span>10th-90th percentile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded" />
          <span>25th-75th percentile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-primary-600 rounded" />
          <span className="font-medium">Median</span>
        </div>
        {goalAmount && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-success-600 rounded" style={{ borderTop: '2px dashed' }} />
            <span className="font-medium text-success-700">Target</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format currency for tooltip
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}
