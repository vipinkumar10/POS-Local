@echo off
setlocal
title POS Local - Startup Script

echo ===================================================
echo   Starting POS Local (Frontend + Backend)
echo ===================================================

:: Start Frontend
echo Starting Frontend (Vite)...
start "POS Frontend" cmd /k "npm run dev"

:: Start Backend
echo Starting Backend (Spring Boot)...
start "POS Backend" cmd /k "cd pos-backend && mvn spring-boot:run"

echo.
echo Both services have been launched in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo.
echo Press any key to exit this script (services will keep running).
pause > nul
endlocal
