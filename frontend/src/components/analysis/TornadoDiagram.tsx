import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SensitivityVariable {
  name: string;
  lowValue: number;
  highValue: number;
  baseValue: number;
}

interface TornadoDiagramProps {
  variables?: SensitivityVariable[];
  width?: number;
  height?: number;
}

export function TornadoDiagram({ variables, width = 600, height = 400 }: TornadoDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!variables || !svgRef.current) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 40, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const sorted = [...variables].sort((a, b) => {
      const impactA = Math.max(Math.abs(a.lowValue - a.baseValue), Math.abs(a.highValue - a.baseValue));
      const impactB = Math.max(Math.abs(b.lowValue - b.baseValue), Math.abs(b.highValue - b.baseValue));
      return impactB - impactA;
    });

    const y = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, innerHeight]).padding(0.2);
    const allValues = sorted.flatMap(d => [d.lowValue, d.baseValue, d.highValue]);
    const x = d3.scaleLinear().domain([d3.min(allValues)!, d3.max(allValues)!]).range([0, innerWidth]);

    g.append('line').attr('x1', x(sorted[0].baseValue)).attr('x2', x(sorted[0].baseValue))
      .attr('y1', 0).attr('y2', innerHeight).attr('stroke', '#6b7280').attr('stroke-width', 2).attr('stroke-dasharray', '3,3');

    sorted.forEach(variable => {
      const yPos = y(variable.name)!;
      const barHeight = y.bandwidth();

      g.append('rect').attr('x', Math.min(x(variable.lowValue), x(variable.baseValue))).attr('y', yPos)
        .attr('width', Math.abs(x(variable.lowValue) - x(variable.baseValue))).attr('height', barHeight)
        .attr('fill', '#ef4444').attr('opacity', 0.7);

      g.append('rect').attr('x', Math.min(x(variable.highValue), x(variable.baseValue))).attr('y', yPos)
        .attr('width', Math.abs(x(variable.highValue) - x(variable.baseValue))).attr('height', barHeight)
        .attr('fill', '#10b981').attr('opacity', 0.7);

      g.append('text').attr('x', -5).attr('y', yPos + barHeight / 2).attr('dy', '0.35em')
        .attr('text-anchor', 'end').attr('font-size', '12px').text(variable.name);
    });

    g.append('g').attr('transform', 'translate(0,' + innerHeight + ')').call(d3.axisBottom(x).ticks(5));
  }, [variables, width, height]);

  const mockVariables: SensitivityVariable[] = variables || [
    { name: 'Stock Returns', lowValue: 60, highValue: 92, baseValue: 76 },
    { name: 'Monthly Contribution', lowValue: 68, highValue: 84, baseValue: 76 },
    { name: 'Retirement Age', lowValue: 70, highValue: 82, baseValue: 76 },
    { name: 'Inflation Rate', lowValue: 72, highValue: 80, baseValue: 76 },
    { name: 'Bond Returns', lowValue: 73, highValue: 79, baseValue: 76 },
    { name: 'Life Expectancy', lowValue: 74, highValue: 78, baseValue: 76 }
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Sensitivity Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">Impact of each variable on goal success probability</p>
      <svg ref={svgRef}></svg>
    </div>
  );
}
