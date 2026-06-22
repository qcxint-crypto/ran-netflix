import * as cheerio from 'cheerio'
import type { EpisodeData, StreamingSource } from '@/types'
import { extractSlug } from '@/lib/utils'
import { BASE_URL } from '../config'
import { postAjax } from '../fetcher'

async function resolveNonce(ajaxUrl: string, nonceAction: string): Promise<string | null> {
  try {
    const res = await postAjax(ajaxUrl, { action: nonceAction })
    const json = JSON.parse(res)
    return json.data || null
  } catch {
    return null
  }
}

async function resolveMirror(
  ajaxUrl: string,
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

export async function parseEpisode(html: string): Promise<EpisodeData> {
  const $ = cheerio.load(html)

  const title = $('h1.posttl').text().trim() || $('h1').first().text().trim()

  const prevLink = $('a:contains("Previous Eps.")').attr('href') || ''
  const nextLink = $('a:contains("Next Eps.")').attr('href') || ''

  const animeLink = $('.flir a[href*="/anime/"]').attr('href') ||
    $('a:contains("See All Episodes")').attr('href') || ''

  const actionSet = new Set<string>()
  const actionRegex = /action:\s*["']([a-f0-9]{32})["']/g
  let match
  while ((match = actionRegex.exec(html)) !== null) {
    actionSet.add(match[1]!)
  }
  const actions = Array.from(actionSet)
  const embedAction = actions[0] || ''
  const nonceAction = actions[1] || ''

  const sources: StreamingSource[] = []

  const defaultIframeSrc = $('.responsive-embed-stream iframe').attr('src') || ''
  if (defaultIframeSrc) {
    sources.push({ label: 'Default', quality: 'default', server: 1, src: defaultIframeSrc })
  }

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
    const ajaxUrl = `${BASE_URL}/wp-admin/admin-ajax.php`
    const nonce = await resolveNonce(ajaxUrl, nonceAction)

    if (nonce) {
      const resolved = await Promise.all(
        mirrors.map((m, i) => resolveMirror(ajaxUrl, embedAction, nonce, m.dataContent, m.quality, m.server, i))
      )
      resolved.forEach(s => { if (s) sources.push(s) })
    }
  }

  return {
    title,
    animeSlug: animeLink ? extractSlug(animeLink) : undefined,
    prevSlug: prevLink ? extractSlug(prevLink) : undefined,
    nextSlug: nextLink ? extractSlug(nextLink) : undefined,
    sources,
  }
}
