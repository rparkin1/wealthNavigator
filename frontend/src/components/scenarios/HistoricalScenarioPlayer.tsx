import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HistoricalScenario {
  id: string;
  name: string;
  period: string;
  returns: Array<{ month: number; stocks: number; bonds: number }>;
}

interface HistoricalScenarioPlayerProps {
  scenario?: HistoricalScenario;
}

export function HistoricalScenarioPlayer({ scenario }: HistoricalScenarioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const mockScenario: HistoricalScenario = scenario || {
    id: '2008-crisis',
    name: '2008 Financial Crisis',
    period: '2007-2009',
    returns: Array.from({ length: 24 }, (_, i) => ({
      month: i,
      stocks: -2 - Math.random() * 3 + (i > 18 ? i - 18 : 0),
      bonds: 0.3 + Math.random() * 0.5
    }))
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentMonth(prev => {
          if (prev >= mockScenario.returns.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, mockScenario.returns.length]);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const width = 600, height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const dataUpToCurrent = mockScenario.returns.slice(0, currentMonth + 1);

    const x = d3.scaleLinear().domain([0, mockScenario.returns.length - 1]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([-10, 5]).range([innerHeight, 0]);

    const stocksLine = d3.line<any>().x(d => x(d.month)).y(d => y(d.stocks));
    const bondsLine = d3.line<any>().x(d => x(d.month)).y(d => y(d.bonds));

    g.append('path').datum(dataUpToCurrent).attr('fill', 'none').attr('stroke', '#ef4444')
      .attr('stroke-width', 2).attr('d', stocksLine);

    g.append('path').datum(dataUpToCurrent).attr('fill', 'none').attr('stroke', '#10b981')
      .attr('stroke-width', 2).attr('d', bondsLine);

    g.append('g').attr('transform', 'translate(0,' + innerHeight + ')').call(d3.axisBottom(x).ticks(12));
    g.append('g').call(d3.axisLeft(y).ticks(10).tickFormat(d => d + '%'));

    g.append('line').attr('x1', 0).attr('x2', innerWidth).attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', '#9ca3af').attr('stroke-dasharray', '3,3');
  }, [currentMonth, mockScenario]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{mockScenario.name}</h3>
          <p className="text-sm text-gray-600">{mockScenario.period}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Month {currentMonth + 1} of {mockScenario.returns.length}</div>
        </div>
      </div>

      <svg ref={svgRef}></svg>

      <div className="flex items-center gap-4 mt-4">
        <button onClick={() => setIsPlaying(!isPlaying)}
          className={'px-4 py-2 rounded ' + (isPlaying ? 'bg-red-600 text-white' : 'bg-blue-600 text-white')}>
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button onClick={() => { setCurrentMonth(0); setIsPlaying(false); }} className="px-4 py-2 border rounded">
          🔄 Reset
        </button>
        <div className="flex gap-2">
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className={'px-3 py-2 border rounded text-sm ' + (speed === s ? 'bg-blue-50 border-blue-500' : '')}>
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-500"></div>
          <span>Stocks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500"></div>
          <span>Bonds</span>
        </div>
      </div>
    </div>
  );
}
