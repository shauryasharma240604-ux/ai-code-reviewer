import React, { useState, useEffect } from 'react';
import { History, Trash2, ExternalLink, Calendar, Code, Shield } from 'lucide-react';

export default function HistoryView({ onSelectReport }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load review history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this review record?")) return;

    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '10px', borderRadius: '10px' }}>
              <History size={24} color="var(--accent-purple)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Code Review History</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Persistent database records of previous hybrid static + LLM analyses.
              </p>
            </div>
          </div>

          <button className="glass-btn" onClick={fetchHistory}>
            Refresh History
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading stored review history...
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No review records found in database yet. Run your first review in the Code Analyzer!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((record) => (
            <div
              key={record.id}
              className="glass-panel"
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
              onClick={() => onSelectReport(record.report)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: `3px solid ${record.health_score >= 80 ? '#10b981' : (record.health_score >= 60 ? '#f59e0b' : '#ef4444')}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}>
                  {record.health_score}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600' }}>{record.snippet_title}</h3>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#93c5fd' }}>
                      {record.language}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                    <span>📅 {new Date(record.created_at).toLocaleString()}</span>
                    <span>🚨 {record.counts?.critical || 0} Critical</span>
                    <span>⚠️ {record.counts?.high || 0} High</span>
                    <span>⚡ {record.counts?.medium || 0} Medium</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className="glass-btn glass-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  onClick={(e) => { e.stopPropagation(); onSelectReport(record.report); }}
                >
                  <ExternalLink size={14} /> Open Report
                </button>

                <button
                  className="glass-btn"
                  style={{ padding: '6px 10px', color: '#fca5a5' }}
                  onClick={(e) => handleDelete(record.id, e)}
                  title="Delete Record"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
