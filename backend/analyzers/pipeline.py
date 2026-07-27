from typing import List, Dict, Any, Optional
from .static_analyzer import StaticCodeAnalyzer
from .ai_analyzer import AICodeAnalyzer

class ReviewPipeline:
    """
    Hybrid Code Review Pipeline combining deterministic static analysis
    and contextual LLM AI reasoning into a merged, deduplicated, ranked report.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.static_analyzer = StaticCodeAnalyzer()
        self.ai_analyzer = AICodeAnalyzer(api_key=api_key)

    def run_review(
        self,
        code: str,
        language: str,
        snippet_title: str = "Untitled Snippet",
        persona: str = "Senior SDE"
    ) -> Dict[str, Any]:
        if not code or not code.strip():
            return {
                "health_score": 100,
                "overall_rating": "EXCELLENT",
                "summary": "Empty code snippet provided.",
                "all_findings": [],
                "counts": {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0, "static": 0, "ai": 0},
                "refactored_code": code,
                "refactor_explanation": "No changes made."
            }

        # Step 1: Run Static Analysis Layer (0 ms latency, deterministic)
        static_findings = self.static_analyzer.analyze(code, language)

        # Step 2: Run AI Layer with Static Analysis Context
        ai_result = self.ai_analyzer.analyze(code, language, static_findings, persona=persona)
        ai_findings = ai_result.get("findings", [])

        # Step 3: Merge & Deduplicate Findings
        merged_findings = self._merge_and_deduplicate(static_findings, ai_findings)

        # Step 4: Calculate Health Index & Counts
        counts, health_score = self._calculate_health_metrics(merged_findings)

        overall_rating = ai_result.get("overall_rating")
        if not overall_rating:
            if health_score >= 90:
                overall_rating = "EXCELLENT"
            elif health_score >= 75:
                overall_rating = "GOOD"
            elif health_score >= 50:
                overall_rating = "NEEDS_WORK"
            else:
                overall_rating = "CRITICAL_REVISION"

        return {
            "snippet_title": snippet_title,
            "language": language,
            "code_snippet": code,
            "health_score": health_score,
            "overall_rating": overall_rating,
            "summary": ai_result.get("summary", "Code review completed successfully."),
            "all_findings": merged_findings,
            "counts": counts,
            "refactored_code": ai_result.get("refactored_code", code),
            "refactor_explanation": ai_result.get("refactor_explanation", "Code improvements applied."),
            "persona_used": persona
        }

    def _merge_and_deduplicate(
        self,
        static_findings: List[Dict[str, Any]],
        ai_findings: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        merged = []
        seen_lines_title = set()

        # Add static findings first (deterministic baseline)
        for sf in static_findings:
            key = (sf.get("line"), sf.get("title", "").lower()[:20])
            seen_lines_title.add(key)
            sf["merged_source"] = "static"
            merged.append(sf)

        # Add AI findings, tagging overlapping items as 'hybrid'
        for af in ai_findings:
            key = (af.get("line"), af.get("title", "").lower()[:20])
            if key in seen_lines_title:
                # Find matching static issue and upgrade it to 'hybrid'
                for item in merged:
                    if (item.get("line"), item.get("title", "").lower()[:20]) == key:
                        item["merged_source"] = "hybrid"
                        item["senior_comment"] = af.get("senior_comment") or af.get("description")
                        item["ai_enhanced_description"] = af.get("description")
                        break
            else:
                af["merged_source"] = "ai"
                merged.append(af)

        # Sort findings by line number, then severity priority
        severity_weight = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        merged.sort(key=lambda x: (x.get("line", 0), severity_weight.get(x.get("severity", "INFO"), 5)))

        return merged

    def _calculate_health_metrics(self, findings: List[Dict[str, Any]]) -> tuple:
        counts = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0,
            "static": 0,
            "ai": 0,
            "hybrid": 0
        }

        score_deductions = {
            "CRITICAL": 25,
            "HIGH": 15,
            "MEDIUM": 8,
            "LOW": 3,
            "INFO": 1
        }

        total_deduction = 0

        for f in findings:
            sev = f.get("severity", "INFO").upper()
            src = f.get("merged_source", "static")

            if sev == "CRITICAL":
                counts["critical"] += 1
            elif sev == "HIGH":
                counts["high"] += 1
            elif sev == "MEDIUM":
                counts["medium"] += 1
            elif sev == "LOW":
                counts["low"] += 1
            else:
                counts["info"] += 1

            if src == "static":
                counts["static"] += 1
            elif src == "ai":
                counts["ai"] += 1
            elif src == "hybrid":
                counts["hybrid"] += 1
                counts["static"] += 1
                counts["ai"] += 1

            total_deduction += score_deductions.get(sev, 1)

        health_score = max(0, 100 - total_deduction)
        return counts, health_score
