import re
import httpx
from typing import Dict, Any, List

class GitHubService:
    """
    Service to interface with GitHub API for PR diff extraction, file content fetching,
    and generating PR review comments.
    """

    @staticmethod
    def parse_github_url(url: str) -> Dict[str, Any]:
        """
        Parses URLs like:
        - https://github.com/owner/repo/pull/123
        - https://github.com/owner/repo/blob/main/path/to/file.py
        """
        pr_match = re.search(r'github\.com/([^/]+)/([^/]+)/pull/(\d+)', url)
        if pr_match:
            return {
                "type": "pr",
                "owner": pr_match.group(1),
                "repo": pr_match.group(2),
                "pr_number": int(pr_match.group(3))
            }

        file_match = re.search(r'github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)', url)
        if file_match:
            return {
                "type": "file",
                "owner": file_match.group(1),
                "repo": file_match.group(2),
                "branch": file_match.group(3),
                "filepath": file_match.group(4)
            }

        raise ValueError("Invalid GitHub URL. Must be a PR URL (e.g. github.com/owner/repo/pull/1) or file URL.")

    async def fetch_pr_details(self, url: str) -> Dict[str, Any]:
        parsed = self.parse_github_url(url)
        headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "AICodeReviewerApp"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            if parsed["type"] == "pr":
                owner, repo, pr_num = parsed["owner"], parsed["repo"], parsed["pr_number"]
                
                # Fetch PR metadata
                pr_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_num}", headers=headers)
                pr_resp.raise_for_status()
                pr_data = pr_resp.json()

                # Fetch PR changed files
                files_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_num}/files", headers=headers)
                files_resp.raise_for_status()
                files_data = files_resp.json()

                changed_files = []
                for f in files_data:
                    changed_files.append({
                        "filename": f.get("filename"),
                        "status": f.get("status"),
                        "additions": f.get("additions"),
                        "deletions": f.get("deletions"),
                        "patch": f.get("patch", ""),
                        "raw_url": f.get("raw_url")
                    })

                return {
                    "title": pr_data.get("title"),
                    "owner": owner,
                    "repo": repo,
                    "pr_number": pr_num,
                    "author": pr_data.get("user", {}).get("login"),
                    "html_url": pr_data.get("html_url"),
                    "changed_files": changed_files
                }

            elif parsed["type"] == "file":
                owner, repo, branch, filepath = parsed["owner"], parsed["repo"], parsed["branch"], parsed["filepath"]
                raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{filepath}"
                
                resp = await client.get(raw_url)
                resp.raise_for_status()
                
                return {
                    "title": f"{filepath} ({branch})",
                    "owner": owner,
                    "repo": repo,
                    "branch": branch,
                    "changed_files": [{
                        "filename": filepath,
                        "status": "modified",
                        "patch": "",
                        "raw_content": resp.text
                    }]
                }

    @staticmethod
    def generate_markdown_pr_comment(review_report: Dict[str, Any]) -> str:
        """
        Generates GitHub PR markdown comment template for senior engineer review summary.
        """
        score = review_report.get("health_score", 100)
        rating = review_report.get("overall_rating", "GOOD")
        counts = review_report.get("counts", {})
        findings = review_report.get("all_findings", [])

        status_emoji = "🟢" if score >= 85 else ("🟡" if score >= 60 else "🔴")

        md = f"""## {status_emoji} AI Code Review Summary

**Overall Health Score**: `{score}/100` (`{rating}`)
**Summary**: {review_report.get('summary', 'Automated PR code review completed.')}

### 📊 Findings Breakdown
| Severity | Count | Source |
| :--- | :--- | :--- |
| 🚨 **Critical** | {counts.get('critical', 0)} | {counts.get('static', 0)} Static / {counts.get('ai', 0)} AI |
| ⚠️ **High** | {counts.get('high', 0)} | |
| ⚡ **Medium** | {counts.get('medium', 0)} | |
| ℹ️ **Low / Info** | {counts.get('low', 0) + counts.get('info', 0)} | |

---

### 🔍 Detailed Review Comments

"""
        for idx, f in enumerate(findings, 1):
            sev_icon = "🚨" if f.get("severity") == "CRITICAL" else ("⚠️" if f.get("severity") == "HIGH" else "⚡")
            md += f"""#### {sev_icon} [{f.get('severity')}] Line {f.get('line')}: {f.get('title')}
- **Category**: {f.get('category')} ({f.get('source')})
- **Issue**: {f.get('description')}
- **Suggested Fix**: `{f.get('suggestion')}`

"""
            if f.get("senior_comment"):
                md += f"> **Senior Engineer Note**: {f.get('senior_comment')}\n\n"

        if review_report.get("refactored_code"):
            md += f"""---
<details>
<summary>💡 <b>Click to view AI Refactored Solution Patch</b></summary>

```python
{review_report.get('refactored_code')}
```
</details>
"""

        md += "\n\n*Automated review powered by Hybrid Static Analysis + Google Gemini AI Code Reviewer.*"
        return md
