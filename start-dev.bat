@echo off
echo 🚀 Starting ChatTrix development environment...

echo.
echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd server && npm start"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Starting frontend development server...
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ Both servers are starting...
echo 📱 Frontend will be available at: http://localhost:3000
echo 🔧 Backend will be available at: http://localhost:5000
echo.
echo Press any key to close this window...
pause >nul 