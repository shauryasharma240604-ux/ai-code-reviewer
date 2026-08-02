import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, Shield, Server, RefreshCw } from 'lucide-react';
import { getBackendUrl } from '../utils/api';

export default function SettingsModal({ isOpen, onClose, apiKey, setApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [backendUrlInput, setBackendUrlInput] = useState(() => localStorage.getItem('backend_api_url') || 'http://localhost:8000');
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testingConn, setTestingConn] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConn(true);
    setStatusMsg(null);
    try {
      const url = (backendUrlInput.trim() || 'http://localhost:8000').replace(/\/+$/, '');
      const res = await fetch(`${url}/`, { method: 'GET' });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Successfully connected to backend API at [${url}]!` });
      } else {
        setStatusMsg({ type: 'error', text: `Backend returned status ${res.status}. Verify server is running properly.` });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: `Unable to reach backend server at [${backendUrlInput}]. Ensure your Python server is running ('python backend/main.py' or 'run_bugshield.bat') or CORS is configured.`
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // Save Backend API URL
    const cleanedUrl = backendUrlInput.trim().replace(/\/+$/, '');
    if (cleanedUrl) {
      localStorage.setItem('backend_api_url', cleanedUrl);
    } else {
      localStorage.removeItem('backend_api_url');
    }

    // Save API key
    if (!keyInput.trim()) {
      setApiKey('');
      localStorage.removeItem('gemini_api_key');
      setStatusMsg({ type: 'info', text: 'Settings updated! (Gemini key cleared, backend URL saved).' });
      setLoading(false);
      setTimeout(() => onClose(), 1000);
      return;
    }

    setApiKey(keyInput.trim());
    localStorage.setItem('gemini_api_key', keyInput.trim());
    setStatusMsg({ type: 'success', text: 'Settings & API key successfully saved!' });
    setLoading(false);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ maxWidth: '540px', width: '100%', padding: '28px', position: 'relative' }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '10px', borderRadius: '10px' }}>
            <Key size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>AI Reviewer Settings</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Configure Gemini LLM API & Backend Connection</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Backend API Server URL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px' }}>
              <Server size={16} color="var(--accent-cyan)" /> Backend API Server URL
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={backendUrlInput}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '8px',
                  color: 'white',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="button"
                className="glass-btn"
                onClick={handleTestConnection}
                disabled={testingConn}
                title="Test connection to backend"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {testingConn ? <RefreshCw size={14} className="spin" /> : <Check size={14} />} Test
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Default: <code>http://localhost:8000</code>. When hosting frontend on Vercel, set this to your backend server URL or ngrok tunnel.
            </p>
          </div>

          {/* Gemini API Key */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px' }}>
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '8px',
                color: 'white',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem'
              }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Stored securely in your browser's local storage.
            </p>
          </div>

          {statusMsg && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: statusMsg.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : statusMsg.type === 'info' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: statusMsg.type === 'success' ? '#34d399' : statusMsg.type === 'info' ? '#60a5fa' : '#fca5a5',
              border: `1px solid ${statusMsg.type === 'success' ? 'rgba(5, 150, 105, 0.4)' : statusMsg.type === 'info' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
            }}>
              {statusMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="glass-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="glass-btn glass-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
