import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, Shield, ExternalLink } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, apiKey, setApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      if (!keyInput.trim()) {
        setApiKey('');
        localStorage.removeItem('gemini_api_key');
        setStatusMsg({ type: 'info', text: 'API key cleared. System running in local fallback mode.' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/settings/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: keyInput })
      });

      const data = await res.json();
      if (data.valid) {
        setApiKey(keyInput.trim());
        localStorage.setItem('gemini_api_key', keyInput.trim());
        setStatusMsg({ type: 'success', text: 'Gemini API key saved & active!' });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMsg({ type: 'error', text: data.message });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to verify key format.' });
    } finally {
      setLoading(false);
    }
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '10px', borderRadius: '10px' }}>
            <Key size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>AI Reviewer Settings</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Configure Google Gemini LLM API credentials</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
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
              Stored securely in browser local storage. If omitted, the application uses its built-in rule-based AI fallback engine.
            </p>
          </div>

          {statusMsg && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: statusMsg.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: statusMsg.type === 'success' ? '#34d399' : '#fca5a5',
              border: `1px solid ${statusMsg.type === 'success' ? 'rgba(5, 150, 105, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
            }}>
              {statusMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="glass-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="glass-btn glass-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
