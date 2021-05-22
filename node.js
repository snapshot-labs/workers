addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => ('00' + b.toString(16)).slice(-2))
    .join('');
  return hashHex;
}

async function handleRequest(event) {
  const request = event.request;
  const body = await request.clone().text();
  const { method: rpcMethod = null, params = null } = body
    ? JSON.parse(body)
    : {};
  const isEthCall =
    rpcMethod === 'eth_call' &&
    params &&
    params.length > 1 &&
    params[1] !== 'latest';
  const isEthCallLatest =
    rpcMethod === 'eth_call' &&
    params &&
    params.length > 1 &&
    params[1] === 'latest';
  const isEthChainId = rpcMethod === 'eth_chainId';

  let response = null;
  const cache = caches.default;
  let cacheKey = null;

  if (isEthCall || isEthChainId) {
    const hash = await sha256(isEthCall ? JSON.stringify(params) : rpcMethod);
    const cacheUrl = new URL(request.url);
    cacheUrl.pathname = '/snapshot' + cacheUrl.pathname + hash;
    cacheKey = new Request(cacheUrl.toString(), {
      headers: request.headers,
      method: 'GET'
    });
    // Find the cache key in the cache
    response = await cache.match(cacheKey);
  }

  if (!response) {
    let url =
      'https://eth-archival.gateway.pokt.network/v1/60a29db1ff3a4800349d2407';
    if (isEthCallLatest) {
      url = 'https://cloudflare-eth.com';
    }

    const modifiedRequest = new Request(url, request);
    response = await fetch(modifiedRequest);
    response = new Response(response.body, response);
    response.headers.append('Cache-Control', 's-maxage=604800');
    if (isEthCall || isEthChainId) {
      event.waitUntil(cache.put(cacheKey, response.clone()));
    }
  }

  return response;
}
