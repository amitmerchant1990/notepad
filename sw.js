importScripts('js/libraries/cache-polyfill.js');

let CACHE_VERSION = 'app-v21';
let CACHE_FILES = [
    '/',
    'index.html',
    'js/libraries/jquery.min.js',
    'js/libraries/bootstrap.min.js',
    'js/libraries/sweetalert2.all.min.js',
    'js/app.js',
    'js/utils.js',
    'js/selector.js',
    'css/bootstrap.min.css',
    'css/style.css',
    'favicon.ico',
    'manifest.json',
    'img/icon-48.png',
    'img/icon-96.png',
    'img/icon-144.png',
    'img/icon-196.png',
    'img/navbar/copy.svg',
    'img/navbar/delete.svg',
    'img/navbar/download.svg',
    'img/navbar/dark-theme.svg',
    'img/navbar/light-theme.svg'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(CACHE_FILES);
            })
    );
});

self.addEventListener('fetch', function (event) {
    let online = navigator.onLine
    if (!online) {
        event.respondWith(
            caches.match(event.request).then(function (res) {
                if (res) {
                    return res;
                }
                requestBackend(event);
            })
        )
    }
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (key, i) {
                if (key !== CACHE_VERSION) {
                    return caches.delete(keys[i]);
                }
            }))
        })
    )
});

function requestBackend(event) {
    var url = event.request.clone();
    return fetch(url).then(function (res) {
        //if not a valid response send the error
        if (!res || res.status !== 200 || res.type !== 'basic') {
            return res;
        }

        var response = res.clone();

        caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(event.request, response);
        });

        return res;
    })
}
