// API Helper for BugShield AI Code Reviewer

export function getBackendUrl() {
  const customUrl = localStorage.getItem('backend_api_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  // Default to relative '/api' if on localhost/vite dev, or http://localhost:8000
  return '';
}

export async function fetchApi(endpoint, options = {}) {
  const baseUrl = getBackendUrl();
  // Ensure endpoint starts with '/'
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If baseUrl is provided and endpoint starts with '/api', append endpoint correctly
  let fullUrl = '';
  if (baseUrl) {
    fullUrl = `${baseUrl}${cleanEndpoint}`;
  } else {
    fullUrl = cleanEndpoint;
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: defaultHeaders,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const text = await response.text();
      const targetDisplay = fullUrl.startsWith('/') ? `${window.location.origin}${fullUrl}` : fullUrl;
      throw new Error(
        `Backend server unreachable or returned non-JSON response from [${targetDisplay}]. ` +
        `Please ensure your FastAPI backend is running (e.g. via 'python backend/main.py' or 'run_bugshield.bat') ` +
        `or configure your Backend API URL in Settings.`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    // If network error (Failed to fetch)
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const targetDisplay = fullUrl.startsWith('/') ? `${window.location.origin}${fullUrl}` : fullUrl;
      throw new Error(
        `Network error connecting to backend at [${targetDisplay}]. ` +
        `Please check that backend server is running and CORS is enabled, or update Backend API URL in Settings.`
      );
    }
    throw err;
  }
}
