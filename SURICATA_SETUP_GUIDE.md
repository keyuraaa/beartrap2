# Suricata Setup Guide for BearTrap

## Step 1: Install Npcap (REQUIRED)

The Npcap installer should be open. If not, run:
```powershell
Start-Process "$env:TEMP\npcap-installer.exe" -Verb RunAs
```

**IMPORTANT - Check these options during installation:**
- ✅ **Install Npcap in WinPcap API-compatible Mode** (REQUIRED for Suricata)
- ✅ **Support loopback traffic capture** (Recommended)
- ✅ **Automatically start the Npcap driver at boot time** (Recommended)

Click "I Agree" → Check the boxes above → Click "Install" → Wait for completion

## Step 2: Restart Windows (REQUIRED)

After Npcap installation, **you MUST restart Windows** for the driver to load properly.

```powershell
Restart-Computer
```

## Step 3: Verify Installation

After reboot, check if Npcap is working:

```powershell
Test-Path "$env:windir\System32\wpcap.dll"
```

Should return: `True`

## Step 4: Configure Suricata

Your network interface is: **Wi-Fi 2** (currently active)

Edit Suricata config:
```powershell
notepad "C:\Program Files\Suricata\suricata.yaml"
```

Find the line with `interface:` and change it to:
```yaml
af-packet:
  - interface: "Wi-Fi 2"
```

Or use the device name format:
```yaml
af-packet:
  - interface: \Device\NPF_{YOUR-ADAPTER-GUID}
```

## Step 5: Start BearTrap with Suricata

After reboot and configuration, run:
```powershell
cd C:\Users\User\Documents\GitHub\beartrap2
.\start-beartrap.bat
```

BearTrap will automatically:
- Detect Npcap is installed (wpcap.dll present)
- Start Suricata with admin privileges
- Capture all network traffic on Wi-Fi 2
- Display real-time events in the dashboard

## Troubleshooting

### Error: "wpcap.dll not found"
- Npcap not installed correctly
- Reinstall Npcap with "WinPcap API-compatible Mode" checked
- **Must restart Windows after installation**

### Suricata not capturing traffic
- Check if Npcap driver is running: `Get-Service npcap`
- Verify interface name in suricata.yaml matches your adapter
- Run Suricata manually to see errors:
  ```powershell
  cd "C:\Program Files\Suricata"
  .\suricata.exe -c suricata.yaml -i "Wi-Fi 2" -v
  ```

### No events in dashboard
- Check Suricata log: `C:\Program Files\Suricata\log\eve.json`
- Make sure you have internet traffic (browse websites)
- Wait 30-60 seconds for Suricata to start capturing

## Quick Commands

**Check Npcap status:**
```powershell
Get-Service npcap | Select-Object Status, DisplayName
```

**List network adapters:**
```powershell
Get-NetAdapter | Where-Object {$_.Status -eq 'Up'}
```

**Test Suricata manually:**
```powershell
cd "C:\Program Files\Suricata"
.\suricata.exe -c suricata.yaml -i "Wi-Fi 2" -v
```

**View Suricata logs:**
```powershell
Get-Content "C:\Program Files\Suricata\log\suricata.log" -Tail 50
```

## What You'll See

Once working, BearTrap will show:
- ✅ Real HTTP/HTTPS traffic from all applications
- ✅ Real DNS queries
- ✅ Real source and destination IPs
- ✅ Real protocols, ports, bytes transferred
- ✅ Suricata IDS alerts for suspicious activity
- ✅ Geolocation of external IPs
- ✅ Live map with traffic origins

No scripts needed - Suricata captures everything at the network level!
