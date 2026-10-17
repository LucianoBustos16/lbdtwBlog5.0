// Arma y dibuja las cards de partido.
// Se usa en el servidor (al compilar) y en el navegador (al refrescar),
// así el HTML es siempre el mismo y no hay dos versiones que mantener.

const BADGE_CLASSES = {
  live: 'bg-red-500/15 text-red-500',
  neutral: 'bg-surface-2 text-textLight',
  accent: 'bg-accent/15 text-accent'
}

const OUTCOME = {
  win: { label: 'Ganó', classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  draw: { label: 'Empató', classes: 'bg-neutral-500/15 text-textLight' },
  loss: { label: 'Perdió', classes: 'bg-red-500/15 text-red-500' }
}

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))

const scoreText = (score) => (score === null || score === undefined ? '-' : score)

// isBelgrano viene de la API; el nombre es un respaldo por si llega un JSON viejo de caché
export const isBelgrano = (team) => team?.isBelgrano ?? /belgrano/i.test(team?.name ?? '')

export function belgranoScore (match) {
  if (!match) return null
  const team = [match.localTeam, match.visitantTeam].find(isBelgrano)
  return team?.score ?? null
}

// 'win' | 'draw' | 'loss' | null, siempre desde el lado de Belgrano
export function belgranoOutcome (match) {
  if (!match?.isFinished) return null
  const bel = [match.localTeam, match.visitantTeam].find(isBelgrano)
  const rival = [match.localTeam, match.visitantTeam].find((t) => t !== bel)
  if (!bel || !rival || bel.score == null || rival.score == null) return null
  if (bel.score > rival.score) return 'win'
  if (bel.score < rival.score) return 'loss'
  return 'draw'
}

// Texto de la cuenta regresiva ("Faltan 2d 4h", "¡Arranca en 35 min!")
export function countdownText (startTimestamp, now = Date.now()) {
  if (!startTimestamp) return ''
  const diff = Math.round(startTimestamp - now / 1000)
  if (diff <= 0) return '¡Ya arranca!'
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (diff < 3600) return `¡Arranca en ${Math.max(m, 1)} min!`
  if (d === 0) return `Faltan ${h}h ${m}m`
  return `Faltan ${d}d ${h}h`
}

// Devuelve las cards en orden de importancia: en vivo > próximo partido > último jugado
export function buildCards (status) {
  const recentOrLive = status?.recentOrLive ?? null
  const upcoming = status?.upcoming ?? null
  const isLive = Boolean(recentOrLive?.isLive)

  const recentCard = recentOrLive
    ? {
        key: 'recent',
        title: isLive ? 'En vivo' : 'Partido anterior',
        variant: isLive ? 'live' : 'neutral',
        match: recentOrLive
      }
    : null

  const upcomingCard = upcoming
    ? { key: 'upcoming', title: 'Próximo partido', variant: 'accent', match: upcoming }
    : null

  const important = isLive ? recentCard : (upcomingCard ?? recentCard)
  const other = important === recentCard ? upcomingCard : recentCard

  return [important, other].filter(Boolean)
}

function renderTeam (team) {
  const bel = isBelgrano(team)
  const img = team.image
    ? `<img src="${escapeHtml(team.image)}" alt="${escapeHtml(team.name)}" width="48" height="48" loading="lazy" class="h-12 w-12 rounded-full border bg-surface-2 object-contain p-1 ${bel ? 'border-primary' : 'border-border'}" />`
    : ''
  return `<div class="flex flex-1 flex-col items-center gap-2 min-w-0">
    ${img}
    <span class="w-full truncate text-center text-sm ${bel ? 'font-bold text-primary' : 'font-semibold text-textDark'}">${escapeHtml(team.name)}</span>
  </div>`
}

function renderScore (team) {
  const bel = isBelgrano(team)
  return `<span class="inline-block ${bel ? 'text-primary' : ''}"${bel ? ' data-belgrano-score' : ''}>${escapeHtml(scoreText(team.score))}</span>`
}

function renderMiniCard ({ title, variant, match }) {
  const isLive = variant === 'live'
  const showScore = match.isLive || match.isFinished
  const outcome = OUTCOME[belgranoOutcome(match)]

  const center = showScore
    ? `<span class="text-2xl font-bold text-textDark"${isLive ? ' aria-live="polite"' : ''}>${renderScore(match.localTeam)}<span class="mx-1">-</span>${renderScore(match.visitantTeam)}</span>`
    : `<div class="text-center">
        <p class="text-sm font-bold text-textDark">${escapeHtml(match.hourMatch)}</p>
        <p class="text-xs text-textLight">${escapeHtml(match.formattedDate)}</p>
      </div>`

  const countdown = !showScore && match.startTimestamp
    ? `<p class="mt-4 text-center font-display text-sm font-bold uppercase tracking-wide text-primary" data-countdown="${escapeHtml(match.startTimestamp)}">${escapeHtml(countdownText(match.startTimestamp))}</p>`
    : ''

  return `<div class="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 min-w-0" data-match-card="${escapeHtml(match.id ?? '')}">
    <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
      <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${BADGE_CLASSES[variant] ?? ''}">
        ${isLive ? '<span class="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>' : ''}
        <span>${escapeHtml(title)}</span>
        ${isLive && match.statusDescription ? `<span>· ${escapeHtml(match.statusDescription)}</span>` : ''}
      </span>
      ${outcome ? `<span class="inline-flex rounded-full px-3 py-1 text-xs font-bold ${outcome.classes}">${outcome.label}</span>` : ''}
    </div>
    <p class="text-xs text-textLight text-center mb-4 truncate">${escapeHtml(match.competition)}</p>
    <div class="flex flex-1 items-center justify-between gap-2">
      ${renderTeam(match.localTeam)}
      <div class="flex shrink-0 flex-col items-center px-2">${center}</div>
      ${renderTeam(match.visitantTeam)}
    </div>
    ${countdown}
  </div>`
}

export function renderMatchCards (cards) {
  return cards
    .map((card) => `<div class="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">${renderMiniCard(card)}</div>`)
    .join('')
}
