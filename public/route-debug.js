
// Next.js Route Debugging Script
// Add this to your HTML to debug: <script src="/route-debug.js"></script>

console.log("Enhanced Route Debugger activated");
window.addEventListener('DOMContentLoaded', (event) => {
  // Create debugging overlay
  const debugContainer = document.createElement('div');
  debugContainer.style = "position: fixed; top: 0; left: 0; right: 0; background: #333; color: white; padding: 10px; z-index: 9999; font-family: monospace; max-height: 80vh; overflow-y: auto;";
  
  // Hide/show toggle
  const toggleButton = document.createElement('button');
  toggleButton.innerText = "Toggle Debug Panel";
  toggleButton.style = "position: fixed; bottom: 10px; right: 10px; z-index: 10000; background: #555; color: white; border: none; padding: 8px; cursor: pointer;";
  toggleButton.onclick = () => {
    debugContainer.style.display = debugContainer.style.display === 'none' ? 'block' : 'none';
  };
  
  document.body.appendChild(toggleButton);
  
  // Build debug info
  const envInfo = {};
  
  // Check if Next.js is available
  if (window.__NEXT_DATA__) {
    envInfo.nextData = {
      buildId: window.__NEXT_DATA__.buildId,
      appRouter: Boolean(window.__NEXT_DATA__.app),
      props: JSON.stringify(window.__NEXT_DATA__.props).substring(0, 100) + '...'
    };
  }

  debugContainer.innerHTML = `
    <h3>🔍 Uniqverse Route Debugger</h3>
    <p><strong>URL:</strong> ${window.location.href}</p>
    <p><strong>Path:</strong> ${window.location.pathname}</p>
    <p><strong>Query:</strong> ${window.location.search}</p>
    <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>Next.js Data:</strong> ${window.__NEXT_DATA__ ? 'Available' : 'Not Found'}</p>
    <hr>
    <h4>Navigation:</h4>
    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
      <button onclick="window.location='/'">Home</button>
      <button onclick="window.location='/shop'">Shop</button>
      <button onclick="window.location='/api/health'">API Health</button>
      <button onclick="window.location='/auth/login'">Login</button>
      <button onclick="window.location='/admin'">Admin</button>
      <button onclick="testApi()">Test API</button>
    </div>
    <hr>
    <div id="api-results">Testing API connection...</div>
  `;
  
  document.body.appendChild(debugContainer);

  // API Test function
  window.testApi = () => {
    const apiResults = document.getElementById('api-results');
    apiResults.innerHTML = 'Testing API connection...';
    
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        apiResults.innerHTML = `
          <div style="background: #070; padding: 10px; margin-top: 10px;">
            <h4>✅ API Health Check Success:</h4>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
        `;
      })
      .catch(error => {
        apiResults.innerHTML = `
          <div style="background: #700; padding: 10px; margin-top: 10px;">
            <h4>❌ API Health Check Error:</h4>
            <pre>${error.message}</pre>
          </div>
        `;
      });
  };
  
  // Auto-run API test
  window.testApi();
});
