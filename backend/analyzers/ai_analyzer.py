import os
import re
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class AICodeAnalyzer:
    """
    LLM Code Analysis Engine powered by Google Gemini.
    Incorporates static analysis context to provide deep logic review, edge-case detection,
    senior engineer PR comments, and automatic refactored code patches.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    def analyze(
        self,
        code: str,
        language: str,
        static_findings: List[Dict[str, Any]],
        persona: str = "Senior SDE"
    ) -> Dict[str, Any]:
        """
        Runs Gemini LLM review with static analysis context injection.
        Returns structured review JSON.
        """
        if self.api_key and self.api_key.strip():
            try:
                return self._call_gemini_api(code, language, static_findings, persona)
            except Exception as e:
                logger.error(f"Gemini API call failed, falling back to heuristic AI engine: {e}")
                return self._generate_intelligent_fallback(code, language, static_findings, persona, error_msg=str(e))
        else:
            return self._generate_intelligent_fallback(code, language, static_findings, persona)

    def _call_gemini_api(
        self,
        code: str,
        language: str,
        static_findings: List[Dict[str, Any]],
        persona: str
    ) -> Dict[str, Any]:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            static_summary = json.dumps([
                {"line": f.get("line"), "title": f.get("title"), "rule": f.get("rule_id")}
                for f in static_findings
            ], indent=2)

            prompt = f"""
You are acting as a world-class {persona} conducting a rigorous Pull Request code review.

CODE TO REVIEW ({language}):
```
{code}
```

STATIC ANALYSIS CONTEXT ALREADY DETECTED:
```json
{static_summary}
```

YOUR INSTRUCTIONS:
1. Review the code deeply for:
   - Logic bugs, off-by-one errors, race conditions, edge cases (empty inputs, nulls, high concurrency).
   - Security vulnerabilities not caught by static tools.
   - Code readability, performance, scalability, and adherence to clean architecture principles.
   - Do NOT duplicate the exact static analysis rules already found, but validate them or add deeper context.
2. Provide a senior engineer PR summary of the review.
3. Provide a complete, fully refactored, production-ready version of the code that fixes all bugs and static issues.
4. Output MUST be valid JSON adhering strictly to the JSON schema below.

JSON SCHEMA REQUIREMENT:
{{
  "summary": "High-level summary of code health and key architectural feedback",
  "overall_rating": "EXCELLENT | GOOD | NEEDS_WORK | CRITICAL_REVISION",
  "findings": [
    {{
      "id": "AI-001",
      "line": 5,
      "title": "Short descriptive title of the issue",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "Logic Bug" | "Edge Case" | "Security" | "Performance" | "Readability",
      "source": "AI Senior Reviewer",
      "description": "Detailed explanation of the defect and why it matters in real production environments.",
      "suggestion": "Specific actionable suggestion for how to refactor this line or block.",
      "senior_comment": "Direct pull request comment formatted like a friendly senior mentor's note."
    }}
  ],
  "refactored_code": "Complete corrected string of code with all issues resolved",
  "refactor_explanation": "Summary of key architectural improvements applied in the refactored code"
}}
"""

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )

            result_text = response.text
            data = json.loads(result_text)
            return data
        except Exception as err:
            logger.warning(f"Native genai SDK failed, attempting REST fallback: {err}")
            return self._call_gemini_rest(code, language, static_findings, persona)

    def _call_gemini_rest(
        self,
        code: str,
        language: str,
        static_findings: List[Dict[str, Any]],
        persona: str
    ) -> Dict[str, Any]:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
        
        static_summary = json.dumps([
            {"line": f.get("line"), "title": f.get("title")}
            for f in static_findings
        ])

        prompt_text = f"""Act as a {persona} performing code review on this {language} code:
```
{code}
```
Static analysis findings context: {static_summary}

Respond ONLY with valid JSON in this exact structure:
{{
  "summary": "Summary string",
  "overall_rating": "NEEDS_WORK",
  "findings": [
    {{
      "id": "AI-1",
      "line": 1,
      "title": "Issue title",
      "severity": "HIGH",
      "category": "Logic Bug",
      "source": "AI Senior Reviewer",
      "description": "Detailed reason",
      "suggestion": "Fix suggestion",
      "senior_comment": "Senior engineer note"
    }}
  ],
  "refactored_code": "Full corrected code",
  "refactor_explanation": "Explanation of fixes"
}}"""

        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            res_data = resp.json()
            raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text)

    def _generate_intelligent_fallback(
        self,
        code: str,
        language: str,
        static_findings: List[Dict[str, Any]],
        persona: str,
        error_msg: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Intelligent offline/fallback analyzer that generates context-aware senior engineer comments,
        edge case insights, and refactored code solutions when API keys are omitted or offline.
        """
        lines = code.splitlines()
        findings = []

        # Logic & Edge case analysis heuristics
        if "python" in language.lower():
            if "def " in code:
                # Find function signatures without type hints or docstrings
                for idx, line in enumerate(lines, 1):
                    if line.strip().startswith("def ") and "->" not in line:
                        func_name = line.split("def ")[1].split("(")[0].strip()
                        findings.append({
                            "id": f"AI-FALLBACK-PY-TYPE-{idx}",
                            "line": idx,
                            "title": f"Missing Type Hints & Docstring in `def {func_name}`",
                            "severity": "LOW",
                            "category": "Readability",
                            "source": "AI Senior Reviewer (Fallback Engine)",
                            "description": f"Function `{func_name}` lacks parameter type hints and a Google/NumPy style docstring.",
                            "suggestion": f"Add explicit type annotations (e.g., `def {func_name}(...) -> ReturnType:`) and docstrings detailing `@param` and `@returns`.",
                            "senior_comment": f"nit: Adding type annotations here will help IDE autocomplete and save developers debugging runtime type errors down the line! 👍"
                        })
                    if "requests." in line and "timeout" not in line:
                        findings.append({
                            "id": f"AI-FALLBACK-PY-TIMEOUT-{idx}",
                            "line": idx,
                            "title": "HTTP Request Missing Explicit Timeout Parameter",
                            "severity": "HIGH",
                            "category": "Edge Case",
                            "source": "AI Senior Reviewer (Fallback Engine)",
                            "description": "Making HTTP network calls without an explicit timeout argument can hang production worker threads indefinitely if downstream servers stall.",
                            "suggestion": "Pass explicit connection/read timeouts, e.g., `requests.get(..., timeout=(3.05, 10))`.",
                            "senior_comment": "In production, missing network timeouts are a top cause of worker thread exhaustion during microservice degradation. Let's add a explicit timeout!"
                        })

        if "javascript" in language.lower() or "typescript" in language.lower() or "react" in language.lower():
            for idx, line in enumerate(lines, 1):
                if "useEffect" in line and "[]" not in line and not re.search(r'\[.*\]', line):
                    findings.append({
                        "id": f"AI-FALLBACK-JS-USEEFFECT-{idx}",
                        "line": idx,
                        "title": "Missing Dependency Array in React useEffect Hook",
                        "severity": "HIGH",
                        "category": "Logic Bug",
                        "source": "AI Senior Reviewer (Fallback Engine)",
                        "description": "A `useEffect` hook without a second dependency array argument runs after every single component render, causing performance degradation or infinite render loops.",
                        "suggestion": "Pass an explicit dependency array `[dep1, dep2]` or `[]` if effect runs once on mount.",
                        "senior_comment": "Be careful here! Running this effect on every render will spawn unnecessary network requests or state updates."
                    })
                if "dangerouslySetInnerHTML" in line:
                    findings.append({
                        "id": f"AI-FALLBACK-JS-XSS-{idx}",
                        "line": idx,
                        "title": "Cross-Site Scripting (XSS) via dangerouslySetInnerHTML",
                        "severity": "CRITICAL",
                        "category": "Security",
                        "source": "AI Senior Reviewer (Fallback Engine)",
                        "description": "Relying on `dangerouslySetInnerHTML` without sanitizing input with DOMPurify exposes the application to DOM XSS attacks.",
                        "suggestion": "Sanitize string inputs with `DOMPurify.sanitize(...)` prior to injection.",
                        "senior_comment": "Injecting unsanitized raw HTML is dangerous! Ensure input is passed through DOMPurify."
                    })

        # Add generic senior engineer review finding if findings are sparse
        if len(findings) == 0:
            findings.append({
                "id": "AI-FALLBACK-GEN-1",
                "line": 1,
                "title": "Concurrency & Error Resilience Consideration",
                "severity": "MEDIUM",
                "category": "Edge Case",
                "source": "AI Senior Reviewer (Fallback Engine)",
                "description": "Consider how this function behaves when input parameters are `None`/`null`, empty collections, or under high concurrent request volume.",
                "suggestion": "Add defensive precondition checks at function entry points.",
                "senior_comment": "Great initial structure! Make sure we test boundary conditions (e.g. zero-length payloads and null values) in our unit test suite."
            })

        # Generate intelligent clean refactored code output
        refactored_lines = []
        for line in lines:
            # Fix print statements automatically
            if re.search(r'^\s*print\(', line):
                indent = line[:len(line) - len(line.lstrip())]
                content = line.strip()[6:-1]
                refactored_lines.append(f"{indent}logger.info({content})")
            # Fix var keywords automatically
            elif re.search(r'\bvar\s+', line):
                refactored_lines.append(line.replace("var ", "const "))
            # Fix bare except automatically
            elif line.strip() == "except:":
                indent = line[:len(line) - len(line.lstrip())]
                refactored_lines.append(f"{indent}except Exception as err:")
            else:
                refactored_lines.append(line)

        refactored_code = "\n".join(refactored_lines)
        if "logger." in refactored_code and "import logging" not in refactored_code and "python" in language.lower():
            refactored_code = "import logging\nlogger = logging.getLogger(__name__)\n\n" + refactored_code

        summary_note = "Local intelligent fallback review completed."
        if error_msg:
            summary_note += f" (Gemini API Notice: {error_msg}. Using offline AI analyzer)."
        elif not self.api_key:
            summary_note += " (No Gemini API key supplied in settings; running offline senior SDE review)."

        return {
            "summary": f"{summary_note} Code logic analyzed for edge-cases, error handling, security, and refactoring potential.",
            "overall_rating": "NEEDS_WORK" if (static_findings or len(findings) > 1) else "GOOD",
            "findings": findings,
            "refactored_code": refactored_code,
            "refactor_explanation": "Applied defensive error handling, replaced debug print/var statements, and injected logger bindings."
        }
