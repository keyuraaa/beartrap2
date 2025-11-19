@echo off
title BearTrap Control Panel
color 0A

:menu
cls
echo ========================================
echo       BEARTRAP CONTROL PANEL
echo ========================================
echo.
echo 1. Start All Servers
echo 2. Stop All Servers
echo 3. Restart All Servers
echo 4. Start Suricata IDS
echo 5. Open Admin Dashboard
echo 6. Exit
echo.
echo ========================================

set /p choice=Enter your choice (1-6): 

if "%choice%"=="1" goto start_servers
if "%choice%"=="2" goto stop_servers
if "%choice%"=="3" goto restart_servers
if "%choice%"=="4" goto start_suricata
if "%choice%"=="5" goto open_dashboard
if "%choice%"=="6" goto exit

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu

:start_servers
cls
echo Starting BearTrap servers...
echo.

echo [1/3] Stopping any existing servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting API Server (port 5173)...
start /B node server/index.js
timeout /t 2 /nobreak >nul

echo [3/3] Starting Dashboard (port 5174)...
start cmd /k "title BearTrap Dashboard && npm run dev"

echo.
echo ========================================
echo SUCCESS! Servers are starting...
echo ========================================
echo API Server: http://localhost:5173
echo Dashboard:  http://localhost:5174
echo ========================================
echo.
pause
goto menu

:stop_servers
cls
echo Stopping all servers...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo All servers stopped.
echo.
pause
goto menu

:restart_servers
cls
echo Restarting servers...
echo.
echo Stopping...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting...
start /B node server/index.js
timeout /t 2 /nobreak >nul
start cmd /k "title BearTrap Dashboard && npm run dev"
echo.
echo Servers restarted!
echo.
pause
goto menu

:start_suricata
cls
echo ========================================
echo       STARTING SURICATA IDS
echo ========================================
echo.
if not exist "C:\Program Files\Suricata\suricata.exe" (
    echo ERROR: Suricata not found!
    echo Please install Suricata first.
    pause
    goto menu
)

echo This requires Administrator privileges...
echo A UAC prompt will appear.
echo.
pause

start "" "start-suricata.bat"

goto menu

:open_dashboard
cls
echo Opening Admin Dashboard...
start http://localhost:5174
timeout /t 1 /nobreak >nul
goto menu

:exit
cls
echo.
echo Do you want to stop the servers before exiting? (Y/N)
set /p stop_choice=
if /i "%stop_choice%"=="Y" (
    echo Stopping servers...
    taskkill /F /IM node.exe >nul 2>&1
    echo Servers stopped.
)
echo.
echo Goodbye!
timeout /t 2 /nobreak >nul
exit
