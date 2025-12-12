@echo off
echo ==========================================
echo Starting StyleSphere Development Environment
echo ==========================================
echo.
echo [1/2] Starting Backend Server (Port 4000)...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
start "StyleSphere Backend" npm run dev
cd ..

echo [2/2] Starting Frontend App...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
start "StyleSphere Frontend" npm run dev
cd ..

echo.
echo ==========================================
echo StyleSphere is running!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173 (usually)
echo.
echo Do not close the terminal windows that opened.
echo ==========================================
pause
