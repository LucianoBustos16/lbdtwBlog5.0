// Arma y dibuja las cards de partido.
// Se usa en el servidor (al compilar) y en el navegador (al refrescar),
// así el HTML es siempre el mismo y no hay dos versiones que mantener.

const BADGE_CLASSES = {
  live: 'bg-red-500/15 text-red-500',
  neutral: 'bg-surface-2 text-textLight',
  accent: 'bg-accent/15 text-accent'
}

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))

const scoreText = (score) => (score === null || score === undefined ? '-' : score)

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
  const img = team.image
    ? `<img src="${escapeHtml(team.image)}" alt="" loading="lazy" class="h-12 w-12 rounded-full border border-border bg-surface-2 object-contain p-1" />`
    : ''
  return `<div class="flex flex-1 flex-col items-center gap-2 min-w-0">
    ${img}
    <span class="w-full truncate text-center text-sm font-semibold text-textDark">${escapeHtml(team.name)}</span>
  </div>`
}

function renderMiniCard ({ title, variant, match }) {
  const isLive = variant === 'live'
  const showScore = match.isLive || match.isFinished

  const center = showScore
    ? `<span class="text-2xl font-bold text-textDark">${escapeHtml(scoreText(match.localTeam.score))}<span class="mx-1">-</span>${escapeHtml(scoreText(match.visitantTeam.score))}</span>`
    : `<div class="text-center">
        <p class="text-sm font-bold text-textDark">${escapeHtml(match.hourMatch)}</p>
        <p class="text-xs text-textLight">${escapeHtml(match.formattedDate)}</p>
      </div>`

  return `<div class="rounded-2xl border border-border bg-surface p-5 min-w-0">
    <div class="flex items-center justify-center mb-4">
      <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${BADGE_CLASSES[variant] ?? ''}">
        ${isLive ? '<span class="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>' : ''}
        <span>${escapeHtml(title)}</span>
        ${isLive && match.statusDescription ? `<span>· ${escapeHtml(match.statusDescription)}</span>` : ''}
      </span>
    </div>
    <p class="text-xs text-textLight text-center mb-4 truncate">${escapeHtml(match.competition)}</p>
    <div class="flex items-center justify-between gap-2">
      ${renderTeam(match.localTeam)}
      <div class="flex shrink-0 flex-col items-center px-2">${center}</div>
      ${renderTeam(match.visitantTeam)}
    </div>
  </div>`
}

export function renderMatchCards (cards) {
  return cards
    .map((card) => `<div class="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">${renderMiniCard(card)}</div>`)
    .join('')
}
