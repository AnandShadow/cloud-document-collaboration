@echo off
REM CollabDocs Installation Script for Windows
REM This script helps set up the CollabDocs platform

echo ================================================
echo    CollabDocs Installation Script
echo    Cloud Collaboration Platform
echo ================================================
echo.

REM Check Node.js
echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    node -v
    echo [OK] Node.js is installed
)

REM Check npm
echo Checking npm installation...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] npm is not installed
    pause
    exit /b 1
) else (
    npm -v
    echo [OK] npm is installed
)

REM Check Python
echo Checking Python installation...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Python is not installed
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
) else (
    python --version
    echo [OK] Python is installed
)

echo.
echo Installing dependencies...
echo.

REM Install root dependencies
echo Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to install root dependencies
    pause
    exit /b 1
)
echo [OK] Root dependencies installed

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
cd ..

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..

REM Install AI service dependencies
echo.
echo Installing AI service dependencies...
cd ai-service
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [!] Failed to install some AI service dependencies
)
echo [OK] AI service dependencies installed

REM Download NLP models
echo.
echo Downloading NLP models...
python setup.py
if %ERRORLEVEL% NEQ 0 (
    echo [!] Failed to download some NLP models
)
echo [OK] NLP models setup complete
cd ..

REM Create environment files
echo.
echo Setting up environment files...

if not exist ".env" (
    copy .env.example .env
    echo [OK] Created .env file (root)
    echo [!] Please update .env with your Firebase credentials
) else (
    echo [!] .env file already exists (root)
)

if not exist "frontend\.env" (
    copy frontend\.env.example frontend\.env
    echo [OK] Created .env file (frontend)
    echo [!] Please update frontend\.env with your Firebase credentials
) else (
    echo [!] .env file already exists (frontend)
)

REM Check for Firebase service account key
echo.
echo Checking Firebase service account key...
if not exist "serviceAccountKey.json" (
    echo [!] serviceAccountKey.json not found
    echo Please download it from Firebase Console
) else (
    echo [OK] serviceAccountKey.json found
)

REM Installation complete
echo.
echo ================================================
echo    Installation Complete!
echo ================================================
echo.
echo Next steps:
echo.
echo 1. Configure Firebase:
echo    - Update .env files with your Firebase credentials
echo    - Place serviceAccountKey.json in the root directory
echo    - See FIREBASE_SETUP.md for detailed instructions
echo.
echo 2. Start the development servers:
echo    npm run dev
echo.
echo 3. Access the application:
echo    Frontend:   http://localhost:3000
echo    Backend:    http://localhost:5000
echo    AI Service: http://localhost:5001
echo.
echo For more information, see:
echo   - README.md for complete documentation
echo   - QUICK_START.md for a quick guide
echo   - TROUBLESHOOTING.md for common issues
echo.
echo Happy collaborating!
echo.
pause
