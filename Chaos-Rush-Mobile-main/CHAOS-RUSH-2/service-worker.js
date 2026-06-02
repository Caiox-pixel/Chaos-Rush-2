const CACHE_NAME = "chaos-rush-v5";
const RUNTIME_CACHE = "chaos-rush-runtime-v5";

const FILES_TO_CACHE = [

  "./",
  "./index.html",

  // CSS
  "./css/style.css",
  "./css/style1.css",

  // JS Core
  "./js/phaser.min.js",
  "./js/main.js",
  "./js/supabaseClient.js",
  "./js/VirtualJoystick.js",

  // Cenas
  "./js/scene/LoginScene.js",
  "./js/scene/RegisterScene.js",
  "./js/scene/MenuScene.js",
  "./js/scene/MainScene.js",
  "./js/scene/PauseMenu.js",
  "./js/scene/PrefaceMenu.js",

  // Entidades - Player
  "./js/entities/Player/player.js",
  "./js/entities/Player/PlayerClass.js",
  "./js/entities/Player/StatsPlayer.js",
  "./js/entities/Player/DamagePlayer.js",

  // Entidades - Enemy
  "./js/entities/Enemy/enemy.js",
  "./js/entities/Enemy/EnemyBullet.js",

  // Entidades
  "./js/entities/XPOrb.js",

  // Sistemas
  "./js/systems/UpgradeSystem.js",
  "./js/systems/ClassSystems.js",
  "./js/systems/WeaponSystem.js",
  "./js/systems/RankingService.js",

  // PassiveSystem
  "./js/systems/PassiveSystem/PassiveSystem.js",
  "./js/systems/PassiveSystem/PassiveAlquimista.js",
  "./js/systems/PassiveSystem/PassiveCoveiro.js",
  "./js/systems/PassiveSystem/PassiveBastiao.js",

  // Director
  "./js/Director/SpawnDirector.js",

  // Ícones
  "./assets/icon-192.png",
  "./assets/icon-512.png",

  // Música
  "./assets/music/menu-music1.mp3"

];

// ======================================
// INSTALL
// ======================================

self.addEventListener("install", event => {

  console.log("[SW] Instalando...");

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(async cache => {

        for (const file of FILES_TO_CACHE) {

          try {

            await cache.add(file);
            console.log("[SW] Cacheado:", file);

          } catch (err) {

            console.warn("[SW] Falha ao cachear:", file, err.message);

          }

        }

      })

  );

  self.skipWaiting();

});

// ======================================
// ACTIVATE
// ======================================

self.addEventListener("activate", event => {

  console.log("[SW] Ativando...");

  event.waitUntil(

    caches.keys().then(cacheNames => {

      return Promise.all(

        cacheNames.map(cacheName => {

          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE
          ) {

            console.log("[SW] Limpando cache:", cacheName);
            return caches.delete(cacheName);

          }

        })

      );

    }).then(() => self.clients.claim())

  );

  self.clients.claim();

});

// ======================================
// FETCH
// ======================================

self.addEventListener("fetch", event => {

  const request = event.request;

  // Ignorar requests não GET
  if (request.method !== "GET") return;

  // Não interceptar Supabase nem CDNs externos
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("googleapis") ||
    request.url.includes("gstatic")
  ) {
    return;
  }

  event.respondWith(

    caches.match(request)
      .then(cachedResponse => {

        // Cache First
        if (cachedResponse) {
          return cachedResponse;
        }

        // Network
        return fetch(request)

          .then(networkResponse => {

            if (
              !networkResponse ||
              networkResponse.status !== 200
            ) {
              return networkResponse;
            }

            // Não cachear requests externos
            if (!request.url.startsWith(self.location.origin)) {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();

            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone).catch(err => {
                console.warn("[SW] Falha ao armazenar em cache:", err);
              });
            });

            return networkResponse;

          })

          .catch(err => {

            console.warn("[SW] Erro fetch:", err);

            return (
              caches.match(request) ||
              new Response("Offline", {
                status: 503,
                statusText: "Offline"
              })
            );

          });

      })

  );

});
