import React from 'react';
import { BookOpen, Cpu, ShieldCheck, Zap, Server, Layers, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function InterviewGuideView() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      
      {/* Title Header */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', padding: '12px', borderRadius: '12px', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}>
            <BookOpen size={32} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
              SDE Placement Interview System Design Guide
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#d1d5db', marginTop: '4px' }}>
              Master the architectural tradeoffs, prompt engineering techniques, and system design answers for SDE technical interviews.
            </p>
          </div>
        </div>
      </div>

      {/* Core Discussion Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* Card 1: Hybrid Architecture Rationale */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>1. Why Hybrid Static + LLM?</h3>
          </div>
          
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#d1d5db', listStyle: 'none', padding: 0 }}>
            <li style={{ background: '#0d1117', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
              <strong>⚡ Cost Efficiency & Zero Latency:</strong> Static analysis rules (AST, Regex, linters) catch ~60% of deterministic syntax, secret leaks, and security anti-patterns in &lt;10ms for $0 API cost.
            </li>
            <li style={{ background: '#0d1117', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)' }}>
              <strong>🧠 Deep Contextual Reasoning:</strong> LLMs excel at understanding business logic bugs, race conditions, edge-case null states, and writing senior engineer PR comments that linters cannot detect.
            </li>
            <li style={{ background: '#0d1117', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
              <strong>🛡️ Anti-Hallucination Grounding:</strong> By injecting static findings directly into the LLM prompt context, we ground the LLM's attention, preventing it from inventing non-existent rules.
            </li>
          </ul>
        </div>

        {/* Card 2: Merge & Deduplication Matrix */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers size={22} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>2. Merge & Deduplication Strategy</h3>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            How we prevent duplicate alerts when both static analyzer and LLM flag the same code line:
          </p>

          <div style={{ background: '#0d1117', padding: '14px', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}>
            <div>1. Run Static Analyzer &rarr; generate list of line-indexed findings.</div>
            <div>2. Inject Static findings into Gemini LLM JSON schema prompt.</div>
            <div>3. Compare AI findings with Static list using tuple key: <code>(line_number, title_slug)</code>.</div>
            <div style={{ color: '#34d399', marginTop: '6px' }}>
              4. If collision found: Upgrade issue source tag to <code>HYBRID</code> and enrich with Senior Engineer PR note!
            </div>
          </div>
        </div>

      </div>

      {/* System Scaling & Rate Limit Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Server size={22} color="#f59e0b" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>3. How to Scale This Architecture in Real Production (100k+ PRs/Day)</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          
          <div style={{ background: '#0d1117', padding: '16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#93c5fd', marginBottom: '8px' }}>
              Async Task Queues
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Use <strong>Celery + Redis</strong> workers to process PR webhooks asynchronously. Webhook responds with HTTP 202 instantly while background workers process AST and call Gemini.
            </p>
          </div>

          <div style={{ background: '#0d1117', padding: '16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#c084fc', marginBottom: '8px' }}>
              Intelligent Caching
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Compute SHA-256 hash of file diff blocks. Cache review results in <strong>Redis</strong> so unchanged functions across PR commits return cached analysis instantly.
            </p>
          </div>

          <div style={{ background: '#0d1117', padding: '16px', borderRadius: '8px', border: '1px solid var(--bg-card-border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#34d399', marginBottom: '8px' }}>
              Diff Chunking & Tree-sitter
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Instead of sending entire 10,000-line repositories, use <strong>Tree-sitter AST</strong> to parse modified function scope boundaries and send only impacted sub-trees to the LLM.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
