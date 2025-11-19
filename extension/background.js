// Background service worker: simple notifier for high severity events
let lastSeen = 0

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

async function poll(){
  try{
    const r = await fetch('http://localhost:5173/api/top-ips')
    const top = await r.json()
    const now = Date.now()
    if(top && top[0] && top[0].last > lastSeen){
      // notify new top attacker
      const title = 'New top attacker: ' + top[0].ip
      self.registration.showNotification(title, { body: `Count: ${top[0].count}` })
      lastSeen = top[0].last
    }
  }catch(e){ }
}

setInterval(poll, 10000)
