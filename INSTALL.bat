@echo off
title BearTrap Installation
color 0B

echo ========================================
echo     BEARTRAP INSTALLATION WIZARD
echo ========================================
echo.
echo This will install all required dependencies.
echo This may take a few minutes...
echo.
pause

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo https://nodejs.org/
    echo.
    echo Download the LTS version and run this installer again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

:: Check npm version
echo Checking npm version...
call npm --version
echo.

:: Install dependencies
echo ========================================
echo Installing BearTrap dependencies...
echo ========================================
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed!
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo     INSTALLATION SUCCESSFUL!
echo ========================================
echo.
echo Next steps:
echo 1. Double-click start-beartrap.bat to launch BearTrap
echo 2. Dashboard will open automatically in your browser
echo 3. Start monitoring websites and network traffic!
echo.
echo Optional:
echo - Install Chrome Extension from extension/ folder
echo - Install Suricata IDS for real-time network monitoring
echo.
echo ========================================
echo.
pause
