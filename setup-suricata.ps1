# Quick Suricata Setup Script for BearTrap
# Run this as Administrator

Write-Host "=== BearTrap Suricata Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Check if Suricata is installed
$suricataPath = "C:\Program Files\Suricata\suricata.exe"
if (-not (Test-Path $suricataPath)) {
    Write-Host "ERROR: Suricata not found at $suricataPath" -ForegroundColor Red
    Write-Host "Please install Suricata first from: https://suricata.io/download/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[✓] Suricata installation found" -ForegroundColor Green

# Get active network interface
Write-Host ""
Write-Host "Available network interfaces:" -ForegroundColor Yellow
$adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
$adapters | Format-Table -AutoSize Name, InterfaceDescription, Status

$interfaceName = Read-Host "Enter the interface name to monitor (e.g., 'Wi-Fi 2')"

if ([string]::IsNullOrWhiteSpace($interfaceName)) {
    Write-Host "ERROR: No interface specified" -ForegroundColor Red
    exit 1
}

# Backup existing config
$configPath = "C:\Program Files\Suricata\suricata.yaml"
$backupPath = "C:\Program Files\Suricata\suricata.yaml.backup"

if (Test-Path $configPath) {
    Write-Host ""
    Write-Host "Backing up existing configuration..." -ForegroundColor Yellow
    Copy-Item $configPath $backupPath -Force
    Write-Host "[✓] Backup created at: $backupPath" -ForegroundColor Green
}

# Check if eve.json directory exists
$logDir = "C:\Program Files\Suricata\log"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    Write-Host "[✓] Created log directory" -ForegroundColor Green
}

# Start Suricata
Write-Host ""
Write-Host "Starting Suricata on interface: $interfaceName" -ForegroundColor Cyan
Write-Host "Log file: C:\Program Files\Suricata\log\eve.json" -ForegroundColor Gray
Write-Host ""

try {
    # Stop existing Suricata if running
    Get-Process -Name suricata -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    # Start Suricata
    Write-Host "Starting Suricata... (this may take a moment)" -ForegroundColor Yellow
    $suricataArgs = "-c `"$configPath`" -i `"$interfaceName`" -l `"$logDir`""
    
    Start-Process -FilePath $suricataPath -ArgumentList $suricataArgs -WindowStyle Minimized
    
    Start-Sleep -Seconds 3
    
    # Check if it started
    $suricataProcess = Get-Process -Name suricata -ErrorAction SilentlyContinue
    if ($suricataProcess) {
        Write-Host "[✓] Suricata is running (PID: $($suricataProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "[!] Suricata process not found. Check logs for errors." -ForegroundColor Red
    }
    
    # Wait for eve.json to be created
    Write-Host ""
    Write-Host "Waiting for log file to be created..." -ForegroundColor Yellow
    $eveLogPath = "$logDir\eve.json"
    $timeout = 10
    $elapsed = 0
    
    while (-not (Test-Path $eveLogPath) -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    
    if (Test-Path $eveLogPath) {
        Write-Host "[✓] Eve log file created successfully!" -ForegroundColor Green
        
        # Show some sample data
        Write-Host ""
        Write-Host "Monitoring for events... (generating some traffic helps)" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop watching" -ForegroundColor Gray
        Write-Host ""
        
        Start-Sleep -Seconds 2
        Get-Content $eveLogPath -Tail 5 -Wait
        
    } else {
        Write-Host "[!] Log file not created within timeout" -ForegroundColor Yellow
        Write-Host "Check Suricata logs at: C:\Program Files\Suricata\log\suricata.log" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "ERROR: Failed to start Suricata" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart your BearTrap server: .\start-beartrap.bat" -ForegroundColor White
Write-Host "2. Browse some websites to generate traffic" -ForegroundColor White
Write-Host "3. Check the BearTrap dashboard for real-time events" -ForegroundColor White
Write-Host ""
