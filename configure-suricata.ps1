# Suricata Configuration Script for BearTrap
# Run this after installing Npcap and restarting Windows

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SURICATA CONFIGURATION FOR BEARTRAP" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Check if Npcap is installed
if (-not (Test-Path "$env:windir\System32\wpcap.dll")) {
    Write-Host "❌ ERROR: Npcap is not installed!" -ForegroundColor Red
    Write-Host "`nPlease install Npcap first:" -ForegroundColor Yellow
    Write-Host "1. Run the installer at: $env:TEMP\npcap-installer.exe" -ForegroundColor White
    Write-Host "2. Check 'Install Npcap in WinPcap API-compatible Mode'" -ForegroundColor White
    Write-Host "3. Restart Windows" -ForegroundColor White
    Write-Host "4. Run this script again`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ Npcap is installed`n" -ForegroundColor Green

# Check Npcap service
$npcapService = Get-Service npcap -ErrorAction SilentlyContinue
if ($npcapService) {
    Write-Host "✅ Npcap service status: $($npcapService.Status)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Npcap service not found (this is OK if just installed)" -ForegroundColor Yellow
}

# Get active network adapter
Write-Host "`nDetecting active network adapter..." -ForegroundColor Cyan
$activeAdapter = Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -and $_.Name -notlike "*VMware*" -and $_.Name -notlike "*Bluetooth*"} | Select-Object -First 1

if ($activeAdapter) {
    Write-Host "✅ Found active adapter: $($activeAdapter.Name)" -ForegroundColor Green
    Write-Host "   Description: $($activeAdapter.InterfaceDescription)" -ForegroundColor White
} else {
    Write-Host "❌ No active network adapter found!" -ForegroundColor Red
    exit 1
}

# Check if Suricata is installed
$suricataPath = "C:\Program Files\Suricata\suricata.exe"
$suricataYaml = "C:\Program Files\Suricata\suricata.yaml"

if (-not (Test-Path $suricataPath)) {
    Write-Host "`n❌ Suricata not found at: $suricataPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Suricata is installed`n" -ForegroundColor Green

# Backup existing config
if (Test-Path $suricataYaml) {
    $backupPath = "$suricataYaml.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "Creating backup: $backupPath" -ForegroundColor Yellow
    Copy-Item $suricataYaml $backupPath
}

# Update Suricata configuration
Write-Host "`nConfiguring Suricata for interface: $($activeAdapter.Name)..." -ForegroundColor Cyan

$configContent = Get-Content $suricataYaml -Raw

# Find and update the af-packet interface section
if ($configContent -match 'af-packet:') {
    Write-Host "Updating af-packet interface configuration..." -ForegroundColor Yellow
    
    # Simple approach: add our interface at the end of the file
    $newConfig = @"

# BearTrap Configuration - Added $(Get-Date)
af-packet:
  - interface: $($activeAdapter.Name)
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
    use-mmap: yes
    tpacket-v3: yes

"@
    
    Add-Content -Path $suricataYaml -Value $newConfig
    Write-Host "✅ Configuration updated" -ForegroundColor Green
}

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start BearTrap:" -ForegroundColor White
Write-Host "   cd C:\Users\User\Documents\GitHub\beartrap2" -ForegroundColor Cyan
Write-Host "   .\start-beartrap.bat`n" -ForegroundColor Cyan

Write-Host "2. Suricata will start automatically with admin privileges" -ForegroundColor White
Write-Host "3. Browse some websites to generate traffic" -ForegroundColor White
Write-Host "4. Check the dashboard at http://localhost:5174`n" -ForegroundColor White

Write-Host "To test Suricata manually:" -ForegroundColor Yellow
Write-Host "   cd 'C:\Program Files\Suricata'" -ForegroundColor Cyan
Write-Host "   .\suricata.exe -c suricata.yaml -i '$($activeAdapter.Name)' -v`n" -ForegroundColor Cyan

Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Cyan
