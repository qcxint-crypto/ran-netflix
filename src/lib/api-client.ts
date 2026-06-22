import type { ApiResponse } from '@/types'

export async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(path, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const json: ApiResponse<T> = await res.json()
  if (!json.ok || !json.data) throw new Error(json.error || 'Unknown error')
  return json.data
}

export async function fetchApiClient<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const json: ApiResponse<T> = await res.json()
  if (!json.ok || !json.data) throw new Error(json.error || 'Unknown error')
  return json.data
}
