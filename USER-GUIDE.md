# BearTrap - User Guide

## Welcome to BearTrap! 🎯

BearTrap is a network monitoring and security visualization tool that helps you monitor website traffic, track potential threats, and visualize network activity in real-time.

---

## 📥 Getting Started

### Step 1: Installation

1. **Download BearTrap**
   - Extract the ZIP file to a folder (e.g., `C:\BearTrap`)

2. **Install Node.js** (if not already installed)
   - Go to: https://nodejs.org/
   - Download the **LTS version**
   - Run the installer with default settings

3. **Run the Installer**
   - Double-click `INSTALL.bat`
   - Wait for dependencies to install (2-5 minutes)
   - You'll see "INSTALLATION SUCCESSFUL!" when done

### Step 2: Launch BearTrap

Simply double-click: **`QUICK-START.bat`**

The dashboard will automatically open in your default browser!

---

## 🎮 Using the Dashboard

### Main Features

#### 1. **Real-time Overview**
- **Active Attacks**: Current threats in the last 60 seconds
- **Total Attacks**: All-time attack count
- **Total Events**: All network events monitored
- **Bandwidth Usage**: Data in/out statistics

#### 2. **Geographic Map**
- See where attacks are coming from worldwide
- Hover over markers for details (IP, country, ISP)
- Color-coded by severity:
  - 🔴 Red = High severity
  - 🟠 Orange = Medium severity
  - 🔵 Blue = Low/Info

#### 3. **Charts Panel**
- Protocol distribution (HTTP, TCP, SSH, etc.)
- Port statistics
- Attack trends over time

#### 4. **Recent Events Table**
- Live feed of all network events
- Filter by protocol, port, or severity
- Click URLs to investigate
- Export to PDF for reports

#### 5. **Currently Monitoring**
- Shows all URLs you're tracking
- Remove URLs you no longer need
- Active status indicators

---

## 🔗 Monitoring Websites

### Method 1: Chrome Extension (Easiest)

1. **Install the Extension**
   - Open Chrome
   - Go to: `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder from BearTrap

2. **Use the Extension**
   - Click the BearTrap icon in Chrome
   - Enter a website URL (e.g., `https://github.com`)
   - Click "Submit"
   - Traffic monitoring begins automatically!

3. **Extension Features**
   - View live stats
   - Start/Stop monitoring
   - Open full dashboard
   - Submit URLs on-the-go

### Method 2: Dashboard Submission

1. Open the dashboard
2. Find "Submit Website URL" section
3. Enter URL and click Submit

---

## 🛡️ Real Network Monitoring (Advanced)

By default, BearTrap simulates network traffic for URLs you submit. For **real network monitoring**:

### Setup Suricata IDS

1. **Install Suricata**
   - Download from: https://suricata.io/download/
   - Follow Windows installation guide
   - Default location: `C:\Program Files\Suricata`

2. **Start Suricata Monitoring**
   - Double-click `start-suricata.bat`
   - Allow admin privileges when prompted
   - Select your network interface (usually "Wi-Fi" or "Ethernet")

3. **Verify It's Working**
   - BearTrap dashboard will show: "Real-time monitoring active"
   - Browse websites to see actual traffic captured

### What You'll See

- **HTTP Requests**: All HTTP traffic with full URLs
- **DNS Queries**: Domain name lookups
- **TLS/HTTPS**: Server names from encrypted connections
- **Network Flows**: Source/destination IPs and ports
- **Security Alerts**: IDS rule matches

---

## 🎛️ Control Panel

For advanced users, use **`beartrap-control.bat`**:

```
1. Start All Servers    - Launch BearTrap
2. Stop All Servers     - Shut down completely
3. Restart All Servers  - Refresh after changes
4. Start Suricata IDS   - Enable real monitoring
5. Open Admin Dashboard - Launch browser
6. Exit                 - Close and optionally stop servers
```

---

## 📊 Exporting Reports

### PDF Export

1. Go to "Recent Events" section
2. (Optional) Apply filters to narrow down events
3. Click **"Export PDF"** button
4. Print dialog opens
5. Select "Save as PDF" as your printer
6. Choose save location

### What's Included
- Report generation timestamp
- Summary statistics
- Filtered event list
- Severity indicators

---

## 🧹 Maintenance

### Clear Old Data

- Click **"Clear Data"** button in the dashboard
- Removes all old events and statistics
- Keeps your submitted URLs
- Good for starting fresh

### Remove Monitored URLs

- Go to "Currently Monitoring" section
- Click **"Remove"** next to any URL
- Traffic generation stops for that URL

---

## ⚠️ Troubleshooting

### Dashboard Won't Open

**Problem:** Browser doesn't open automatically

**Solutions:**
1. Manually open: `http://localhost:5174`
2. Check if Node.js processes are running
3. Restart with `beartrap-control.bat` → Option 3

---

### "Server Offline" Message

**Problem:** Extension shows server offline

**Solutions:**
1. Run `QUICK-START.bat` to start servers
2. Wait 5-10 seconds for servers to initialize
3. Reload the extension popup

---

### No Events Showing

**Problem:** Dashboard is empty

**Solutions:**
1. Submit URLs via extension or dashboard
2. For real traffic: Run `start-suricata.bat`
3. Generate activity by browsing websites

---

### Port Already in Use

**Problem:** Error message about port 5173 or 5174

**Solutions:**
1. Use `beartrap-control.bat` → Option 2 (Stop All)
2. Close all BearTrap windows
3. Try starting again

---

### High CPU Usage

**Problem:** Computer running slow

**Solutions:**
1. Using Suricata can be resource-intensive
2. Stop Suricata if not needed (just use simulated mode)
3. Clear old data to reduce memory usage

---

## 🔐 Privacy & Security

### What Data is Collected?

- All data stays on **your local machine**
- No cloud uploads or external services
- Geolocation uses free public API (ip-api.com)

### Suricata Captures

- Packet metadata only (headers, not content)
- URLs and hostnames from HTTP/DNS
- Source/destination IPs and ports
- NO passwords or sensitive content

### Clearing Data

- Use "Clear Data" button anytime
- Delete `C:\Program Files\Suricata\log\` to remove Suricata logs
- Uninstall cleanly by deleting BearTrap folder

---

## 💡 Tips & Best Practices

### For Best Results

1. **Submit multiple URLs** to see varied traffic patterns
2. **Use filters** in Recent Events to focus on specific threats
3. **Export PDFs** regularly for record-keeping
4. **Clear data** weekly to keep dashboard responsive
5. **Enable Suricata** only when you need real network monitoring

### Understanding Severity Levels

- **High**: Serious threats, immediate attention needed
- **Medium**: Suspicious activity, worth investigating
- **Low**: Minor issues, usually benign
- **Info**: Normal traffic, informational only

---

## 🆘 Need Help?

### Common Questions

**Q: Can I monitor HTTPS traffic?**
A: With Suricata, you'll see hostnames (SNI) but not content (encrypted)

**Q: Does this slow down my internet?**
A: Minimal impact. Suricata may use some CPU/memory

**Q: Can I use this on a network?**
A: Yes! Monitor your entire home network by running on gateway

**Q: Is this legal?**
A: Yes, for monitoring YOUR OWN network and traffic

---

## 📞 Support Resources

- Check `README.md` for technical details
- Review `SURICATA_CONFIG_GUIDE.md` for advanced setup
- See `TROUBLESHOOTING.md` for more solutions

---

## ✅ Quick Reference

### Essential Files

| File | Purpose |
|------|---------|
| `INSTALL.bat` | One-time setup |
| `QUICK-START.bat` | Launch BearTrap |
| `beartrap-control.bat` | Advanced controls |
| `start-suricata.bat` | Real monitoring |

### Essential URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:5174` | Main dashboard |
| `http://localhost:5173` | API server |

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Refresh dashboard | `F5` or `Ctrl+R` |
| Hard refresh | `Ctrl+Shift+R` |
| Open dev console | `F12` |

---

**Enjoy monitoring with BearTrap! 🐻🪤**
