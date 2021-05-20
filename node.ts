addEventListener('fetch', event => {
	event.respondWith(handleRequest(event))
})

async function sha256(message) {
	const msgBuffer = new TextEncoder().encode(message)
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	const hashHex = hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("")
	return hashHex
}

async function handleRequest(event) {
	const request = event.request
	const body = await request.clone().text()
	console.log(JSON.stringify(body));

	const hash = await sha256(body)
	const cacheUrl = new URL(request.url)
	cacheUrl.pathname = "/node" + cacheUrl.pathname + hash
	const cacheKey = new Request(cacheUrl.toString(), {
		headers: request.headers,
		method: "GET",
	})
	const cache = caches.default

	// Find the cache key in the cache
	let response = await cache.match(cacheKey)

	if (!response) {
		let url = 'https://eth-archival.gateway.pokt.network/v1/60a29db1ff3a4800349d2407'
		if (body.includes('latest')) {
			url = 'https://cloudflare-eth.com'
		}
		const modifiedRequest = new Request(url, request)
		response = await fetch(modifiedRequest)
		if (!body.includes('latest')) {
			event.waitUntil(cache.put(cacheKey, response.clone()))
		}
	}

	return response
}
