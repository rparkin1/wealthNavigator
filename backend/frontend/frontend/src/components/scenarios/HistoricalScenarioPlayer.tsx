export function HistoricalScenarioPlayer(props: any) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Historical Scenario Player</h3>
      <div className="text-sm text-gray-600 mb-4">
        Replay historical market events with animation
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">▶️ Play</button>
        <button className="px-4 py-2 border rounded">⏸️ Pause</button>
        <button className="px-4 py-2 border rounded">🔄 Reset</button>
      </div>
    </div>
  );
}
