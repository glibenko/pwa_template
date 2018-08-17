// files for cache
const files = [
  './',
  './faq.json',
];

// name of cache version
const vs = 'v3';


// add all files to cache
this.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(vs);
    console.log('cache', cache);
    await cache.addAll(files);
  })());
});


// set new cache and remove old
self.addEventListener('activate', (e) => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil((async () => {
    const keyList = await caches.keys();
    console.log('keyList', keyList);
    const promise = await Promise.all(keyList);
    console.log('promise', promise);
    await promise.map((key) => {
      if (key !== vs) {
        console.log('[ServiceWorker] Removing old cache', key);
        return caches.delete(key);
      }
      return false;
    });
  })());
  console.log('self.clients.claim()', self.clients.claim());
  return self.clients.claim();
});

function refresh(response) {
  return self.clients.matchAll()
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({message: 'ups'});
      });
    });
}


// try get fetch from cache
self.addEventListener('fetch', (e) => {
  if (
    /rates/.test(e.request.url) ||
    /branches/.test(e.request.url) ||
    /service/.test(e.request.url)
  ) {
    // combine requests fetch + cache: before wait fetch show cache
    e.respondWith((async () => {
      let responseC;
      try {
        responseC = await caches.match(e.request);
        // console.log('responseC-1', responseC);
        const response = await fetch(e.request);
        // console.log('[ServiceWorker] rates fetch sv response', response);
        const cache = await caches.open(vs);
        cache.put(e.request.url, response.clone());
        return response;
      } catch (e) {
        console.log('rates fetch first step ofline');
        //  console.log('responseC-2', responseC);
        refresh();
        return responseC || false;
      }
    })());
    // all php files without cache
  } else if (/.php/.test(e.request.url)) {
    console.log('all php files', e.request.url);
  } else {
    e.respondWith((async () => {
      const response = await caches.match(e.request);
      return response || fetch(e.request);
    })());
  }
});
