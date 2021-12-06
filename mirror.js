addEventListener('fetch', event => {
  event.respondWith(handleRequest(event, event.request));
});

async function handleRequest(event, request) {
  let url = new URL(request.url);

  let options = { cf: { image: {} } };
  options.cf.image.fit = 'cover';
  options.cf.image.anim = false;
  options.cf.image.width = 240;
  options.cf.image.height = 240;

  const imageURL = url.searchParams.get('img');
  if (!imageURL) return new Response('Missing "img" value', { status: 400 })

  const cache = caches.default;
  const cacheUrl = new URL(request.url);
  const cacheKey = new Request(cacheUrl.toString(), request);

  let response = await cache.match(cacheKey);
  const hasCache = response ? true : false;
  
  if (!hasCache) {
    const imageRequest = new Request(imageURL, { headers: request.headers });
    response = await fetch(imageRequest, options);
  }

  const type = response.headers.get("content-type");
  if (type.includes('image/svg+xml') || type.includes('text/html')) {
    response = new Response('Disallowed file extension', { status: 400 })
  }

  response = new Response(response.body, response);
  response.headers.append('Cache-Control', 's-maxage=60');
  response.headers.append('Cache-Control', 'max-age=60');

  if (!hasCache) {
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
