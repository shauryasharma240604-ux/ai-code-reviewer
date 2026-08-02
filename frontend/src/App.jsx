import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CodeEditorView from './components/CodeEditorView';
import ReviewResultsView from './components/ReviewResultsView';
import GitHubPRInspector from './components/GitHubPRInspector';
import HistoryView from './components/HistoryView';
import InterviewGuideView from './components/InterviewGuideView';
import SettingsModal from './components/SettingsModal';
import { SAMPLE_SNIPPETS } from './utils/sampleCode';
import { fetchApi } from './utils/api';
import { runClientSideReview } from './utils/clientFallbackAnalyzer';
import { AlertTriangle, Server, Settings, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'results' | 'github' | 'history' | 'interview'
  
  // Editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [title, setTitle] = useState('Untitled Snippet');
  const [persona, setPersona] = useState('Senior SDE');
  
  // App state
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  // Load API key from local storage on startup
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Run Code Review via Backend or Fallback
  const handleRunReview = async () => {
    if (!code || !code.trim()) return;

    setLoading(true);
    setErrorNotice(null);

    try {
      const reportData = await fetchApi('/api/review', {
        method: 'POST',
        body: JSON.stringify({
          code,
          language,
          title,
          persona,
          api_key: apiKey
        })
      });

      setCurrentReport(reportData);
      setActiveTab('results');
    } catch (err) {
      console.warn('Backend call failed, presenting options to user:', err.message);
      setErrorNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunFallbackReview = () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const report = runClientSideReview(code, language, title, persona);
      setCurrentReport(report);
      setActiveTab('results');
    } catch (e) {
      alert(`Fallback analysis failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRefactor = (refactoredCode) => {
    setCode(refactoredCode);
    setActiveTab('editor');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        apiKey={apiKey}
      />

      {errorNotice && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', flex: 1, minWidth: '280px' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem' }}>{errorNotice}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleRunFallbackReview}
              className="glass-btn glass-btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Zap size={14} /> Run In-Browser Analysis
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="glass-btn"
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={14} /> Configure Backend URL
            </button>
          </div>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {activeTab === 'editor' && (
          <CodeEditorView
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            title={title}
            setTitle={setTitle}
            persona={persona}
            setPersona={setPersona}
            onRunReview={handleRunReview}
            loading={loading}
          />
        )}

        {activeTab === 'results' && (
          <ReviewResultsView
            report={currentReport}
            onApplyRefactor={handleApplyRefactor}
            onReset={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'github' && (
          <GitHubPRInspector
            apiKey={apiKey}
            onSelectReport={(report) => {
              setCurrentReport(report);
              setActiveTab('results');
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onSelectReport={(report) => {
              setCurrentReport(report);
              setActiveTab('results');
            }}
          />
        )}

        {activeTab === 'interview' && (
          <InterviewGuideView />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />
    </div>
  );
}
