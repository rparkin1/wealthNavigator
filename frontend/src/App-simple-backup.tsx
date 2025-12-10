/**
 * Simple Test App - For debugging blank screen
 */

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>WealthNavigator AI - Test</h1>
      <p>If you see this, React is working!</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>System Check:</h2>
        <ul>
          <li>✅ HTML is loading</li>
          <li>✅ JavaScript is executing</li>
          <li>✅ React is mounting</li>
          <li>✅ Vite dev server is running</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => alert('Button clicked!')}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default App;
