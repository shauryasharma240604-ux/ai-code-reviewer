import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from analyzers.static_analyzer import StaticCodeAnalyzer
from analyzers.pipeline import ReviewPipeline

def test_static_analyzer_python_sqli():
    analyzer = StaticCodeAnalyzer()
    bad_code = "def get_user(user_id):\n    return db.execute(f'SELECT * FROM users WHERE id = {user_id}')"
    findings = analyzer.analyze(bad_code, "python")
    
    titles = [f["title"] for f in findings]
    assert any("SQL Injection" in t for t in titles)

def test_static_analyzer_secret_leak():
    analyzer = StaticCodeAnalyzer()
    secret_code = 'AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE123456"'
    findings = analyzer.analyze(secret_code, "python")
    
    assert len(findings) > 0
    assert any(f["severity"] == "CRITICAL" for f in findings)

def test_static_analyzer_js_var():
    analyzer = StaticCodeAnalyzer()
    js_code = "var x = 10;\nvar name = 'Alice';"
    findings = analyzer.analyze(js_code, "javascript")
    
    titles = [f["title"] for f in findings]
    assert any("var" in t for t in titles)

def test_pipeline_fallback():
    pipeline = ReviewPipeline(api_key=None)
    py_code = """
def process_data(items=[]):
    print("Processing items...")
    eval("2 + 2")
    return len(items)
"""
    result = pipeline.run_review(py_code, "python", snippet_title="Test Mutable & Eval")
    assert result["health_score"] < 90
    assert len(result["all_findings"]) >= 2
    assert "refactored_code" in result
    assert result["refactored_code"] != ""
