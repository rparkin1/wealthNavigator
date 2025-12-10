export function ScenarioComparison(props: any) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Scenario Comparison</h3>
      <div className="text-sm text-gray-600 mb-4">
        Compare up to 5 scenarios side-by-side
      </div>
      <div className="space-y-2">
        <div className="p-3 bg-gray-50 rounded">Scenario 1: Baseline</div>
        <div className="p-3 bg-blue-50 rounded">Scenario 2: Retire Early</div>
      </div>
    </div>
  );
}
