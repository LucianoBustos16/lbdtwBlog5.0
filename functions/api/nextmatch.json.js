import { fetchMatchStatus } from '../../src/lib/nextmatch.js'

export async function onRequestGet (context) {
  const cache = caches.default
  const cacheKey = new Request(context.request.url, { method: 'GET' })

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  try {
    const status = await fetchMatchStatus(context.env.RAPIDAPI_KEY)

    const response = new Response(JSON.stringify(status), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30'
      }
    })

    context.waitUntil(cache.put(cacheKey, response.clone()))

    return response
  } catch (e) {
    return new Response(JSON.stringify({ error: true }), { status: 500 })
  }
}