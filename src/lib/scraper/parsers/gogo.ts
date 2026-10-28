import * as cheerio from 'cheerio'

// Pure parsers for the Gogoanime mirror markup. Kept free of runtime project
// imports (no `@/` aliases) so the test harness can transpile and import this
// module on its own — see gogo-parsers.test.mjs.

export interface GogoSearchResult {
  slug: string
  title: string
  url: string
  image?: string
  status?: string
}

export interface GogoEpisodeRef {
  number: number
  url: string
}

export interface GogoSeries {
  title: string
  episodes: GogoEpisodeRef[]
  totalPages: number
}

function slugFromUrl(url: string): string {
  const cleaned = url.replace(/[?#].*$/, '').replace(/\/+$/, '')
  const parts = cleaned.split('/')
  return parts[parts.length - 1] || ''
}

function absolute(url: string, base: string): string {
  if (/^https?:/i.test(url)) return url
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

/** Search results from `GET {base}/?s={query}`. */
export function parseGogoSearch(html: string, base: string): GogoSearchResult[] {
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const results: GogoSearchResult[] = []

  // Each result is an <article class="bs"> whose inner <a> wraps the whole card,
  // so the title and poster are read from inside that anchor.
  $('article.bs a[href*="/series/"]').each((_, el) => {
    const $el = $(el)
    const url = $el.attr('href') || ''
    const slug = slugFromUrl(url)
    if (!slug || seen.has(slug)) return
    const title = ($el.attr('title') || $el.find('h2').text() || '').trim()
    if (!title) return
    seen.add(slug)
    const image = ($el.find('img').attr('src') || '').trim()
    const status = ($el.find('.status').first().text() || '').trim()
    results.push({
      slug,
      title,
      url: absolute(url, base),
      image: image || undefined,
      status: status || undefined,
    })
  })

  return results
}

/**
 * Series page from `GET {base}/series/{slug}/`.
 *
 * Episode anchors are scoped by the `{slug}-episode-` prefix rather than by a
 * container class: the series page also carries a "latest releases" sidebar for
 * other shows, and a container-scoped selector picks those up too.
 */
export function parseGogoSeries(html: string, base: string, slug: string): GogoSeries {
  const $ = cheerio.load(html)
  const rawTitle = ($('h1').first().text() || $('title').text() || '').trim()
  const title = rawTitle.replace(/\s+at\s+Gogoanime\s*$/i, '').trim()

  const marker = `${slug}-episode-`
  const seen = new Set<number>()
  const episodes: GogoEpisodeRef[] = []

  $('a[href*="-episode-"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (!href.includes(marker)) return
    const m = href.match(/-episode-(\d+)(?:-|$|\/)/)
    if (!m) return
    const number = parseInt(m[1], 10)
    if (isNaN(number) || seen.has(number)) return
    seen.add(number)
    episodes.push({ number, url: absolute(href, base) })
  })

  episodes.sort((a, b) => a.number - b.number)

  // Episode pagination is `?ep_page=N` (not `?page=N`).
  let totalPages = 1
  $('a.page-numbers').each((_, el) => {
    const m = ($(el).attr('href') || '').match(/[?&]ep_page=(\d+)/)
    if (m) totalPages = Math.max(totalPages, parseInt(m[1], 10))
  })

  return { title, episodes, totalPages }
}

const EMBED_B64 = /^[A-Za-z0-9+/]+={0,2}$/

function decodeBase64Markup(value: string): string {
  const trimmed = value.trim()
  // A real payload is base64 of an HTML fragment; anything short or containing
  // non-base64 characters is not one, and Buffer would happily decode garbage.
  if (trimmed.length < 16 || !EMBED_B64.test(trimmed)) return ''
  try {
    return Buffer.from(trimmed, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

/**
 * The playable iframe URL from an episode page. Providers change the markup
 * underneath this (megaplay.buzz → blogger, `#pembed` → `data-embed`), so try
 * the visible player first and the base64 attribute second.
 */
export function parseGogoEmbed(html: string): string | null {
  const $ = cheerio.load(html)

  const direct =
    ($('#pembed iframe').attr('src') || '').trim() ||
    ($('.player-embed iframe').attr('src') || '').trim() ||
    ($('.video-content iframe').attr('src') || '').trim() ||
    ($('#embed_holder iframe').attr('src') || '').trim()
  if (direct) return direct

  const encoded = ($('[data-embed]').first().attr('data-embed') || '').trim()
  if (encoded) {
    const decoded = decodeBase64Markup(encoded)
    const m = decoded.match(/src=["']?([^"'>\s]+)/i)
    if (m && m[1]) return m[1]
  }

  return null
}

/**
 * `<link rel="canonical">`. A missing episode does NOT 404 on this mirror — it
 * 301s to the homepage and answers 200 — so canonical identity is the only
 * reliable way to tell a hit from a redirect to the front page.
 */
export function parseCanonical(html: string): string | null {
  const $ = cheerio.load(html)
  return ($('link[rel="canonical"]').attr('href') || '').trim() || null
}

/** True when `canonical` and `requested` point at the same path. */
export function canonicalMatches(canonical: string | null, requested: string): boolean {
  if (!canonical) return false
  try {
    const a = new URL(canonical)
    const b = new URL(requested)
    return a.hostname === b.hostname && a.pathname.replace(/\/+$/, '') === b.pathname.replace(/\/+$/, '')
  } catch {
    return false
  }
}
