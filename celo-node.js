const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
}

// The URL for the remote third party API you want to fetch from
// but does not implement CORS
const API_URL = "https://celo-mainnet--rpc.datahub.figment.io"

// The endpoint you want the CORS reverse proxy to be on
const API_KEY_PATH = "/apikey/948a479c65c96ea90c218419b479fcb1"

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
    const { method, url, headers } = request
    const { host, pathname } = new URL(url)
    const dhURL = API_URL + API_KEY_PATH + pathname
    request = new Request(dhURL, request)
    request.headers.set("Origin", new URL(dhURL).origin)
    let response = await fetch(request)
    // Recreate the response so we can modify the headers
    response = new Response(response.body, response)
    // Set CORS headers
    // response.headers.set("Access-Control-Allow-Origin", url.origin)
    response.headers.set("Access-Control-Allow-Origin", headers.get("Origin"))
    // Append to/Add Vary header so browser will cache response correctly
    response.headers.append("Vary", "Origin")
    return response
}

/**
 * Responds with an uncaught error.
 * @param {Error} error
 * @returns {Response}
 */
function handleError(error) {
  console.error('Uncaught error:', error)

  const { stack } = error
  return new Response(stack || error, {
    status: 500,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8'
    }
  })
}

function handleOptions(request) {
  try {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    let headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ){
      // Handle CORS pre-flight request.
      // If you want to check or reject the requested method + headers
      // you can do that here.
      let respHeaders = {
        ...corsHeaders,
        // Allow all future content Request headers to go back to browser
        // such as Authorization (Bearer) or X-Client-Name-Version
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
      }

      return new Response(null, {
        headers: respHeaders,
      })
    }
    else {
      // Handle standard OPTIONS request.
      // If you want to allow other HTTP Methods, you can do that here.
      return new Response(null, {
        headers: {
          Allow: "GET, HEAD, POST, OPTIONS",
        },
      })
    }
  } catch(error) {
    handleError(error);
  }
}

addEventListener("fetch", event => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method === "OPTIONS") {
    // Handle CORS preflight requests
    event.respondWith(handleOptions(request))
  }
  else if(
    request.method === "GET" ||
    request.method === "HEAD" ||
    request.method === "POST"
  ){
    // Handle requests to the API server
    event.respondWith(handleRequest(request))
  }
  else {
    event.respondWith(
      new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      }),
    )
  }
})
