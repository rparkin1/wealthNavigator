import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DistributionData {
  values: number[];
  successThreshold?: number;
  percentiles?: { p10: number; p25: number; p50: number; p75: number; p90: number };
}

interface DistributionHistogramProps {
  data?: DistributionData;
  width?: number;
  height?: number;
}

export function DistributionHistogram({ data, width = 600, height = 300 }: DistributionHistogramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const x = d3.scaleLinear().domain([d3.min(data.values) || 0, d3.max(data.values) || 0]).range([0, innerWidth]);
    const histogram = d3.histogram().domain(x.domain() as [number, number]).thresholds(50);
    const bins = histogram(data.values);
    const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 0]).range([innerHeight, 0]);

    g.selectAll('rect').data(bins).join('rect')
      .attr('x', d => x(d.x0!))
      .attr('y', d => y(d.length))
      .attr('width', d => Math.max(0, x(d.x1!) - x(d.x0!) - 1))
      .attr('height', d => innerHeight - y(d.length))
      .attr('fill', d => (data.successThreshold && d.x0! >= data.successThreshold) ? '#10b981' : '#3b82f6')
      .attr('opacity', 0.7);

    if (data.successThreshold) {
      g.append('line').attr('x1', x(data.successThreshold)).attr('x2', x(data.successThreshold))
        .attr('y1', 0).attr('y2', innerHeight).attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
      g.append('text').attr('x', x(data.successThreshold) + 5).attr('y', 15).attr('fill', '#ef4444').attr('font-size', '12px').text('Goal');
    }

    g.append('g').attr('transform', 'translate(0,' + innerHeight + ')').call(d3.axisBottom(x).ticks(10));
    g.append('g').call(d3.axisLeft(y));
  }, [data, width, height]);

  const mockData: DistributionData = data || {
    values: Array.from({ length: 5000 }, () => Math.random() * 500000 + 800000 + (Math.random() - 0.5) * 200000),
    successThreshold: 1000000,
    percentiles: { p10: 850000, p25: 920000, p50: 1050000, p75: 1180000, p90: 1300000 }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Analysis</h3>
      <svg ref={svgRef}></svg>
      <div className="grid grid-cols-5 gap-2 text-xs mt-4">
        {Object.entries(mockData.percentiles || {}).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="font-semibold text-gray-700">{key.toUpperCase()}</div>
            <div className="text-gray-600">${(value / 1000).toFixed(0)}k</div>
          </div>
        ))}
      </div>
    </div>
  );
}
