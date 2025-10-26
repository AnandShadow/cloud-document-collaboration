@echo off
REM CollabDocs AI-Powered Server Startup Script
echo ========================================
echo   CollabDocs AI-Powered Backend
echo ========================================
echo.

REM Set OpenAI API Key (Optional - Get from https://platform.openai.com/api-keys)
set OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

echo ✅ OpenAI API Key configured
echo.

REM Navigate to backend directory
cd /d "%~dp0backend"

echo 🚀 Starting CollabDocs server...
echo.

REM Start Node.js server
node server-demo.js

pause
