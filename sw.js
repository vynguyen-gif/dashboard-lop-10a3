// Service Worker cho Ứng dụng Quản Trị Lớp 10A3
// Chiến lược: Network-First để luôn cập nhật dữ liệu mới nhất từ GVCN, Cache-Fallback khi offline
const CACHE_NAME = 'lop10a3-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/icon.svg',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Chỉ cache các request GET
  if (req.method !== 'GET') return;

  // Bỏ qua chrome-extension hay các scheme khác
  if (!req.url.startsWith('http')) return;

  // Chiến lược: Network-First cho tài nguyên của trang web (để luôn thấy cập nhật mới nhất)
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Lưu bản mới vào cache
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        // Nếu offline không có mạng, lấy từ Cache
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          // Fallback về trang chủ nếu là điều hướng
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
