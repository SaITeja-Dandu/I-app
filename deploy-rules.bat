@echo off
echo Deploying Firebase Security Rules...
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo Firebase CLI is not installed.
    echo Install it with: npm install -g firebase-tools
    exit /b 1
)

echo Firebase CLI found
echo.

REM Check if user is logged in
firebase projects:list >nul 2>nul
if %errorlevel% neq 0 (
    echo Not logged in to Firebase.
    echo Please run: firebase login
    exit /b 1
)

echo Authenticated with Firebase
echo.

REM Show current project
echo Current Firebase project:
firebase use
echo.

echo Choose deployment option:
echo   1) Deploy Firestore rules only
echo   2) Deploy Storage rules only
echo   3) Deploy both Firestore and Storage rules
echo   4) Deploy rules and indexes
echo   5) Start local emulators (for testing)
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Deploying Firestore rules...
    firebase deploy --only firestore:rules
) else if "%choice%"=="2" (
    echo.
    echo Deploying Storage rules...
    firebase deploy --only storage
) else if "%choice%"=="3" (
    echo.
    echo Deploying Firestore and Storage rules...
    firebase deploy --only firestore:rules,storage
) else if "%choice%"=="4" (
    echo.
    echo Deploying rules and indexes...
    firebase deploy --only firestore,storage
) else if "%choice%"=="5" (
    echo.
    echo Starting Firebase emulators...
    echo Emulator UI: http://localhost:4000
    echo Firestore: http://localhost:8080
    echo Storage: http://localhost:9199
    echo Auth: http://localhost:9099
    echo.
    firebase emulators:start
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo Deployment complete!
echo.
echo Next steps:
echo   - Test rules with Firebase emulators
echo   - Monitor rule violations in Firebase Console
echo   - Check Firestore/Storage usage metrics
echo.

pause
