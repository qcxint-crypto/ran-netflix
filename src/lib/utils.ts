export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function extractSlug(url: string): string {
  const cleaned = url.replace(/\/$/, '')
  const parts = cleaned.split('/')
  return parts[parts.length - 1] || ''
}

export function formatEpisodeTitle(title: string): string {
  return title.replace(/^Episode\s*/i, 'Ep ').trim()
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
