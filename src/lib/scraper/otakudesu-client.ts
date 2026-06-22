import * as cheerio from 'cheerio'
import { fetchHTML, postAjax } from './fetcher'
import { BASE_URL } from './config'
import { extractSlug } from '@/lib/utils'
import type { StreamingSource } from '@/types'

async function resolveNonce(nonceAction: string): Promise<string | null> {
  try {
    const ajaxUrl = `${BASE_URL}/wp-admin/admin-ajax.php`
    const res = await postAjax(ajaxUrl, { action: nonceAction })
    const json = JSON.parse(res)
    return json.data || null
  } catch {
    return null
  }
}

async function resolveMirror(
  embedAction: string,
  nonce: string,
  dataContent: string,
  quality: string,
  serverName: string,
  serverIdx: number
): Promise<StreamingSource | null> {
  try {
    const decoded = Buffer.from(dataContent, 'base64').toString('utf-8')
    const params = JSON.parse(decoded)
    const ajaxUrl = `${BASE_URL}/wp-admin/admin-ajax.php`

    const res = await postAjax(ajaxUrl, {
      action: embedAction,
      nonce,
      id: String(params.id),
      i: String(params.i),
      q: String(params.q),
    })
    const json = JSON.parse(res)
    if (!json.data) return null

    const iframeHtml = Buffer.from(json.data, 'base64').toString('utf-8')
    const $iframe = cheerio.load(iframeHtml)
    const src = $iframe('iframe').attr('src') || ''
    if (!src) return null

    return {
      label: `${quality} - ${serverName}`,
      quality,
      server: serverIdx + 1,
      src,
    }
  } catch {
    return null
  }
}

export async function searchOtakuDesu(query: string): Promise<Array<{ title: string; slug: string; url: string }>> {
  try {
    const html = await fetchHTML(`${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`)
    const $ = cheerio.load(html)
    const results: Array<{ title: string; slug: string; url: string }> = []

    $('ul.chivsrc li').each((_, el) => {
      const link = $(el).find('h2 a').attr('href') || ''
      const title = $(el).find('h2 a').text().trim()
      if (title && link) {
        results.push({ title, slug: extractSlug(link), url: link })
      }
    })

    return results
  } catch {
    return []
  }
}

export async function getOtakuDesuEpisodes(animeUrl: string): Promise<Array<{ title: string; slug: string; url: string }>> {
  try {
    const html = await fetchHTML(animeUrl)
    const $ = cheerio.load(html)
    const episodes: Array<{ title: string; slug: string; url: string }> = []

    $('.episodelist ul li').each((_, el) => {
      const link = $(el).find('a').attr('href') || ''
      const title = $(el).find('a').text().trim()
      if (link.includes('/episode/')) {
        episodes.push({ title, slug: extractSlug(link), url: link })
      }
    })

    return episodes
  } catch {
    return []
  }
}

export async function getStreamingSources(episodeUrl: string): Promise<StreamingSource[]> {
  try {
    const html = await fetchHTML(episodeUrl)
    const $ = cheerio.load(html)

    const sources: StreamingSource[] = []

    const defaultIframeSrc = $('.responsive-embed-stream iframe').attr('src') || ''
    if (defaultIframeSrc) {
      sources.push({ label: 'Default', quality: 'default', server: 1, src: defaultIframeSrc })
    }

    const actionSet = new Set<string>()
    const actionRegex = /action:\s*["']([a-f0-9]{32})["']/g
    let match
    while ((match = actionRegex.exec(html)) !== null) {
      actionSet.add(match[1]!)
    }
    const actions = Array.from(actionSet)
    const embedAction = actions[0] || ''
    const nonceAction = actions[1] || ''

    interface Mirror { quality: string; server: string; dataContent: string }
    const mirrors: Mirror[] = []
    $('.mirrorstream ul').each((_, ulEl) => {
      const ulText = $(ulEl).text().trim()
      const classAttr = $(ulEl).attr('class') || ''
      const quality = classAttr.match(/m(\d+p)/)?.[1] || ulText.match(/(\d+p)/)?.[1] || 'unknown'
      $(ulEl).find('li a[data-content]').each((_, aEl) => {
        mirrors.push({
          quality,
          server: $(aEl).text().trim(),
          dataContent: $(aEl).attr('data-content') || '',
        })
      })
    })

    if (mirrors.length > 0 && nonceAction && embedAction) {
      const nonce = await resolveNonce(nonceAction)
      if (nonce) {
        const resolved = await Promise.all(
          mirrors.map((m, i) => resolveMirror(embedAction, nonce, m.dataContent, m.quality, m.server, i))
        )
        resolved.forEach(s => { if (s) sources.push(s) })
      }
    }

    return sources
  } catch {
    return []
  }
}

export async function findEpisodeUrl(animeTitle: string, episodeNum: number): Promise<string | null> {
  const results = await searchOtakuDesu(animeTitle)
  if (results.length === 0) return null

  const animeResult = results[0]
  const episodes = await getOtakuDesuEpisodes(animeResult.url)

  const target = episodes.find(ep => {
    const numMatch = ep.title.match(/episode\s*(\d+)/i)
    return numMatch && parseInt(numMatch[1], 10) === episodeNum
  })

  return target?.url || null
}
