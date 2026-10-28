// Thrown when a request is well-formed but the resource does not exist — a bad
// slug shape or an upstream 404. Routes map it to 404 so a missing title is not
// reported as a server fault.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export const BASE_URL = process.env.SCRAPE_BASE_URL || 'https://otakudesu.cloud'

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

export const FETCH_TIMEOUT = 20000
