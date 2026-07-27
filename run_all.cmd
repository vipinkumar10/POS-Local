@echo off
setlocal
title POS Local - Startup Script

echo ===================================================
echo   Starting POS Local (Frontend + Backend)
echo ===================================================

:: Create logs directory if missing
if not exist logs mkdir logs

:: Disable colors for clean text logs
set NO_COLOR=1

:: Start Frontend
echo Starting Frontend (Vite)...
echo Logs will be saved to logs\frontend.log
start "POS Frontend" cmd /c "set NO_COLOR=1 && npm run dev > logs\frontend.log 2>&1"

:: Start Backend
echo Starting Backend (Spring Boot)...
echo Logs will be saved to logs\backend.log
start "POS Backend" cmd /c "set NO_COLOR=1 && cd pos-backend && mvn spring-boot:run > ..\logs\backend.log 2>&1"

echo.
echo Both services have been launched in background windows.
echo Check the 'logs' folder for output.
echo.
echo Press any key to exit this script.
pause > nul
endlocal
