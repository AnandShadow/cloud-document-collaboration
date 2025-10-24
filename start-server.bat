@echo off
cd /d "%~dp0backend"
echo.
echo ================================================
echo    Starting CollabDocs Backend Server
echo ================================================
echo.
node server-demo.js
pause
