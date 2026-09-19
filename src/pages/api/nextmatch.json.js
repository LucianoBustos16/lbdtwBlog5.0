import { fetchFeaturedEvent, parseFeaturedEvent } from '@/lib/nextmatch.js'

export const prerender = false

export async function GET ({ locals, request }) {
  const cache = caches.default
  const cacheKey = new Request(new URL(request.url), { method: 'GET' })

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  try {
    const apiKey = locals.runtime.env.RAPIDAPI_KEY
    const featuredEvent = await fetchFeaturedEvent(apiKey)
    const match = parseFeaturedEvent(featuredEvent)

    const response = new Response(JSON.stringify(match), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30'
      }
    })

    locals.runtime.ctx.waitUntil(cache.put(cacheKey, response.clone()))

    return response
  } catch (e) {
    return new Response(JSON.stringify({ error: true }), { status: 500 })
  }
}