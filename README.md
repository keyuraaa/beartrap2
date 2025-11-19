# BearTrap (IDS Admin Dashboard + Chrome Extension)

This repository contains a minimal, runnable scaffold for BearTrap — an IDS admin dashboard with realtime GeoIP mapping and a Manifest V3 Chrome extension popup.

What is included

- Frontend: React + Vite + Tailwind + Recharts + Leaflet (src/)
- IDS backend: Express + ws WebSocket server that reads Suricata EVE logs for real-time attack events (server/index.js)
- Chrome extension: `extension/` folder with `manifest.json`, `popup.html`, `popup.js`, `background.js`, and styles

Quick start (Windows PowerShell):

1. Install dependencies

```powershell
cd "c:\Users\User\Documents\GitHub\beartrap2"
npm install
```

2. Install Suricata IDS

```powershell
winget install --id OISF.Suricata --source winget
```

3. Configure Suricata (optional - default config should work)

- Edit `C:\Program Files\Suricata\suricata.yaml` if needed
- Ensure EVE logging is enabled with JSON output

4. Run Suricata (in a separate terminal)

```powershell
& "C:\Program Files\Suricata\suricata.exe" -c "C:\Program Files\Suricata\suricata.yaml" -i <interface_name>
```

Replace `<interface_name>` with your network interface (e.g., Ethernet, Wi-Fi). Use `netsh interface show interface` to list interfaces.

5. Run the IDS server (separate terminal)

```powershell
npm run start-server
```

The server listens on http://localhost:4000 and exposes REST endpoints and a WebSocket for realtime events.

6. Start the frontend dev server

```powershell
npm run dev
# open http://localhost:5173
```

7. Load the extension

- Open chrome://extensions
- Enable "Developer mode"
- Click "Load unpacked" and choose `c:\Users\User\Documents\GitHub\beartrap2\extension`

Notes and assumptions

- The project now reads real Suricata EVE logs instead of mock data. Ensure Suricata is running and logging to `C:\Program Files\Suricata\log\eve.json`.
- The extension requests host permissions for `http://localhost:4000/*` to fetch stats from the local server. Adjust host permissions if you change API host.
- Icons in `extension/icons/` are simple SVG placeholders to avoid missing-file errors during loading.

Next steps you might want:
- Configure Suricata rules for your specific network.
- Enhance geo lookup for better IP mapping.
- Add authentication and security hardening.
- Add unit tests and CI.
