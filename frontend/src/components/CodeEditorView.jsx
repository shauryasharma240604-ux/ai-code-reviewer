import React from 'react';
import { Play, Sparkles, FileCode, Cpu, UserCheck } from 'lucide-react';
import { SAMPLE_SNIPPETS } from '../utils/sampleCode';

export default function CodeEditorView({
  code,
  setCode,
  language,
  setLanguage,
  title,
  setTitle,
  persona,
  setPersona,
  onRunReview,
  loading
}) {
  const handleLoadPreset = (snippet) => {
    setCode(snippet.code);
    setLanguage(snippet.language);
    setTitle(snippet.name);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      
      {/* Top Banner / Presets */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={20} color="var(--accent-cyan)" /> Code Snippet Input
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Paste code below or load a preset sample with real-world vulnerabilities.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sample Presets:</span>
            {SAMPLE_SNIPPETS.map(snippet => (
              <button
                key={snippet.id}
                className="glass-btn"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => handleLoadPreset(snippet)}
              >
                <Sparkles size={12} color="#fde047" /> {snippet.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Controls & Textarea Grid */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          
          {/* Snippet Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>
              Snippet Title / File Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. auth_service.py"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '6px',
                color: 'white',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Language Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>
              Programming Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '6px',
                color: 'white',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem'
              }}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript / JSX</option>
              <option value="typescript">TypeScript / TSX</option>
              <option value="go">Go (Golang)</option>
              <option value="java">Java</option>
              <option value="cpp">C / C++</option>
            </select>
          </div>

          {/* Reviewer Persona */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>
              AI Reviewer Persona
            </label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '6px',
                color: 'white',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem'
              }}
            >
              <option value="Senior SDE">Senior SDE (Balanced PR Reviewer)</option>
              <option value="Security Auditor">Security Auditor (OWASP Top 10 Specialist)</option>
              <option value="Performance Architect">Performance Architect (Latency & Memory)</option>
            </select>
          </div>

        </div>

        {/* Code Editor Textarea */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <textarea
            className="code-editor-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your source code here..."
            spellCheck={false}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: '12px', 
            right: '16px', 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            {code.split('\n').length} lines | {code.length} chars
          </div>
        </div>

        {/* Submit Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={16} color="var(--accent-cyan)" />
            <span>Static Analysis + Gemini LLM Hybrid Pipeline</span>
          </div>

          <button
            className="glass-btn glass-btn-primary"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
            onClick={onRunReview}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{ 
                  width: '18px', 
                  height: '18px', 
                  border: '2px solid white', 
                  borderTopColor: 'transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 0.8s linear infinite' 
                }} />
                Running Hybrid Pipeline...
              </>
            ) : (
              <>
                <Play size={18} /> Run Code Review
              </>
            )}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
