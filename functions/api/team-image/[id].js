export async function onRequestGet (context) {
  const { id } = context.params
  const cache = caches.default
  const upstreamUrl = `https://img.sofascore.com/api/v1/team/${id}/image`
  const cacheKey = new Request(upstreamUrl)

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const res = await fetch(upstreamUrl, {
    headers: {
      Referer: 'https://www.sofascore.com/',
      'User-Agent': 'Mozilla/5.0 (compatible; LBDTwBot/1.0)'
    }
  })

  if (!res.ok) {
    return new Response(null, { status: 404 })
  }

  const response = new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'image/png',
      'Cache-Control': 'public, max-age=86400' // 1 día, los escudos no cambian
    }
  })

  context.waitUntil(cache.put(cacheKey, response.clone()))

  return response
}