import React, { useState } from 'react';
import { GitPullRequest, Search, FileCode, Check, Copy, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export default function GitHubPRInspector({ apiKey, onSelectReport }) {
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prSummary, setPrSummary] = useState(null);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);

  const handleInspectPR = async (e) => {
    e.preventDefault();
    if (!prUrl.trim()) return;

    setLoading(true);
    setError(null);
    setPrSummary(null);

    try {
      const response = await fetch('/api/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: prUrl,
          api_key: apiKey
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch GitHub PR details.');
      }

      const data = await response.json();
      setPrSummary(data);
      setSelectedFileIdx(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      
      {/* Header & Input Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '10px' }}>
            <GitPullRequest size={24} color="var(--accent-blue)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>GitHub Pull Request Inspector</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Paste a public GitHub Pull Request URL or file link to run hybrid review across changed files.
            </p>
          </div>
        </div>

        <form onSubmit={handleInspectPR} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="url"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="https://github.com/owner/repository/pull/123"
            required
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--bg-card-border)',
              borderRadius: '8px',
              color: 'white',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem'
            }}
          />

          <button
            type="submit"
            className="glass-btn glass-btn-primary"
            style={{ padding: '12px 24px' }}
            disabled={loading}
          >
            {loading ? 'Analyzing PR...' : 'Inspect Pull Request'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      {/* PR Results Dashboard */}
      {prSummary && (
        <div>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-low" style={{ marginBottom: '8px' }}>
                  {prSummary.owner} / {prSummary.repo} #{prSummary.pr_number}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>{prSummary.pr_title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Author: <strong>{prSummary.author}</strong> | Changed Files: <strong>{prSummary.changed_files_count}</strong>
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall PR Health</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: prSummary.overall_health_score >= 80 ? '#34d399' : '#f59e0b' }}>
                  {prSummary.overall_health_score}/100
                </div>
              </div>
            </div>
          </div>

          {/* Files Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            
            {/* File List Drawer */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Changed Files ({prSummary.file_reviews.length})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prSummary.file_reviews.map((f, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedFileIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedFileIdx === idx ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedFileIdx === idx ? 'rgba(59, 130, 246, 0.4)' : 'transparent'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileCode size={16} color="var(--accent-cyan)" />
                      <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.filename}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: f.health_score >= 80 ? '#34d399' : '#ef4444' }}>
                      {f.health_score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected File Inspection View */}
            <div>
              {prSummary.file_reviews[selectedFileIdx] && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                      {prSummary.file_reviews[selectedFileIdx].filename}
                    </h4>

                    <button
                      className="glass-btn glass-btn-primary"
                      onClick={() => onSelectReport(prSummary.file_reviews[selectedFileIdx])}
                    >
                      Open Full Annotations View
                    </button>
                  </div>

                  <div style={{ background: '#0d1117', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '8px' }}>
                      <strong>Summary:</strong> {prSummary.file_reviews[selectedFileIdx].summary}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Total Issues Found: <strong>{prSummary.file_reviews[selectedFileIdx].all_findings?.length || 0}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
