# TODO: Integrate Suricata for Real-Time IDS Data

## Overview
Replace mock attack events in server/index.js with real-time data from Suricata IDS. This shifts the project from honeypot simulation to actual IDS monitoring.

## Steps
- [x] Install Suricata on the system (Windows support is experimental; may need WSL or alternative setup)
- [x] Configure Suricata for IDS mode with EVE JSON output
- [x] Update server/index.js to read and parse Suricata EVE logs in real-time
- [x] Map Suricata events to existing event format (attack type, timestamp, source IP, port, protocol, bytes, severity, geo, count)
- [x] Update stats aggregation based on real events
- [ ] Test the integration with live network traffic
- [ ] Handle edge cases (log file rotation, parsing errors, geo lookup failures)

## Dependencies
- Suricata installed and configured
- Node.js libraries: fs, path, axios (already present), possibly 'tail' or 'chokidar' for file watching

## Notes
- Suricata EVE logs are JSON lines; parse each line as JSON
- Ensure WebSocket emits events in the same format as mock data
- Geo lookup via /api/geo endpoint for source IPs
