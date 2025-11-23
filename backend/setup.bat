@echo off
echo Setting up Interview Marketplace Backend...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js 20+ first.
    exit /b 1
)

echo Node.js version:
node --version

REM Navigate to backend directory
cd backend

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

REM Check if .env exists
if not exist .env (
    echo.
    echo .env file not found. Creating from template...
    copy .env.example .env
    echo.
    echo Please edit backend\.env with your credentials:
    echo    - FIREBASE_PROJECT_ID
    echo    - FIREBASE_PRIVATE_KEY
    echo    - FIREBASE_CLIENT_EMAIL
    echo    - STRIPE_SECRET_KEY
    echo    - STRIPE_WEBHOOK_SECRET
    echo    - DAILY_API_KEY
    echo.
)

REM Build TypeScript
echo Building TypeScript...
call npm run build

echo.
echo Backend setup complete!
echo.
echo To start the development server:
echo   cd backend
echo   npm run dev
echo.
echo To start the production server:
echo   cd backend
echo   npm start
echo.

pause
