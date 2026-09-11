/* J'écris en français — parcours A1 → A2.
   Rend l'application disponible sans réseau après la première visite.
   parcours.json est mis en cache mais rafraîchi quand le réseau répond,
   pour qu'une modification du contenu par l'équipe pédagogique arrive
   sans réinstaller l'application.                                       */
const CACHE = "jecris-parcours-v2";
const FICHIERS = [
  "./",
  "./jecris-parcours.html",
  "./parcours.json",
  "./manifest.webmanifest",
  "./logo.png",
  "./icone-192.png",
  "./icone-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(c => c !== CACHE).map(c => caches.delete(c))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const contenu = e.request.url.indexOf("parcours.json") >= 0;

  if (contenu) {                       // réseau d'abord, cache en secours
    e.respondWith(fetch(e.request).then(r => {
      const copie = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copie)).catch(() => { });
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(rep => rep || fetch(e.request)
    .then(r => {
      const copie = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copie)).catch(() => { });
      return r;
    })
    .catch(() => caches.match("./jecris-parcours.html"))));
});
