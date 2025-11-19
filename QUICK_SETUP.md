# Quick Setup: Get Real Traffic Working NOW

## Step 1: Install Npcap (Currently Opening)

When the Npcap installer window appears:

1. Click **"I Agree"** on the license page
2. **CHECK THESE TWO BOXES** (CRITICAL):
   - ☑️ **Install Npcap in WinPcap API-compatible Mode**
   - ☑️ **Support loopback traffic capture**
3. Click **"Install"**
4. Wait for "Installation Complete" message
5. Click **"Finish"**

## Step 2: Restart Windows (REQUIRED)

After Npcap installs, you **MUST** restart for the driver to load:

```powershell
Restart-Computer
```

Or click Start → Power → Restart

## Step 3: Start BearTrap (After Reboot)

```powershell
cd C:\Users\User\Documents\GitHub\beartrap2
.\start-beartrap.bat
```

You should see:
```
✓ wpcap.dll found - starting Suricata with admin privileges...
✓ Suricata started successfully
```

## Step 4: Generate Traffic

- Open a few websites in your browser
- Download a file
- Use any application that connects to the internet

## What You'll See

Within 30-60 seconds, the dashboard will show:
- Real HTTP/HTTPS requests
- Real DNS queries
- Real destination IPs and locations on the map
- Real protocols, ports, bytes transferred
- Suricata IDS alerts for suspicious activity

## Troubleshooting

**If Suricata still won't start after reboot:**

1. Check Npcap service:
```powershell
Get-Service npcap
```
Should show: Status = Running

2. Test Suricata manually:
```powershell
cd "C:\Program Files\Suricata"
.\suricata.exe -c suricata.yaml -i "Wi-Fi 2" -v
```

3. Check for errors in:
```powershell
Get-Content "C:\Program Files\Suricata\log\suricata.log" -Tail 20
```

**If you see "interface not found":**

Edit `C:\Program Files\Suricata\suricata.yaml` and change the interface line to match your active adapter (Wi-Fi 2).

## That's It!

Once Npcap is installed and Windows is restarted, everything will work automatically. No more configuration needed.
