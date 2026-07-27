import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, AlertCircle, Info, ShieldAlert, 
  Sparkles, Code2, Download, Copy, FileText, Check, ArrowRight, RefreshCw, MessageSquare
} from 'lucide-react';

export default function ReviewResultsView({ report, onApplyRefactor, onReset }) {
  const [activeView, setActiveView] = useState('annotations'); // 'annotations' | 'diff' | 'markdown'
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const {
    snippet_title,
    language,
    code_snippet = '',
    health_score = 100,
    overall_rating = 'GOOD',
    summary = '',
    all_findings = [],
    counts = {},
    refactored_code = '',
    refactor_explanation = '',
    github_markdown_comment = ''
  } = report;

  // Filter findings
  const filteredFindings = all_findings.filter(f => {
    const matchSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchSrc = sourceFilter === 'ALL' || f.merged_source === sourceFilter;
    return matchSev && matchSrc;
  });

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const lines = code_snippet.split('\n');

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(github_markdown_comment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([github_markdown_comment], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${snippet_title.replace(/\s+/g, '_')}_review.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      
      {/* Overview Dashboard Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Health Score Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              border: `6px solid ${getScoreColor(health_score)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${getScoreColor(health_score)}40`,
              background: 'rgba(0,0,0,0.3)'
            }}>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1 }}>{health_score}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>{snippet_title}</h2>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#93c5fd' }}>
                  {language.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
                {summary}
              </p>
            </div>
          </div>

          {/* Issue Breakdown Pill Counts */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ padding: '10px 16px', textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fca5a5' }}>{counts.critical || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CRITICAL</div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 16px', textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fdba74' }}>{counts.high || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HIGH</div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 16px', textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fde047' }}>{counts.medium || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MEDIUM</div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 16px', textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#93c5fd' }}>{(counts.low || 0) + (counts.info || 0)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOW/INFO</div>
            </div>
          </div>

        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--bg-card-border)', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '4px', background: '#111827', padding: '4px', borderRadius: '8px' }}>
            <button
              className={`glass-btn ${activeView === 'annotations' ? 'glass-btn-primary' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setActiveView('annotations')}
            >
              <MessageSquare size={14} /> Line Annotations ({all_findings.length})
            </button>

            <button
              className={`glass-btn ${activeView === 'diff' ? 'glass-btn-primary' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setActiveView('diff')}
            >
              <Code2 size={14} /> 1-Click Fix Diff
            </button>

            <button
              className={`glass-btn ${activeView === 'markdown' ? 'glass-btn-primary' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setActiveView('markdown')}
            >
              <FileText size={14} /> PR Markdown Comment
            </button>
          </div>

          {/* Export Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {refactored_code && (
              <button
                className="glass-btn"
                style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#34d399', borderColor: 'rgba(5, 150, 105, 0.4)' }}
                onClick={() => onApplyRefactor(refactored_code)}
              >
                <Sparkles size={16} /> Apply AI Fix to Editor
              </button>
            )}

            <button className="glass-btn" onClick={handleCopyMarkdown}>
              {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy PR Comment'}
            </button>

            <button className="glass-btn" onClick={handleDownloadReport}>
              <Download size={16} /> Download .md
            </button>

            <button className="glass-btn" onClick={onReset}>
              <RefreshCw size={16} /> New Review
            </button>
          </div>

        </div>
      </div>

      {/* VIEW 1: LINE-BY-LINE ANNOTATIONS VIEW */}
      {activeView === 'annotations' && (
        <div>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: severityFilter === sev ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                    color: severityFilter === sev ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detector Source:</span>
              {['ALL', 'static', 'ai', 'hybrid'].map(src => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: sourceFilter === src ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                    color: sourceFilter === src ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {src.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Line-indexed Code Table */}
          <div className="glass-panel" style={{ padding: '16px', overflowX: 'auto' }}>
            <table className="code-line-table">
              <tbody>
                {lines.map((lineContent, idx) => {
                  const lineNum = idx + 1;
                  const lineIssues = filteredFindings.filter(f => f.line === lineNum);

                  return (
                    <React.Fragment key={lineNum}>
                      <tr className={`code-line-row ${lineIssues.length > 0 ? 'code-line-has-issue' : ''}`}>
                        <td className="code-line-num">{lineNum}</td>
                        <td className="code-line-content">
                          {lineContent}
                        </td>
                      </tr>

                      {/* Expandable Inline Comment Cards */}
                      {lineIssues.map(issue => (
                        <tr key={issue.id}>
                          <td colSpan={2}>
                            <div className="inline-comment-box">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className={`badge badge-${issue.severity.toLowerCase()}`}>
                                    {issue.severity}
                                  </span>
                                  <span className={`badge source-${issue.merged_source}`}>
                                    {issue.merged_source.toUpperCase()}
                                  </span>
                                  <strong style={{ fontSize: '0.9rem', color: '#f3f4f6' }}>{issue.title}</strong>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {issue.category}</span>
                              </div>

                              <p style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '8px' }}>
                                {issue.description}
                              </p>

                              <div style={{ background: '#0d1117', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', borderLeft: '3px solid var(--accent-cyan)', marginBottom: '8px' }}>
                                <strong>Suggested Fix:</strong> {issue.suggestion}
                              </div>

                              {issue.senior_comment && (
                                <div style={{ fontSize: '0.83rem', color: '#a78bfa', fontStyle: 'italic', background: 'rgba(139, 92, 246, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                                  💬 <strong>Senior Engineer PR Note:</strong> "{issue.senior_comment}"
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: SPLIT DIFF VIEW */}
      {activeView === 'diff' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>AI Automated Refactor Patch</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{refactor_explanation}</p>
            </div>
            <button
              className="glass-btn glass-btn-primary"
              onClick={() => onApplyRefactor(refactored_code)}
            >
              <Sparkles size={16} /> Apply Refactored Code to Editor
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', fontSize: '0.8rem', fontWeight: '600', color: '#fca5a5' }}>
                Original Code (With Issues)
              </div>
              <pre className="code-editor-textarea" style={{ minHeight: '450px', margin: 0, borderRadius: '0 0 8px 8px' }}>
                {code_snippet}
              </pre>
            </div>

            <div>
              <div style={{ padding: '8px 12px', background: 'rgba(5, 150, 105, 0.15)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', fontSize: '0.8rem', fontWeight: '600', color: '#34d399' }}>
                Refactored Clean Code (Fixed)
              </div>
              <pre className="code-editor-textarea" style={{ minHeight: '450px', margin: 0, borderRadius: '0 0 8px 8px', border: '1px solid rgba(5, 150, 105, 0.3)' }}>
                {refactored_code}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MARKDOWN PR COMMENT */}
      {activeView === 'markdown' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>GitHub PR Markdown Review Comment</h3>
            <button className="glass-btn glass-btn-primary" onClick={handleCopyMarkdown}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Markdown'}
            </button>
          </div>

          <pre style={{
            background: '#0d1117',
            padding: '20px',
            borderRadius: '8px',
            color: '#e6edf3',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.88rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '600px',
            overflowY: 'auto',
            border: '1px solid var(--bg-card-border)'
          }}>
            {github_markdown_comment}
          </pre>
        </div>
      )}

    </div>
  );
}
