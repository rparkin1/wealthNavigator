import { useState } from 'react';

interface Scenario {
  id: string;
  name: string;
  successProbability: number;
  portfolioValue: number;
  monthlyContribution: number;
  expectedReturn: number;
}

interface ScenarioComparisonProps {
  scenarios?: Scenario[];
}

export function ScenarioComparison({ scenarios }: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  const mockScenarios: Scenario[] = scenarios || [
    { id: '1', name: 'Baseline', successProbability: 76, portfolioValue: 1050000, monthlyContribution: 1000, expectedReturn: 7.5 },
    { id: '2', name: 'Retire 5 Years Early', successProbability: 62, portfolioValue: 880000, monthlyContribution: 1000, expectedReturn: 7.5 },
    { id: '3', name: 'Increase Savings 25%', successProbability: 84, portfolioValue: 1180000, monthlyContribution: 1250, expectedReturn: 7.5 },
    { id: '4', name: 'Market Crash', successProbability: 58, portfolioValue: 820000, monthlyContribution: 1000, expectedReturn: 5.0 },
    { id: '5', name: 'Aggressive Growth', successProbability: 81, portfolioValue: 1250000, monthlyContribution: 1000, expectedReturn: 9.0 }
  ];

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id].slice(0, 5));
  };

  const baseline = mockScenarios[0];
  const selected = selectedScenarios.length > 0 ? mockScenarios.filter(s => selectedScenarios.includes(s.id)) : [mockScenarios[0], mockScenarios[1]];

  const calculateDelta = (value: number, baseValue: number) => {
    const delta = value - baseValue;
    const percent = ((delta / baseValue) * 100).toFixed(1);
    return { delta, percent, isPositive: delta >= 0 };
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Scenario Comparison</h3>
      
      <div className="mb-4 flex flex-wrap gap-2">
        {mockScenarios.map(s => (
          <button key={s.id} onClick={() => toggleScenario(s.id)}
            className={'px-3 py-1 text-sm border rounded ' + (selectedScenarios.includes(s.id) ? 'bg-blue-50 border-blue-500' : 'border-gray-300')}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 border-b">Metric</th>
              {selected.map(s => (
                <th key={s.id} className="text-right p-3 border-b">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3 font-medium">Success Probability</td>
              {selected.map(s => {
                const d = calculateDelta(s.successProbability, baseline.successProbability);
                return (
                  <td key={s.id} className="p-3 text-right">
                    <div>{s.successProbability}%</div>
                    {s.id !== baseline.id && (
                      <div className={'text-xs ' + (d.isPositive ? 'text-green-600' : 'text-red-600')}>
                        {d.isPositive ? '+' : ''}{d.percent}%
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Portfolio Value</td>
              {selected.map(s => {
                const d = calculateDelta(s.portfolioValue, baseline.portfolioValue);
                return (
                  <td key={s.id} className="p-3 text-right">
                    <div>${(s.portfolioValue / 1000).toFixed(0)}k</div>
                    {s.id !== baseline.id && (
                      <div className={'text-xs ' + (d.isPositive ? 'text-green-600' : 'text-red-600')}>
                        {d.isPositive ? '+' : ''}${(d.delta / 1000).toFixed(0)}k
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Monthly Contribution</td>
              {selected.map(s => (
                <td key={s.id} className="p-3 text-right">${s.monthlyContribution}</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">Expected Return</td>
              {selected.map(s => (
                <td key={s.id} className="p-3 text-right">{s.expectedReturn}%</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
