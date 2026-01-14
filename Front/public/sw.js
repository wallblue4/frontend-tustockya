// public/sw.js
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    return self.clients.claim();
});

// Listener para notificaciones push si se implementaran en el futuro
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Nueva Notificación';
    const options = {
        body: data.body || 'Tienes una nueva actualización',
        icon: '/icon-192x192.png', // Asegúrate de que estos iconos existan o usa genéricos
        badge: '/badge-72x72.png',
        tag: data.tag || 'transfer-update',
        renotify: true,
        data: data.url || '/'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data || '/');
        })
    );
});
