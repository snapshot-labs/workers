addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const request = event.request;
  let url = new URL(request.url);

  let options = { cf: { image: {} } };
  options.cf.image.fit = 'cover';
  options.cf.image.anim = false;
  options.cf.image.width = 400;
  options.cf.image.height = 400;

  const imageURL = url.searchParams.get('img');

  const cache = caches.default;
  const cacheUrl = new URL(request.url);
  const cacheKey = new Request(cacheUrl.toString(), request);

  let response = await cache.match(cacheKey);
  
  if (!response) {
    const imageRequest = new Request(imageURL, {
      headers: request.headers
    });
    response = await fetch(imageRequest, options);
    response = new Response(response.body, response);
    response.headers.append('Cache-Control', 's-maxage=604800');
    event.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    response = new Response(response.body, response);
  }
  
  response.headers.set('Cache-Control', 'max-age=31536000');
  return response;
}