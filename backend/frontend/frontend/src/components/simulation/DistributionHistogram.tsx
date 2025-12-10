export function DistributionHistogram(props: any) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Distribution Histogram</h3>
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div>D3.js histogram visualization</div>
          <div className="text-sm">50-bin distribution with percentile markers</div>
        </div>
      </div>
    </div>
  );
}
