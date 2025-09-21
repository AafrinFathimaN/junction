@echo off
echo Starting Junction Genius Railway Control System...
echo.

echo [1/3] Installing frontend dependencies...
cd junction-genius-main
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Installing backend dependencies...
cd backend
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Starting services...
echo Starting backend server on http://localhost:8000
start "Backend Server" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend server on http://localhost:8080
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Junction Genius is starting up!
echo.
echo 🌐 Frontend: http://localhost:8080
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul
