@echo off
cd /d %~dp0
echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)
echo Starting development server...
start cmd /k "pnpm run dev"
timeout /t 5
start http://localhost:3000