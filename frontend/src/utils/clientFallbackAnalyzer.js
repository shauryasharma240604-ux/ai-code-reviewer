/**
 * Standalone Client-side Code Review Engine
 * Provides static analysis & structural rule checks directly in the browser
 * when backend API server is unreachable.
 */

export function runClientSideReview(code, language = "python", snippetTitle = "Untitled Snippet", persona = "Senior SDE") {
  const lines = code.split("\n");
  const findings = [];

  // Strip single-line comments for reliable code logic inspection
  const codeWithoutComments = lines.map(l => l.replace(/#.*$/, '').replace(/\/\/.*$/, '')).join('\n');

  // Track loop indent levels to catch Early Return bugs
  let insideLoopIndent = -1;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const cleanLine = line.replace(/#.*$/, '').replace(/\/\/.*$/, '');
    const trimmed = cleanLine.trim();

    // Calculate leading spaces
    const indent = line.search(/\S/);

    if (/\b(for|while)\b/.test(trimmed)) {
      insideLoopIndent = indent;
    } else if (insideLoopIndent !== -1 && indent <= insideLoopIndent && trimmed !== '') {
      insideLoopIndent = -1;
    }

    // 1. Secret Detection (AKIA keys, AWS_SECRET_KEY, API_KEY, etc.)
    if (/(AKIA[0-9A-Z]{16,}|AWS_SECRET_KEY|SECRET_KEY|PRIVATE_KEY|API_KEY|PASSWORD)\s*=\s*["'][^"']{8,}["']/i.test(cleanLine)) {
      findings.push({
        line: lineNum,
        severity: "CRITICAL",
        category: "SECURITY",
        title: "Hardcoded API Credential / Secret Leak",
        description: "Hardcoded secret key or access token detected in source code. Credentials exposed in code repositories pose severe security compromise risks.",
        recommendation: "Store secrets in environment variables (e.g. os.environ.get(...)) or a secure secrets vault.",
        merged_source: "static",
        senior_comment: "CRITICAL: Hardcoded secret key detected! Never commit API keys or secret strings into source control."
      });
    }

    // 2. SQL Injection Risk
    if (/execute\s*\(\s*f["']|SELECT.*FROM.*WHERE|INSERT INTO|UPDATE.*SET/i.test(cleanLine) && (cleanLine.includes("f\"") || cleanLine.includes("f'") || cleanLine.includes("%") || cleanLine.includes("+"))) {
      findings.push({
        line: lineNum,
        severity: "CRITICAL",
        category: "SECURITY",
        title: "Potential SQL Injection via String Formatting",
        description: "Building database queries via string formatting or f-strings allows malicious users to inject unescaped SQL commands.",
        recommendation: "Use parameterized queries with placeholder bindings (e.g., cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,)))",
        merged_source: "static",
        senior_comment: "CRITICAL: SQL Injection vulnerability! Parameterize all database queries."
      });
    }

    // 3. Dangerous Eval / Exec
    if (/\beval\s*\(|\bexec\s*\(|dangerouslySetInnerHTML/i.test(cleanLine)) {
      findings.push({
        line: lineNum,
        severity: "CRITICAL",
        category: "SECURITY",
        title: "Arbitrary Code Execution via eval()/exec()",
        description: "Dynamic evaluation functions (eval/exec) or unescaped HTML injection open pathways for Remote Code Execution or Cross-Site Scripting (XSS).",
        recommendation: "Use structured parsers (e.g., JSON.parse, ast.literal_eval) or safe React JSX rendering.",
        merged_source: "static",
        senior_comment: "CRITICAL: Dynamic code execution! Replace eval() with ast.literal_eval() or JSON parsers."
      });
    }

    // 4. Python Mutable Default Argument
    if (language === 'python' && /def\s+\w+\s*\(.*=\s*(\[\]|\{\})/i.test(cleanLine)) {
      findings.push({
        line: lineNum,
        severity: "HIGH",
        category: "CORRECTNESS",
        title: "Mutable Default Argument Bug",
        description: "Default argument values in Python are evaluated once at function definition time, sharing state across all function calls.",
        recommendation: "Use None as default parameter value and initialize inside function body: log_list = log_list if log_list is not None else []",
        merged_source: "static",
        senior_comment: "HIGH: Mutable default argument bug! Use None as default value."
      });
    }

    // 5. Prime number missing boundary check (ignoring comments)
    if (/def\s+is_prime|function\s+isPrime/i.test(line)) {
      if (!/if\s+.*(n|num|number)\s*(<=?|<)\s*[012]/.test(codeWithoutComments)) {
        findings.push({
          line: lineNum,
          severity: "HIGH",
          category: "LOGIC_BUG",
          title: "Missing Boundary Check for Numbers <= 1 in is_prime",
          description: "Function `is_prime` lacks boundary checks for inputs <= 1. Numbers 1, 0, and negative integers will incorrectly return True.",
          recommendation: "Add `if n <= 1: return False` at the top of the function.",
          merged_source: "static",
          senior_comment: "Bug: 1, 0, and negative numbers are not prime! Add an initial boundary check `if n <= 1: return False`."
        });
      }
    }

    // 6. Off-by-one Square Root Range Bug (flexible whitespace regex)
    if (/range\s*\(\s*2\s*,\s*int\s*\([^)]*(\*\*|sqrt)[^)]*\)\s*\)/i.test(cleanLine)) {
      if (!cleanLine.includes("+")) {
        findings.push({
          line: lineNum,
          severity: "HIGH",
          category: "LOGIC_BUG",
          title: "Off-by-One Range Boundary in Square Root Loop",
          description: "Loop `range(2, int(n ** 0.5))` excludes the square root itself, causing perfect squares like 4, 9, 25, 49 to be incorrectly identified as prime.",
          recommendation: "Use `range(2, int(n ** 0.5) + 1)` to include the square root value.",
          merged_source: "static",
          senior_comment: "Off-by-one bug! Range in Python excludes the upper bound, so `range(2, 3)` only checks 2 and skips 3."
        });
      }
    }

    // 7. Early Return Bug inside Loop (e.g. return True inside for loop)
    if (insideLoopIndent !== -1 && (trimmed === "return True" || trimmed === "return true")) {
      findings.push({
        line: lineNum,
        severity: "HIGH",
        category: "LOGIC_BUG",
        title: "Early Return Bug Inside Loop Execution",
        description: "`return True` is indented inside the loop body, causing the loop to exit prematurely on the very first iteration.",
        recommendation: "Move `return True` outside the loop body so all candidate divisors are checked.",
        merged_source: "static",
        senior_comment: "Indentation bug! Returning True inside the loop stops checking after the first iteration."
      });
    }

    // 8. Missing Request Timeout
    if (/requests\.(get|post|put|delete)/i.test(cleanLine) && !cleanLine.includes("timeout")) {
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

    // 9. React Direct State Mutation
    if (language === 'javascript' || language === 'typescript') {
      if (/userData\.\w+\s*=|data\.\w+\s*=/i.test(cleanLine) && !cleanLine.includes("setUserData")) {
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

  // Calculate counts and health score (Deduct for CRITICAL, HIGH, MEDIUM errors)
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, static: findings.length, ai: 0, hybrid: 0 };
  let totalDeduction = 0;

  findings.forEach(f => {
    const sev = f.severity;
    if (sev === "CRITICAL") { counts.critical++; totalDeduction += 25; }
    else if (sev === "HIGH") { counts.high++; totalDeduction += 15; }
    else if (sev === "MEDIUM") { counts.medium++; totalDeduction += 8; }
    else if (sev === "LOW") { counts.low++; }
    else { counts.info++; }
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
    summary: findings.length === 0 ? "Clean code snippet. No security vulnerabilities or logic bugs detected." : `Client-Side Review completed. Found ${findings.length} security & logic issues.`,
    all_findings: findings,
    counts: counts,
    refactored_code: code,
    refactor_explanation: "Code review executed.",
    persona_used: `${persona} (Browser Engine)`,
    github_markdown_comment: `## 🛡️ BugShield AI Review Summary\n\n- **Health Score**: ${healthScore}/100\n- **Issues Found**: ${findings.length}\n- **Rating**: ${overallRating}`
  };
}
