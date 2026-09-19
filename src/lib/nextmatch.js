const RAPIDAPI_HOST = 'footapi7.p.rapidapi.com'
const BELGRANO_TEAM_ID = 3203

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const LIVE_STATUSES = ['inprogress', 'halftime']

function mapTeam (apiTeam) {
  return {
    name: apiTeam.shortName,
    image: `https://img.sofascore.com/api/v1/team/${apiTeam.id}/image`
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

// Recibe el featuredEvent crudo de la API y lo transforma a lo que usa la card
export function parseFeaturedEvent (featuredEvent) {
  if (!featuredEvent) return null

  const { homeTeam, awayTeam, tournament, roundInfo, startTimestamp, status, homeScore, awayScore } = featuredEvent
  const { hourMatch, formattedDate } = formatMatchDate(startTimestamp)

  const isLive = LIVE_STATUSES.includes(status.type)

  return {
    competition: `${tournament.name}${roundInfo?.round ? ' - Fecha ' + roundInfo.round : ''}`,
    formattedDate,
    hourMatch,
    isLive,
    statusDescription: status.description,
    localTeam: { ...mapTeam(homeTeam), score: homeScore?.current ?? null },
    visitantTeam: { ...mapTeam(awayTeam), score: awayScore?.current ?? null }
  }
}

export async function fetchFeaturedEvent (apiKey) {
  const res = await fetch(`https://footapi7.p.rapidapi.com/api/team/${BELGRANO_TEAM_ID}/featured-event`, {
    headers: {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': apiKey
    }
  })

  if (!res.ok) {
    throw new Error(`RapidAPI respondió ${res.status}`)
  }

  const { featuredEvent } = await res.json()
  return featuredEvent
}

// Usado en build time (SSG) para el primer render de la card
export async function getNextMatch () {
  const featuredEvent = await fetchFeaturedEvent(import.meta.env.RAPIDAPI_KEY)
  return parseFeaturedEvent(featuredEvent)
}