# Quick Start Guide for Beartrap

## How to Start Everything with One Click

### Step 1: Start the Server (ONE TIME)
Double-click `start-beartrap.bat` to start the server in the background.

The server will keep running until you:
- Restart your computer
- Manually stop the Node.js process in Task Manager

### Step 2: Use the Extension
1. Open the Chrome extension popup
2. You'll see a **🟢 Server Running** status indicator
3. Click **"▶️ Start Monitoring"** to begin monitoring
4. Click **"🎛️ Open Admin Dashboard"** to view the full dashboard

## What Each Component Does

- **start-beartrap.bat** - Starts the Node.js server on port 5173
- **Chrome Extension** - Control panel to start/stop monitoring and open dashboard
- **Admin Dashboard** (http://localhost:5174) - Full visualization of attacks

## Troubleshooting

### Server Shows Offline
- Run `start-beartrap.bat` again
- Check if port 5173 is already in use
- Make sure Node.js is installed

### Extension Not Working
- Reload the extension in Chrome
- Make sure the server is running first

### Dashboard Won't Open
- Run `npm run dev` in the terminal to start Vite dev server
- Or build the app with `npm run build` and use a static server
