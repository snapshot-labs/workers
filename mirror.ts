addEventListener("fetch", event => {
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
	const request = event.request;
	let url = new URL(request.url)

	let options = { cf: { image: {} } }
	options.cf.image.fit = "cover"
	options.cf.image.anim = false
	options.cf.image.width = 400
	options.cf.image.height = 400

	const imageURL = url.searchParams.get("img")
	
	const cache = caches.default
	const hash = await sha256(imageURL)
	const cacheUrl = new URL(request.url)
	cacheUrl.pathname = "/snapshot" + cacheUrl.pathname + hash
	cacheKey = new Request(cacheUrl.toString(), {
		headers: request.headers,
		method: "GET",
	})
	let response = await cache.match(cacheKey)
	const imageRequest = new Request(imageURL, {
		headers: request.headers,
	})

	if (!response) {
		response = await fetch(imageRequest, options)
		event.waitUntil(cache.put(cacheKey, response.clone()))
	}
	return response
}
