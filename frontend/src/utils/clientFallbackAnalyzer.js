/**
 * Standalone Client-side Code Review Engine
 * Provides static analysis & structural rule checks directly in the browser
 * when backend API server is unreachable.
 */

export function runClientSideReview(code, language = "python", snippetTitle = "Untitled Snippet", persona = "Senior SDE") {
  const lines = code.split("\n");
  const findings = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Secret Detection
    if (/AWS_SECRET_KEY|AKIA[0-9A-Z]{16}|SECRET_KEY|PRIVATE_KEY/i.test(line) && line.includes("=")) {
      findings.push({
        line: lineNum,
        severity: "CRITICAL",
        category: "SECURITY",
        title: "Hardcoded API Credential Leak",
        description: "Hardcoded secrets detected in source code. Access tokens or secret keys exposed in repository code pose severe security risks.",
        recommendation: "Store secrets safely in environment variables or a secure key vault (e.g., AWS Secrets Manager).",
        merged_source: "static",
        senior_comment: "Hardcoded credentials in source code will trigger automated secret scanners and lead to security compromise."
      });
    }

    // Dangerous Eval / Exec
    if (/\beval\(|\bexec\(|dangerouslySetInnerHTML/i.test(line)) {
      findings.push({
        line: lineNum,
        severity: "CRITICAL",
        category: "SECURITY",
        title: "Arbitrary Code Execution / XSS Vulnerability",
        description: "Dynamic evaluation functions (eval/exec) or unescaped HTML injection open pathways for Remote Code Execution or Cross-Site Scripting (XSS).",
        recommendation: "Use structured parsers (e.g., JSON.parse, ast.literal_eval) or safe React JSX rendering.",
        merged_source: "static",
        senior_comment: "Never evaluate raw user input directly. Replace with safe serialization standard libraries."
      });
    }

    // SQL Injection Risk
    if (/SELECT|INSERT|UPDATE|DELETE/i.test(line) && (line.includes("f\"") || line.includes("f'") || line.includes("+"))) {
      findings.push({
        line: lineNum,
        severity: "HIGH",
        category: "SECURITY",
        title: "Potential SQL Injection via String Interpolation",
        description: "Building database queries via string formatting or concatenation allows malicious users to inject unescaped SQL commands.",
        recommendation: "Use parameterized queries with place-holders (e.g., cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,)))",
        merged_source: "static",
        senior_comment: "Always parameterize database queries to prevent SQL injection."
      });
    }

    // Python Mutable Default Argument
    if (language === 'python' && /def\s+\w+\s*\(.*=\s*(\[\]|\{\})/i.test(line)) {
      findings.push({
        line: lineNum,
        severity: "HIGH",
        category: "CORRECTNESS",
        title: "Mutable Default Argument Bug",
        description: "Default argument values in Python are evaluated once at function definition time, sharing state across all function calls.",
        recommendation: "Use None as the default argument value and initialize inside the function body: log_list = log_list if log_list is not none else []",
        merged_source: "static",
        senior_comment: "Mutable default arguments create unexpected side-effects across calls."
      });
    }

    // Missing Request Timeout
    if (/requests\.(get|post|put|delete)/i.test(line) && !line.includes("timeout")) {
      findings.push({
        line: lineNum,
        severity: "MEDIUM",
        category: "PERFORMANCE",
        title: "Missing Network Request Timeout",
        description: "HTTP requests made without a specified timeout can block worker threads indefinitely if target server hangs.",
        recommendation: "Always set an explicit timeout parameter, e.g. requests.get(url, timeout=10).",
        merged_source: "static",
        senior_comment: "Unbounded HTTP calls can exhaust worker pools under high server latency."
      });
    }

    // React Direct State Mutation
    if (language === 'javascript' || language === 'typescript') {
      if (/userData\.\w+\s*=|data\.\w+\s*=/i.test(line) && !line.includes("setUserData")) {
        findings.push({
          line: lineNum,
          severity: "HIGH",
          category: "CORRECTNESS",
          title: "Direct React State Mutation",
          description: "Mutating React state directly prevents re-renders and breaks component lifecycle tracking.",
          recommendation: "Create a copy or spread object when updating state, e.g. setUserData({ ...userData, key: val }).",
          merged_source: "static",
          senior_comment: "Direct mutation of React state bypasses Virtual DOM diffing."
        });
      }
    }
  });

  // Calculate counts and health score
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, static: findings.length, ai: 0, hybrid: 0 };
  let totalDeduction = 0;

  findings.forEach(f => {
    const sev = f.severity;
    if (sev === "CRITICAL") { counts.critical++; totalDeduction += 25; }
    else if (sev === "HIGH") { counts.high++; totalDeduction += 15; }
    else if (sev === "MEDIUM") { counts.medium++; totalDeduction += 8; }
    else if (sev === "LOW") { counts.low++; totalDeduction += 3; }
    else { counts.info++; totalDeduction += 1; }
  });

  const healthScore = Math.max(0, 100 - totalDeduction);
  let overallRating = "EXCELLENT";
  if (healthScore < 50) overallRating = "CRITICAL_REVISION";
  else if (healthScore < 75) overallRating = "NEEDS_WORK";
  else if (healthScore < 90) overallRating = "GOOD";

  return {
    snippet_title: snippetTitle,
    language: language,
    code_snippet: code,
    health_score: healthScore,
    overall_rating: overallRating,
    summary: `Client-Side Review completed. Found ${findings.length} issues in static code analysis.`,
    all_findings: findings,
    counts: counts,
    refactored_code: code,
    refactor_explanation: "Client-side fallback review executed.",
    persona_used: `${persona} (Browser Engine)`,
    github_markdown_comment: `## 🛡️ BugShield AI Review Summary\n\n- **Health Score**: ${healthScore}/100\n- **Issues Found**: ${findings.length}\n- **Rating**: ${overallRating}`
  };
}
