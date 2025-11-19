@echo off
REM Start Suricata with proper permissions and visible console for debugging

cd /d "C:\Program Files\Suricata"

echo Starting Suricata IDS...
echo Interface: Wi-Fi 2
echo Config: suricata.yaml
echo Log directory: C:\Program Files\Suricata\log
echo.

REM Create log directory if it doesn't exist
if not exist "log" mkdir log

REM Start Suricata in the foreground to see output
echo.
echo Suricata is now capturing traffic on Wi-Fi 2...
echo Press Ctrl+C to stop
echo.
suricata.exe -c suricata.yaml -i "Wi-Fi 2" -l log -vv

echo.
echo Suricata stopped.
pause
