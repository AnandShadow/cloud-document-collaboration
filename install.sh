#!/bin/bash

# CollabDocs Installation Script
# This script helps set up the CollabDocs platform

echo "╔══════════════════════════════════════════╗"
echo "║   CollabDocs Installation Script        ║"
echo "║   Cloud Collaboration Platform          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "🔍 Checking Node.js installation..."
if command -v node &> /dev/null
then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js ${NODE_VERSION} is installed"
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
echo "🔍 Checking npm installation..."
if command -v npm &> /dev/null
then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm ${NPM_VERSION} is installed"
else
    echo -e "${RED}✗${NC} npm is not installed"
    exit 1
fi

# Check Python
echo "🔍 Checking Python installation..."
if command -v python &> /dev/null || command -v python3 &> /dev/null
then
    if command -v python3 &> /dev/null
    then
        PYTHON_VERSION=$(python3 --version)
        PYTHON_CMD="python3"
        PIP_CMD="pip3"
    else
        PYTHON_VERSION=$(python --version)
        PYTHON_CMD="python"
        PIP_CMD="pip"
    fi
    echo -e "${GREEN}✓${NC} ${PYTHON_VERSION} is installed"
else
    echo -e "${RED}✗${NC} Python is not installed"
    echo "Please install Python from https://www.python.org/"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Root dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install root dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install AI service dependencies
echo ""
echo "Installing AI service dependencies..."
cd ai-service
$PIP_CMD install -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} AI service dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install AI service dependencies"
    exit 1
fi

# Download NLP models
echo ""
echo "Downloading NLP models..."
$PYTHON_CMD setup.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} NLP models downloaded"
else
    echo -e "${YELLOW}⚠${NC} Failed to download some NLP models"
fi
cd ..

# Create environment files
echo ""
echo "📝 Setting up environment files..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Created .env file (root)"
    echo -e "${YELLOW}⚠${NC} Please update .env with your Firebase credentials"
else
    echo -e "${YELLOW}⚠${NC} .env file already exists (root)"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✓${NC} Created .env file (frontend)"
    echo -e "${YELLOW}⚠${NC} Please update frontend/.env with your Firebase credentials"
else
    echo -e "${YELLOW}⚠${NC} .env file already exists (frontend)"
fi

# Check for Firebase service account key
echo ""
echo "🔑 Checking Firebase service account key..."
if [ ! -f "serviceAccountKey.json" ]; then
    echo -e "${YELLOW}⚠${NC} serviceAccountKey.json not found"
    echo "Please download it from Firebase Console and place it in the root directory"
else
    echo -e "${GREEN}✓${NC} serviceAccountKey.json found"
fi

# Installation complete
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Installation Complete! 🎉              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure Firebase:"
echo "   - Update .env files with your Firebase credentials"
echo "   - Place serviceAccountKey.json in the root directory"
echo "   - See FIREBASE_SETUP.md for detailed instructions"
echo ""
echo "2. Start the development servers:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   AI Service: http://localhost:5001"
echo ""
echo "For more information, see:"
echo "  - README.md for complete documentation"
echo "  - QUICK_START.md for a quick guide"
echo "  - TROUBLESHOOTING.md for common issues"
echo ""
echo "Happy collaborating! 📝✨"
