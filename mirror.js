addEventListener('fetch', event => {
  event.respondWith(handleRequest(event, event.request));
});

async function handleRequest(event, request) {
  let url = new URL(request.url);

  let options = { cf: { image: {} } };
  options.cf.image.fit = 'cover';
  options.cf.image.anim = false;
  options.cf.image.width = 400;
  options.cf.image.height = 400;

  const imageURL = url.searchParams.get('img');
  if (!imageURL) return new Response('Missing "img" value', { status: 400 })

  const { pathname } = new URL(imageURL)
  const cache = caches.default;
  const cacheUrl = new URL(request.url);
  const cacheKey = new Request(cacheUrl.toString(), request);

  let response = await cache.match(cacheKey);
  const imageRequest = new Request(imageURL, {
    headers: request.headers
  });

  if (!response) {
    response = await fetch(imageRequest, options);
    if (response.headers.get("content-type") === 'image/svg+xml') {
      response = new Response('Disallowed file extension', { status: 400 })
    } else {
      response = new Response(response.body, response);
    }
    response.headers.append('Cache-Control', 's-maxage=60');
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
