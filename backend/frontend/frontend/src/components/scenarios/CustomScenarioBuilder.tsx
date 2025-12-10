export function CustomScenarioBuilder(props: any) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Custom Scenario Builder</h3>
      <div className="text-sm text-gray-600 mb-4">
        Build year-by-year return sequences
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Year</th>
            <th className="text-left p-2">Stocks</th>
            <th className="text-left p-2">Bonds</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="p-2">2025</td><td className="p-2">8.0%</td><td className="p-2">4.0%</td></tr>
          <tr><td className="p-2">2026</td><td className="p-2">8.0%</td><td className="p-2">4.0%</td></tr>
        </tbody>
      </table>
    </div>
  );
}
