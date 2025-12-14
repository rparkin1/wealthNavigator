import { useState } from 'react';
import { ChartBarIcon, FolderIcon, ArrowDownTrayIcon, PlayIcon } from '@heroicons/react/24/outline';

interface ReturnSequence {
  year: number;
  stocks: number;
  bonds: number;
  cash: number;
}

export function CustomScenarioBuilder() {
  const [mode, setMode] = useState<'table' | 'csv'>('table');
  const [sequence, setSequence] = useState<ReturnSequence[]>(
    Array.from({ length: 10 }, (_, i) => ({ year: 2025 + i, stocks: 8.0, bonds: 4.0, cash: 2.0 }))
  );

  const handleCellChange = (index: number, field: keyof ReturnSequence, value: number) => {
    const updated = [...sequence];
    updated[index] = { ...updated[index], [field]: value };
    setSequence(updated);
  };

  const exportCSV = () => {
    const csv = ['Year,Stocks,Bonds,Cash', ...sequence.map(s => `${s.year},${s.stocks},${s.bonds},${s.cash}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario.csv';
    a.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1);
      const imported = lines.map(line => {
        const [year, stocks, bonds, cash] = line.split(',').map(Number);
        return { year, stocks, bonds, cash };
      }).filter(s => !isNaN(s.year));
      setSequence(imported);
    };
    reader.readAsText(file);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Custom Scenario Builder</h3>
        <div className="flex gap-2">
          <button onClick={() => setMode('table')} className={'px-3 py-1 text-sm border rounded flex items-center gap-2 ' + (mode === 'table' ? 'bg-blue-50 border-blue-500' : '')}>
            <ChartBarIcon className="w-4 h-4" />
            Table
          </button>
          <button onClick={() => setMode('csv')} className={'px-3 py-1 text-sm border rounded flex items-center gap-2 ' + (mode === 'csv' ? 'bg-blue-50 border-blue-500' : '')}>
            <FolderIcon className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {mode === 'table' ? (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-2">Year</th>
                <th className="text-right p-2">Stocks (%)</th>
                <th className="text-right p-2">Bonds (%)</th>
                <th className="text-right p-2">Cash (%)</th>
              </tr>
            </thead>
            <tbody>
              {sequence.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{s.year}</td>
                  <td className="p-2"><input type="number" step="0.1" value={s.stocks} onChange={(e) => handleCellChange(i, 'stocks', Number(e.target.value))} className="w-full text-right border rounded px-2 py-1" /></td>
                  <td className="p-2"><input type="number" step="0.1" value={s.bonds} onChange={(e) => handleCellChange(i, 'bonds', Number(e.target.value))} className="w-full text-right border rounded px-2 py-1" /></td>
                  <td className="p-2"><input type="number" step="0.1" value={s.cash} onChange={(e) => handleCellChange(i, 'cash', Number(e.target.value))} className="w-full text-right border rounded px-2 py-1" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Import CSV File</label>
            <input type="file" accept=".csv" onChange={importCSV} className="block w-full text-sm border rounded px-3 py-2" />
            <p className="text-xs text-gray-600 mt-1">Format: Year,Stocks,Bonds,Cash</p>
          </div>
          <button onClick={exportCSV} className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2">
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download CSV
          </button>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
          <PlayIcon className="w-5 h-5" />
          Run Simulation
        </button>
        <button onClick={() => setSequence(sequence.concat({ year: sequence[sequence.length - 1].year + 1, stocks: 8.0, bonds: 4.0, cash: 2.0 }))}
          className="px-4 py-2 border rounded hover:bg-gray-50">
          + Add Year
        </button>
      </div>
    </div>
  );
}
