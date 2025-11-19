# Manual Testing Guide

## Prerequisites
- ✅ Server running on http://localhost:4000
- ✅ Dev server running on http://localhost:5173
- Chrome browser with extension loaded

---

## Test Suite 1: Extension Popup - URL Submission

### Test 1.1: Load Extension Popup
**Steps:**
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension/` folder
6. Click the extension icon in toolbar

**Expected Result:**
- Popup opens showing honeypot stats
- URL submission form is visible
- Form has input field and submit button

### Test 1.2: Submit Valid URL
**Steps:**
1. Open extension popup
2. Enter `https://example.com` in URL input
3. Click "Submit" button

**Expected Result:**
- ✓ Success message appears: "✓ URL submitted successfully!"
- Message is green/cyan color
- Input field clears automatically
- Message disappears after 3 seconds

### Test 1.3: Submit Invalid URL
**Steps:**
1. Open extension popup
2. Enter invalid URL like `not-a-url`
3. Click "Submit" button

**Expected Result:**
- Browser's built-in validation prevents submission
- Red validation message from browser appears

### Test 1.4: Submit Empty URL
**Steps:**
1. Open extension popup
2. Leave URL input empty
3. Click "Submit" button

**Expected Result:**
- Error message appears: "Please enter a URL"
- Message is red color
- Form does not submit

### Test 1.5: Multiple URL Submissions
**Steps:**
1. Submit `https://google.com`
2. Wait for success message
3. Submit `https://github.com`
4. Submit `https://stackoverflow.com`

**Expected Result:**
- Each submission shows success message
- No errors occur
- Server stores all URLs

### Test 1.6: Existing Features Still Work
**Steps:**
1. Open extension popup
2. Observe stats section
3. Check Top IPs list
4. Check Mini Map

**Expected Result:**
- Stats update every 5 seconds
- Top IPs list populates
- Mini Map shows markers
- No console errors

---

## Test Suite 2: Dashboard - Event Filtering

### Test 2.1: Load Dashboard
**Steps:**
1. Open browser
2. Navigate to http://localhost:5173
3. Wait for page to load

**Expected Result:**
- Dashboard loads without errors
- Recent Events section visible
- Filter controls visible above event table
- Event count shows "X of Y events"

### Test 2.2: Protocol Filter
**Steps:**
1. Open dashboard
2. Locate Protocol dropdown in filters
3. Select "TCP" from dropdown
4. Observe event table

**Expected Result:**
- Only TCP protocol events shown
- Event count updates (e.g., "15 of 50 events")
- "Clear Filters" button appears
- Other events hidden

### Test 2.3: Port Filter
**Steps:**
1. Clear any existing filters
2. Select "Port 22" from Port dropdown
3. Observe event table

**Expected Result:**
- Only port 22 events shown
- Event count updates
- "Clear Filters" button appears

### Test 2.4: Severity Filter
**Steps:**
1. Clear any existing filters
2. Select "High" from Severity dropdown
3. Observe event table

**Expected Result:**
- Only high severity events shown
- Events have red severity badges
- Event count updates

### Test 2.5: Multiple Filters Combined
**Steps:**
1. Select "SSH" from Protocol dropdown
2. Select "Port 22" from Port dropdown
3. Select "High" from Severity dropdown
4. Observe event table

**Expected Result:**
- Only events matching ALL criteria shown
- Event count reflects filtered results
- Table updates correctly

### Test 2.6: Clear Filters Button
**Steps:**
1. Apply multiple filters (Protocol, Port, Severity)
2. Click "Clear Filters" button
3. Observe event table

**Expected Result:**
- All filters reset to "All"
- Full event list displayed
- Event count shows total events
- "Clear Filters" button disappears

### Test 2.7: Severity Badge Colors
**Steps:**
1. Clear all filters
2. Observe severity column in event table
3. Check badge colors for different severities

**Expected Result:**
- High severity: Red background, red text
- Medium severity: Yellow background, yellow text
- Low severity: Green background, green text

### Test 2.8: Dynamic Filter Options
**Steps:**
1. Observe filter dropdowns
2. Check available options in each dropdown

**Expected Result:**
- Protocol dropdown shows: TCP, SSH, HTTP (based on data)
- Port dropdown shows: 22, 80, 443, 8080, 3306 (based on data)
- Severity dropdown shows: Low, Medium, High

### Test 2.9: Real-time Updates with Filters
**Steps:**
1. Apply a filter (e.g., Protocol = "TCP")
2. Wait for new events to arrive via WebSocket
3. Observe if new matching events appear

**Expected Result:**
- New events matching filter appear in table
- Event count updates
- Non-matching events don't appear

### Test 2.10: Filter Persistence During Session
**Steps:**
1. Apply filters
2. Scroll down the page
3. Scroll back up to filters

**Expected Result:**
- Filters remain applied
- Selected values still shown in dropdowns
- Filtered data still displayed

---

## Test Suite 3: Integration Testing

### Test 3.1: Extension to Server Communication
**Steps:**
1. Open extension popup
2. Check if stats load
3. Submit a URL
4. Check browser console for errors

**Expected Result:**
- Stats load successfully
- URL submission succeeds
- No CORS errors
- No network errors

### Test 3.2: Dashboard WebSocket Connection
**Steps:**
1. Open dashboard
2. Open browser DevTools (F12)
3. Go to Network tab
4. Filter by WS (WebSocket)
5. Observe WebSocket connection

**Expected Result:**
- WebSocket connects to ws://localhost:4000
- Connection status: "101 Switching Protocols"
- Messages flowing in real-time

### Test 3.3: Dashboard Real-time Updates
**Steps:**
1. Open dashboard
2. Watch Recent Events table
3. Observe for 10 seconds

**Expected Result:**
- New events appear automatically
- Stats update in real-time
- No page refresh needed

### Test 3.4: All Existing Features Work
**Steps:**
1. Test Charts Panel
2. Test GeoIP World Map
3. Test Alerts Panel
4. Test Recent Events table

**Expected Result:**
- All panels display data
- Charts render correctly
- Map shows markers
- No broken features

---

## Test Suite 4: Error Handling

### Test 4.1: Server Offline - Extension
**Steps:**
1. Stop the server (Ctrl+C in server terminal)
2. Open extension popup
3. Try to submit URL

**Expected Result:**
- Error message appears
- Stats show "API unreachable"
- Extension doesn't crash

### Test 4.2: Server Offline - Dashboard
**Steps:**
1. Stop the server
2. Open dashboard
3. Observe behavior

**Expected Result:**
- Dashboard shows connection error
- WebSocket reconnection attempts
- No JavaScript errors

### Test 4.3: Invalid URL Submission
**Steps:**
1. Modify popup.js temporarily to bypass validation
2. Submit invalid data
3. Check server response

**Expected Result:**
- Server returns 400 error
- Error message displayed
- Server doesn't crash

---

## Test Suite 5: Performance & UI/UX

### Test 5.1: Filter Performance
**Steps:**
1. Let dashboard accumulate 200 events
2. Apply different filters rapidly
3. Observe response time

**Expected Result:**
- Filters apply instantly (<100ms)
- No lag or freezing
- Smooth user experience

### Test 5.2: Extension Popup Responsiveness
**Steps:**
1. Open extension popup
2. Interact with all elements
3. Check loading states

**Expected Result:**
- Popup opens quickly
- All elements responsive
- No layout shifts

### Test 5.3: Mobile Responsiveness (Dashboard)
**Steps:**
1. Open dashboard
2. Open DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Test different screen sizes

**Expected Result:**
- Filters wrap on smaller screens
- Table remains readable
- No horizontal scroll issues

---

## Verification Checklist

### Extension Popup
- [ ] URL form displays correctly
- [ ] Valid URL submission works
- [ ] Invalid URL validation works
- [ ] Success message appears and disappears
- [ ] Error messages display correctly
- [ ] Form clears after submission
- [ ] Existing features (stats, IPs, map) still work
- [ ] No console errors

### Dashboard Filters
- [ ] All filter dropdowns populate correctly
- [ ] Protocol filter works
- [ ] Port filter works
- [ ] Severity filter works
- [ ] Multiple filters work together
- [ ] Clear Filters button works
- [ ] Event count displays correctly
- [ ] Severity badges color-coded correctly
- [ ] Real-time updates work with filters
- [ ] No console errors

### Integration
- [ ] Extension connects to server
- [ ] Dashboard WebSocket connects
- [ ] Real-time events flow correctly
- [ ] All existing features work
- [ ] No CORS errors
- [ ] No network errors

### Error Handling
- [ ] Graceful handling when server offline
- [ ] Invalid data handled properly
- [ ] Error messages user-friendly

### Performance
- [ ] Filters apply instantly
- [ ] No lag with 200+ events
- [ ] Smooth animations
- [ ] Responsive UI

---

## Bug Report Template

If you find any issues during testing, use this template:

```
**Bug Title:** [Brief description]

**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[If applicable]

**Console Errors:**
[Any error messages]

**Environment:**
- Browser: 
- OS: 
- Server Status: 
```

---

## Testing Notes

- Test in Chrome browser (extension requirement)
- Keep DevTools open to catch console errors
- Test with both server and dev server running
- Clear browser cache if experiencing issues
- Check Network tab for failed requests
- Monitor WebSocket connection status

---

## Quick Test Commands

```bash
# Start server
node server/index.js

# Start dev server
npm run dev

# Test URL submission API
node test-url-submit.js

# Check server endpoints
curl http://localhost:4000/api/stats
curl http://localhost:4000/api/top-ips
curl http://localhost:4000/api/submitted-urls
```

---

## Success Criteria

All tests pass with:
- ✅ No console errors
- ✅ All features working as expected
- ✅ Good user experience
- ✅ Proper error handling
- ✅ Responsive design
- ✅ Real-time updates working
