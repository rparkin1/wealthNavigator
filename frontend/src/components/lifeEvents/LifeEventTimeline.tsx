import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TimelineEvent {
  id: string;
  name: string;
  year: number;
  duration: number;
  type: string;
  enabled: boolean;
}

interface LifeEventTimelineProps {
  events: TimelineEvent[];
  currentYear?: number;
  width?: number;
  height?: number;
  onEventClick?: (id: string) => void;
}

export function LifeEventTimeline({ events, currentYear = 2025, width = 800, height = 200, onEventClick }: LifeEventTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 30, bottom: 40, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const allYears = events.flatMap(e => [e.year, e.year + e.duration]);
    const minYear = Math.min(currentYear, ...allYears);
    const maxYear = Math.max(currentYear + 30, ...allYears);

    const x = d3.scaleLinear().domain([minYear, maxYear]).range([0, innerWidth]);

    const eventTypes = Array.from(new Set(events.map(e => e.type)));
    const laneHeight = innerHeight / eventTypes.length;

    g.append('line').attr('x1', x(currentYear)).attr('x2', x(currentYear))
      .attr('y1', 0).attr('y2', innerHeight).attr('stroke', '#3b82f6').attr('stroke-width', 2);

    g.append('text').attr('x', x(currentYear)).attr('y', -10).attr('text-anchor', 'middle')
      .attr('fill', '#3b82f6').attr('font-weight', 'bold').text('Today');

    events.forEach((ev) => {
      const laneIndex = eventTypes.indexOf(ev.type);
      const yPos = laneIndex * laneHeight + laneHeight / 3;

      g.append('rect')
        .attr('x', x(ev.year))
        .attr('y', yPos)
        .attr('width', Math.max(5, x(ev.year + ev.duration) - x(ev.year)))
        .attr('height', laneHeight / 3)
        .attr('fill', ev.enabled ? '#10b981' : '#9ca3af')
        .attr('opacity', 0.7)
        .attr('rx', 3)
        .style('cursor', onEventClick ? 'pointer' : 'default')
        .on('click', () => onEventClick?.(ev.id));

      g.append('text')
        .attr('x', x(ev.year) + 5)
        .attr('y', yPos + laneHeight / 6)
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('fill', '#fff')
        .text(ev.name)
        .style('pointer-events', 'none');
    });

    g.append('g').attr('transform', 'translate(0,' + innerHeight + ')')
      .call(d3.axisBottom(x).ticks(10).tickFormat(d => String(d)));

    eventTypes.forEach((type, i) => {
      g.append('text')
        .attr('x', -5)
        .attr('y', i * laneHeight + laneHeight / 2)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('fill', '#6b7280')
        .text(type);
    });
  }, [events, currentYear, width, height, onEventClick]);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Life Event Timeline</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
