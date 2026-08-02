@echo off
title Starting BugShield AI...
echo ========================================================
echo          Starting BugShield AI Code Reviewer...
echo ========================================================

:: 1. Start Python FastAPI Backend
start "BugShield Backend API" cmd /k "cd /d C:\project\ai-code-reviewer\backend && python main.py"

:: 2. Start Vite React Frontend
start "BugShield Frontend UI" cmd /k "cd /d C:\project\ai-code-reviewer\frontend && npm run dev"

:: 3. Wait 3 seconds and open Web Browser automatically
echo Launching Web App in your browser...
timeout /t 3 >nul
start http://localhost:5173
