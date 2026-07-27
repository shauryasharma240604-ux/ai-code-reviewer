import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CodeEditorView from './components/CodeEditorView';
import ReviewResultsView from './components/ReviewResultsView';
import GitHubPRInspector from './components/GitHubPRInspector';
import HistoryView from './components/HistoryView';
import InterviewGuideView from './components/InterviewGuideView';
import SettingsModal from './components/SettingsModal';
import { SAMPLE_SNIPPETS } from './utils/sampleCode';

export default function App() {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'results' | 'github' | 'history' | 'interview'
  
  // Editor state
  const [code, setCode] = useState(SAMPLE_SNIPPETS[0].code);
  const [language, setLanguage] = useState(SAMPLE_SNIPPETS[0].language);
  const [title, setTitle] = useState(SAMPLE_SNIPPETS[0].name);
  const [persona, setPersona] = useState('Senior SDE');
  
  // App state
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  // Load API key from local storage on startup
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Run Code Review
  const handleRunReview = async () => {
    if (!code || !code.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          title,
          persona,
          api_key: apiKey
        })
      });

      const responseText = await response.text();
      let reportData;
      try {
        reportData = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Backend server unreachable or returned non-JSON response. Please ensure backend is running at http://localhost:8000.`);
      }

      if (!response.ok) {
        throw new Error(reportData.detail || 'Code review request failed.');
      }

      setCurrentReport(reportData);
      setActiveTab('results');
    } catch (err) {
      alert(`Review Notice: ${err.message}`);
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
