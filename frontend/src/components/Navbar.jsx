import React from 'react';
import { ShieldCheck, Code, GitPullRequest, History, BookOpen, Settings, Key } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, apiKey }) {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 24px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', 
            padding: '8px', 
            borderRadius: '10px', 
            display: 'flex',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BugShield AI
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hybrid Static + LLM Code Reviewer</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`glass-btn ${activeTab === 'editor' ? 'glass-btn-primary' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Code size={18} /> Code Analyzer
          </button>
          
          <button 
            className={`glass-btn ${activeTab === 'github' ? 'glass-btn-primary' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            <GitPullRequest size={18} /> GitHub PR Inspector
          </button>
          
          <button 
            className={`glass-btn ${activeTab === 'history' ? 'glass-btn-primary' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} /> History
          </button>

          <button 
            className={`glass-btn ${activeTab === 'interview' ? 'glass-btn-primary' : ''}`}
            onClick={() => setActiveTab('interview')}
            style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}
          >
            <BookOpen size={18} color="#a78bfa" /> SDE Interview Guide
          </button>
        </nav>

        {/* Status & Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            onClick={onOpenSettings}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '20px',
              background: apiKey ? 'rgba(5, 150, 105, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${apiKey ? 'rgba(5, 150, 105, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              color: apiKey ? '#34d399' : '#fde047',
              cursor: 'pointer'
            }}
          >
            <Key size={14} />
            <span>{apiKey ? 'Gemini API Active' : 'Offline / Fallback AI'}</span>
          </div>

          <button className="glass-btn" onClick={onOpenSettings} title="Settings">
            <Settings size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
