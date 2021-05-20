addEventListener("fetch", event => {
	event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
	let url = new URL(request.url)

	let options = { cf: { image: {} } }
	options.cf.image.fit = "cover"
	options.cf.image.anim = false
	options.cf.image.width = 400
	options.cf.image.height = 400

	const imageURL = url.searchParams.get("img")

	const imageRequest = new Request(imageURL, {
		headers: request.headers,
	})

	return fetch(imageRequest, options)
}
