import ast
import re
from typing import List, Dict, Any

class StaticCodeAnalyzer:
    """
    Deterministic static code analyzer running AST checks, security vulnerability rules,
    secret leaks, code smell pattern detection, and best practices validation.
    """

    def analyze(self, code: str, language: str) -> List[Dict[str, Any]]:
        findings = []
        lang = language.lower()

        # Secret and API key detector across all languages
        findings.extend(self._scan_secrets(code))

        if lang in ["python", "py"]:
            findings.extend(self._analyze_python(code))
        elif lang in ["javascript", "js", "typescript", "ts", "jsx", "tsx"]:
            findings.extend(self._analyze_javascript(code))
        elif lang in ["go", "golang"]:
            findings.extend(self._analyze_go(code))
        elif lang in ["java", "cpp", "c++"]:
            findings.extend(self._analyze_generic_c_family(code, lang))
        else:
            findings.extend(self._analyze_generic(code))

        return findings

    def _scan_secrets(self, code: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        secret_patterns = [
            (r'(?i)(api[_-]?key|secret[_-]?key|auth[_-]?token|bearer|password)\s*=\s*["\']([A-Za-z0-9_\-\.\~]{16,})["\']', "Hardcoded Secret / API Key Leaked", "CRITICAL", "Hardcoded credentials detected in source code. Extract secrets into environment variables or a secure key store."),
            (r'AIzaSy[A-Za-z0-9_-]{33}', "Google Gemini/Firebase API Key Detected", "CRITICAL", "A live Google API key string was found embedded in code."),
            (r'ghp_[A-Za-z0-9]{36}', "GitHub Personal Access Token Detected", "CRITICAL", "Hardcoded GitHub PAT token detected."),
            (r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}', "Hardcoded JWT Token Detected", "HIGH", "Raw JWT token strings should never be committed into code repositories.")
        ]

        for idx, line in enumerate(lines, 1):
            for pattern, title, severity, desc in secret_patterns:
                if re.search(pattern, line):
                    findings.append({
                        "id": f"STAT-SEC-{idx}",
                        "line": idx,
                        "title": title,
                        "severity": severity,
                        "category": "Security",
                        "source": "Static Analyzer",
                        "description": desc,
                        "suggestion": f"Replace hardcoded credential on line {idx} with `os.environ.get(...)` or process.env variables.",
                        "rule_id": "SEC-001"
                    })
        return findings

    def _analyze_python(self, code: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        # Line regex checks
        for idx, line in enumerate(lines, 1):
            # Print statement check
            if re.search(r'^\s*print\(', line) and not line.strip().startswith('#'):
                findings.append({
                    "id": f"STAT-PY-PRINT-{idx}",
                    "line": idx,
                    "title": "Use Logging Module Instead of print()",
                    "severity": "LOW",
                    "category": "Code Quality",
                    "source": "Static Analyzer",
                    "description": "Using `print()` for debugging in production code makes stdout noisy and lacks log levels, timestamps, or log aggregation integration.",
                    "suggestion": "Import `logging` and replace `print(...)` with `logger.info(...)` or `logger.debug(...)`.",
                    "rule_id": "PY-LOG-001"
                })

            # Bare except check
            if re.search(r'except\s*:', line):
                findings.append({
                    "id": f"STAT-PY-EXCEPT-{idx}",
                    "line": idx,
                    "title": "Bare `except:` Clause Catches SystemExit and KeyboardInterrupt",
                    "severity": "HIGH",
                    "category": "Reliability",
                    "source": "Static Analyzer",
                    "description": "A bare `except:` block catches all exceptions, including `KeyboardInterrupt` and `SystemExit`, masking critical process signals and hiding bugs.",
                    "suggestion": "Specify the concrete exception type, e.g., `except Exception as e:` or `except SpecificError:`.",
                    "rule_id": "PY-EXC-001"
                })

            # Dangerous eval / exec
            if re.search(r'\b(eval|exec)\s*\(', line):
                findings.append({
                    "id": f"STAT-PY-EVAL-{idx}",
                    "line": idx,
                    "title": "Arbitrary Code Execution via eval()/exec()",
                    "severity": "CRITICAL",
                    "category": "Security",
                    "source": "Static Analyzer",
                    "description": "Executing dynamic code strings passed via `eval()` or `exec()` opens severe Remote Code Execution (RCE) vulnerabilities.",
                    "suggestion": "Avoid dynamic code execution. Use `ast.literal_eval()` if parsing safe literal data structures.",
                    "rule_id": "PY-RCE-001"
                })

            # SQL Injection pattern
            if re.search(r'execute\s*\(\s*f["\']|\.execute\s*\(\s*["\'].*%|\.execute\s*\(\s*["\'].*\+', line):
                findings.append({
                    "id": f"STAT-PY-SQLI-{idx}",
                    "line": idx,
                    "title": "Potential SQL Injection Vulnerability",
                    "severity": "CRITICAL",
                    "category": "Security",
                    "source": "Static Analyzer",
                    "description": "Constructing SQL queries using string formatting or f-strings allows attackers to execute arbitrary SQL commands.",
                    "suggestion": "Use parameterized queries with placeholder bindings, e.g., `cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))`.",
                    "rule_id": "PY-SQLI-001"
                })

        # Python AST Parsing
        try:
            tree = ast.parse(code)
            class ASTVisitor(ast.NodeVisitor):
                def __init__(self):
                    self.ast_findings = []

                def visit_FunctionDef(self, node):
                    # Check for mutable default arguments
                    for arg in node.args.defaults:
                        if isinstance(arg, (ast.List, ast.Dict, ast.Set)):
                            self.ast_findings.append({
                                "id": f"STAT-PY-AST-MUT-{node.lineno}",
                                "line": node.lineno,
                                "title": "Mutable Default Argument in Function Definition",
                                "severity": "MEDIUM",
                                "category": "Bug Risk",
                                "source": "Static Analyzer (AST)",
                                "description": f"Function `{node.name}` uses a mutable default value (like list or dict). Default arguments are evaluated once at function definition time, sharing state across calls.",
                                "suggestion": f"Set default parameter value to `None` inside argument list and assign dynamic default inside function body.",
                                "rule_id": "PY-AST-001"
                            })
                    self.generic_visit(node)

            visitor = ASTVisitor()
            visitor.visit(tree)
            findings.extend(visitor.ast_findings)
        except SyntaxError as e:
            findings.append({
                "id": f"STAT-PY-SYNTAX-ERR",
                "line": e.lineno or 1,
                "title": "Python Syntax Error Detected",
                "severity": "CRITICAL",
                "category": "Syntax Error",
                "source": "Static Analyzer (AST)",
                "description": f"SyntaxError: {e.msg} at line {e.lineno}",
                "suggestion": f"Fix invalid Python syntax on line {e.lineno}.",
                "rule_id": "PY-SYNTAX-001"
            })
        except Exception:
            pass

        return findings

    def _analyze_javascript(self, code: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        for idx, line in enumerate(lines, 1):
            # var keyword check
            if re.search(r'\bvar\s+[a-zA-Z_$]', line):
                findings.append({
                    "id": f"STAT-JS-VAR-{idx}",
                    "line": idx,
                    "title": "Use `const` or `let` Instead of Legacy `var`",
                    "severity": "LOW",
                    "category": "Best Practices",
                    "source": "Static Analyzer",
                    "description": "`var` has function scope and variable hoisting behaviors that frequently introduce unexpected bugs.",
                    "suggestion": "Refactor `var` to block-scoped `const` (for immutable bindings) or `let`.",
                    "rule_id": "JS-VAR-001"
                })

            # Loose equality check
            if re.search(r'==(?!=)|!=(?!=)', line) and not ('typeof' in line or 'null' in line):
                findings.append({
                    "id": f"STAT-JS-EQ-{idx}",
                    "line": idx,
                    "title": "Use Strict Equality (`===` / `!==`)",
                    "severity": "MEDIUM",
                    "category": "Bug Risk",
                    "source": "Static Analyzer",
                    "description": "Loose equality operators (`==`, `!=`) trigger implicit type coercion rules in JavaScript, causing subtle bugs.",
                    "suggestion": "Replace `==` or `!=` with strict equality `===` or `!==`.",
                    "rule_id": "JS-EQ-001"
                })

            # eval check
            if re.search(r'\beval\s*\(', line):
                findings.append({
                    "id": f"STAT-JS-EVAL-{idx}",
                    "line": idx,
                    "title": "Dangerous `eval()` Call Detected",
                    "severity": "CRITICAL",
                    "category": "Security",
                    "source": "Static Analyzer",
                    "description": "`eval()` executes arbitrary strings as code in the caller privileges context, leading to XSS and code injection.",
                    "suggestion": "Avoid `eval()`. Parse structured data using `JSON.parse()`.",
                    "rule_id": "JS-SEC-001"
                })

            # React Direct State Mutation
            if re.search(r'this\.state\.[a-zA-Z0-9_]+\s*=', line) or re.search(r'state\.[a-zA-Z0-9_]+\s*=', line):
                findings.append({
                    "id": f"STAT-JS-MUTSTATE-{idx}",
                    "line": idx,
                    "title": "Direct Mutation of React State Detected",
                    "severity": "HIGH",
                    "category": "React Bug",
                    "source": "Static Analyzer",
                    "description": "Mutating state variables directly does not trigger component re-renders in React and leads to inconsistent UI state.",
                    "suggestion": "Use the state setter function provided by `useState` hook or `this.setState()`.",
                    "rule_id": "REACT-MUT-001"
                })

            # Missing await on async function calls
            if re.search(r'\b(fetch|axios\.(get|post|put|delete)|fetchData)\s*\(', line) and not re.search(r'\b(await|return|\.then)\b', line):
                findings.append({
                    "id": f"STAT-JS-UNHANDLED-PROMISE-{idx}",
                    "line": idx,
                    "title": "Unhandled Async Promise Call",
                    "severity": "MEDIUM",
                    "category": "Async / Bug Risk",
                    "source": "Static Analyzer",
                    "description": "Asynchronous API call detected without `await`, `.then()`, or `return`. Unhandled promise rejections will pass silently.",
                    "suggestion": "Add `await` keyword before the async call or handle with `.then().catch()`.",
                    "rule_id": "JS-ASYNC-001"
                })

        return findings

    def _analyze_go(self, code: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        for idx, line in enumerate(lines, 1):
            if re.search(r'_\s*=\s*[a-zA-Z0-9_]+\(.*\)', line):
                findings.append({
                    "id": f"STAT-GO-IGN-ERR-{idx}",
                    "line": idx,
                    "title": "Ignored Returned Error in Go",
                    "severity": "MEDIUM",
                    "category": "Reliability",
                    "source": "Static Analyzer",
                    "description": "Explicitly discarding returned errors with blank identifier `_` ignores runtime failure conditions in Go.",
                    "suggestion": "Capture `err` and check `if err != nil { return err }` properly.",
                    "rule_id": "GO-ERR-001"
                })
        return findings

    def _analyze_generic_c_family(self, code: str, lang: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()

        for idx, line in enumerate(lines, 1):
            if re.search(r'\bstrcpy\s*\(|\bgets\s*\(', line):
                findings.append({
                    "id": f"STAT-C-BOF-{idx}",
                    "line": idx,
                    "title": "Unbounded Buffer Overflow Vulnerability",
                    "severity": "CRITICAL",
                    "category": "Security",
                    "source": "Static Analyzer",
                    "description": "`strcpy()` and `gets()` perform no bounds checking, enabling classic buffer overflow memory corruption attacks.",
                    "suggestion": "Replace with safe bounded alternatives like `strncpy()`, `snprintf()`, or safe string containers.",
                    "rule_id": "C-BOF-001"
                })
        return findings

    def _analyze_generic(self, code: str) -> List[Dict[str, Any]]:
        findings = []
        lines = code.splitlines()
        if len(lines) > 300:
            findings.append({
                "id": "STAT-GEN-FILESIZE",
                "line": 1,
                "title": "Large File Size / High Cyclomatic Complexity",
                "severity": "INFO",
                "category": "Maintainability",
                "source": "Static Analyzer",
                "description": "Source file exceeds 300 lines of code. Large single-file modules are harder to test and maintain.",
                "suggestion": "Consider decomposing this file into smaller, modular sub-components.",
                "rule_id": "GEN-COMPLEX-001"
            })
        return findings
