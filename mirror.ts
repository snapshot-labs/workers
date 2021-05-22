addEventListener("fetch", event => {
	event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
	const request = event.request
	let url = new URL(request.url)

	let options = { cf: { image: {} } }
	options.cf.image.fit = "cover"
	options.cf.image.anim = false
	options.cf.image.width = 400
	options.cf.image.height = 400

	const imageURL = url.searchParams.get("img")
	
	const cache = caches.default
  const cacheUrl = new URL(request.url)
  const cacheKey = new Request(cacheUrl.toString(), request)

	let response = await cache.match(cacheKey)
	const imageRequest = new Request(imageURL, {
		headers: request.headers,
	})

	if (!response) {
		response = await fetch(imageRequest, options)
    response.headers.append("Cache-Control", "s-maxage=604800")
		event.waitUntil(cache.put(cacheKey, response.clone()))
	}
  
	return response
}
