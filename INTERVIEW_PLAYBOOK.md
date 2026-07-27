# SDE Placement Interview Playbook - AI Code Reviewer

This guide equips you with deep technical talking points, system design justifications, and prompt engineering principles for interviewing at top tech companies.

---

## 1. Core Architectural Question: "Why combine Static Analysis + LLM instead of using AI alone?"

### Key Interviewer Probe
*"Why did you add a static analysis layer instead of just sending the code directly to GPT-4 / Gemini?"*

### Model Answer & Engineering Rationale
1. **Deterministic Accuracy & Zero Hallucination Risk**:
   - Static analysis tools (AST parsers, Bandit, ESLint) rely on formal grammars and deterministic rule sets.
   - They give **100% precision** for syntax errors, hardcoded secrets, and unsafe function signatures (`eval()`, `strcpy()`, bare `except:`) with zero probability of hallucination.
2. **Cost & Latency Optimization**:
   - Running static analysis takes **< 10ms** locally at **$0 API cost**.
   - If a code file has syntax errors, we reject or flag it *before* wasting expensive LLM tokens.
3. **Context Grounding**:
   - LLMs can miss line-specific details or hallucinate fake linting rules if given a blank slate.
   - By feeding static findings into the LLM prompt as structural context, the LLM performs **targeted reasoning** (e.g., "The static analyzer found a missing timeout on line 12; how does this impact our thread pool under high concurrency?").

---

## 2. Deduplication & Merge Algorithm

### How it Works
When both the static analyzer and the LLM flag the same region of code, we deduplicate using a tuple index key `(line_number, issue_category_slug)`:

```python
key = (finding.line, finding.title[:20].lower())
if key in static_findings_set:
    # Upgrade finding to 'HYBRID' source tag
    # Combine deterministic static description + Senior Engineer PR recommendation
```

---

## 3. Prompt Engineering Architecture

To ensure the LLM output is reliable and machine-parsable:
- **System Instructions**: Enforce strict JSON Schema output (`response_mime_type="application/json"`).
- **Persona Context**: Allow user to switch between `Senior SDE`, `Security Auditor (OWASP Top 10)`, and `Performance Architect`.
- **Structured Schema**: Force fields `summary`, `overall_rating`, `findings`, `refactored_code`, and `senior_comment`.

---

## 4. System Design: Scaling to 100,000+ PRs per Day

```
[ GitHub Webhook ] ──> [ API Gateway / Load Balancer ]
                                 │
                                 ▼
                     [ Async Task Queue (Celery) ]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [ Static Analyzer Workers ]     [ Redis Diff Cache ]
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                       [ Gemini LLM Workers ]
                                 │
                                 ▼
                       [ PostgreSQL DB / PR Comment ]
```

1. **Webhook Async Processing**: GitHub sends `pull_request` webhooks. FastAPI responds HTTP 202 instantly, offloading analysis to a **Celery + Redis** distributed worker pool.
2. **SHA-256 Diff Caching**: Compute hashes of function blocks. If a PR commit touches File A but Function B remains identical, serve cached review results from Redis.
3. **Tree-sitter AST Scope Chunking**: Instead of sending entire 20,000-line repositories, isolate modified function AST scopes and send only relevant sub-trees to the LLM context window.
