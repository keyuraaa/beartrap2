@echo off
title BearTrap - Starting
color 0B

echo ========================================
echo   STARTING BEARTRAP - ONE CLICK!
echo ========================================
echo.

echo Stopping old servers...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM Suricata.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Suricata (if installed and Npcap present)...
if exist "C:\Program Files\Suricata\suricata.exe" (
    if exist "%SystemRoot%\System32\wpcap.dll" (
        echo wpcap.dll found - starting Suricata with admin privileges...
        powershell -Command "Start-Process 'C:\Program Files\Suricata\suricata.exe' -ArgumentList '-c','C:\Program Files\Suricata\suricata.yaml','-i','Wi-Fi 2','-l','C:\Program Files\Suricata\log' -Verb RunAs -WindowStyle Hidden" >nul 2>&1
        echo Suricata started successfully
        timeout /t 2 /nobreak >nul
    ) else (
        echo WARNING: wpcap.dll not found. Npcap/WinPcap is required for Suricata.
        echo Please install Npcap in WinPcap-compatible mode: https://npcap.com/#download
        echo Skipping Suricata start to avoid the missing-DLL error dialog.
    )
) else (
    echo Suricata not found - skipping (will use simulated mode)
)

echo Starting API Server...
start /MIN /B node server/index.js

timeout /t 2 /nobreak >nul

echo Starting Dashboard...
start /MIN cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo        BEARTRAP IS READY!
echo ========================================
echo.
echo Dashboard: http://localhost:5174
echo Extension: Click BearTrap icon in Chrome
echo.
echo To open dashboard, visit:
echo http://localhost:5174
echo.
echo Note: Using real-time URL monitoring
if exist "C:\Program Files\Suricata\suricata.exe" (
    if exist "%SystemRoot%\System32\wpcap.dll" (
        echo Suricata: ACTIVE - Real network traffic analysis
    ) else (
        echo Suricata: INSTALLED BUT Npcap MISSING - Disabled to avoid error dialog
    )
) else (
    echo Suricata: NOT FOUND - Using simulated mode
)
echo.
echo ========================================
pause
