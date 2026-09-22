const RAPIDAPI_HOST = 'footapi7.p.rapidapi.com'
const BELGRANO_TEAM_ID = 3203

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const LIVE_STATUSES = ['inprogress', 'halftime']
const FINISHED_STATUSES = ['finished']

function mapTeam (apiTeam) {
  return {
    name: apiTeam.shortName,
    image: `/api/team-image/${apiTeam.id}`
  }
}

function formatMatchDate (startTimestamp) {
  const date = new Date(startTimestamp * 1000)
  const optionsHours = { timeZone: 'America/Argentina/Buenos_Aires', hour12: false }
  const hourAr = date.toLocaleString('es-AR', optionsHours)
  const [fecha, horaCompleta] = hourAr.split(' ')
  const [hora, minutos] = horaCompleta.split(':')
  const hourMatch = `${hora}:${minutos}`

  const [day] = fecha.split('/')
  const formattedDate = `${day} ${MESES[date.getMonth()]}`

  return { hourMatch, formattedDate }
}

export function parseEvent (event) {
  if (!event) return null

  const { homeTeam, awayTeam, tournament, roundInfo, startTimestamp, status, homeScore, awayScore } = event
  const { hourMatch, formattedDate } = formatMatchDate(startTimestamp)

  const isLive = LIVE_STATUSES.includes(status.type)
  const isFinished = FINISHED_STATUSES.includes(status.type)

  return {
    competition: `${tournament.name}${roundInfo?.round ? ' - Fecha ' + roundInfo.round : ''}`,
    formattedDate,
    hourMatch,
    isLive,
    isFinished,
    statusDescription: status.description,
    localTeam: { ...mapTeam(homeTeam), score: homeScore?.current ?? null },
    visitantTeam: { ...mapTeam(awayTeam), score: awayScore?.current ?? null }
  }
}

async function fetchFeaturedEvent (apiKey) {
  const res = await fetch(`https://footapi7.p.rapidapi.com/api/team/${BELGRANO_TEAM_ID}/featured-event`, {
    headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': apiKey }
  })
  if (!res.ok) throw new Error(`RapidAPI featured-event respondió ${res.status}`)
  const { featuredEvent } = await res.json()
  return featuredEvent
}

async function fetchPreviousEvents (apiKey) {
  const res = await fetch(`https://footapi7.p.rapidapi.com/api/team/${BELGRANO_TEAM_ID}/matches/previous/0`, {
    headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': apiKey }
  })
  if (!res.ok) throw new Error(`RapidAPI matches/previous respondió ${res.status}`)
  const { events } = await res.json()
  return events ?? []
}

async function fetchNextEvents (apiKey) {
  const res = await fetch(`https://footapi7.p.rapidapi.com/api/team/${BELGRANO_TEAM_ID}/matches/next/0`, {
    headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': apiKey }
  })
  if (!res.ok) throw new Error(`RapidAPI matches/next respondió ${res.status}`)
  const { events } = await res.json()
  return events ?? []
}

// Devuelve { recentOrLive, upcoming } — como la sección de SofaScore:
// - recentOrLive: el partido en vivo si hay uno jugándose ahora, si no el último jugado
// - upcoming: el próximo partido confirmado
export async function fetchMatchStatus (apiKey) {
  const [featuredResult, previousResult, nextResult] = await Promise.allSettled([
    fetchFeaturedEvent(apiKey),
    fetchPreviousEvents(apiKey),
    fetchNextEvents(apiKey)
  ])

  const featured = featuredResult.status === 'fulfilled' ? featuredResult.value : null
  const previous = previousResult.status === 'fulfilled' ? previousResult.value : []
  const next = nextResult.status === 'fulfilled' ? nextResult.value : []

  const isFeaturedLive = featured && LIVE_STATUSES.includes(featured.status.type)

  // El más reciente = el de mayor startTimestamp (no asumo el orden del array)
  const mostRecentPrevious = previous.reduce((latest, event) => {
    if (!latest || event.startTimestamp > latest.startTimestamp) return event
    return latest
  }, null)

  const recentOrLiveEvent = isFeaturedLive ? featured : mostRecentPrevious

  return {
    recentOrLive: parseEvent(recentOrLiveEvent),
    upcoming: parseEvent(next[0] ?? null)
  }
}