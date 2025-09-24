@echo off
echo Starting MiBudget development servers...

echo.
echo Creating data directory...
if not exist "data" mkdir data

echo.
echo Building server...
call pnpm -F mibudget-server build

echo.
echo Starting API server on port 4000...
start "MiBudget API Server" cmd /k "pnpm -F mibudget-server dev"

echo.
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting web development server...
start "MiBudget Web App" cmd /k "pnpm -F mibudget-web dev"

echo.
echo Both servers are starting...
echo API Server: http://localhost:4000
echo Web App: http://localhost:5173 (or next available port)
echo.
echo Press any key to exit...
pause >nul