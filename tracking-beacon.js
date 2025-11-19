/**
 * BearTrap Tracking Beacon
 * 
 * Embed this script on your website to send visitor data to BearTrap IDS
 * 
 * Usage:
 * <script src="https://your-beartrap-server.com/tracking-beacon.js"></script>
 * <script>BearTrap.init('http://localhost:5173');</script>
 */

(function(window) {
  'use strict';
  
  const BearTrap = {
    apiUrl: null,
    siteId: null,
    
    init: function(apiUrl, siteId = null) {
      this.apiUrl = apiUrl;
      this.siteId = siteId || window.location.hostname;
      this.sendBeacon();
      
      // Track page views
      this.trackPageView();
      
      // Track user interactions
      this.setupTracking();
    },
    
    sendBeacon: function() {
      const data = {
        url: window.location.href,
        hostname: window.location.hostname,
        path: window.location.pathname,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: Date.now(),
        siteId: this.siteId
      };
      
      // Send to BearTrap API
      this.send('/api/track-visitor', data);
    },
    
    trackPageView: function() {
      // Send page view event
      this.send('/api/track-event', {
        type: 'pageview',
        url: window.location.href,
        timestamp: Date.now()
      });
    },
    
    setupTracking: function() {
      // Track clicks on external links
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.includes(window.location.hostname)) {
          this.send('/api/track-event', {
            type: 'external_link',
            url: link.href,
            timestamp: Date.now()
          });
        }
      });
      
      // Track form submissions
      document.addEventListener('submit', (e) => {
        this.send('/api/track-event', {
          type: 'form_submit',
          form: e.target.action || window.location.href,
          timestamp: Date.now()
        });
      });
    },
    
    send: function(endpoint, data) {
      if (!this.apiUrl) return;
      
      // Use sendBeacon for reliability (works even if page unloads)
      const url = this.apiUrl + endpoint;
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback to fetch
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(() => {}); // Silently fail
      }
    }
  };
  
  // Expose to global scope
  window.BearTrap = BearTrap;
  
})(window);
