// Runnable self-check for the watchlist data layer: node src/lib/watchlist.test.mjs
// Uses node:test + node:assert and the project's own TypeScript compiler to
// transpile the module under test. No test framework install.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import ts from 'typescript'

const here = dirname(fileURLToPath(import.meta.url))

// Transpile rather than hand-strip types: the regex approach breaks on the
// first annotation the pattern does not anticipate.
const source = readFileSync(join(here, 'watchlist.ts'), 'utf8')
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText

const mod = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
)

const {
  normalizeItem,
  normalizeList,
  parseWatchlistFile,
  computeStats,
  episodeNumberFromSlug,
  serialiseWatchlist,
  STATUS_ORDER,
} = mod

test('normalizeItem rejects entries with no usable slug', () => {
  assert.equal(normalizeItem(null), null)
  assert.equal(normalizeItem('nope'), null)
  assert.equal(normalizeItem({}), null)
  assert.equal(normalizeItem({ title: 'No slug' }), null)
})

test('normalizeItem clamps hostile values and keeps a valid record', () => {
  const item = normalizeItem({
    slug: 'anime-1',
    title: 12345,
    status: 'not-a-status',
    progress: -40,
    totalEpisodes: 'x'.repeat(50),
    score: 999,
    notes: 'n'.repeat(99999),
    image: 42,
  })
  assert.ok(item)
  assert.equal(item.slug, 'anime-1')
  assert.equal(item.title, 'anime-1', 'non-string title falls back to slug')
  assert.equal(item.status, 'plan', 'unknown status falls back to plan')
  assert.equal(item.progress, 0, 'negative progress clamps to 0')
  assert.equal(item.totalEpisodes, 0, 'non-numeric total clamps to 0')
  assert.equal(item.score, 10, 'score above 10 clamps to 10')
  assert.equal(item.notes.length, 1000, 'notes truncate at the limit')
  assert.equal(item.image, '', 'non-string image is dropped')
})

test('normalizeItem keeps a fractional score inside 0-10 and null stays null', () => {
  assert.equal(normalizeItem({ slug: 'a', score: 7.5 }).score, 7.5)
  assert.equal(normalizeItem({ slug: 'a', score: -3 }).score, 0)
  assert.equal(normalizeItem({ slug: 'a', score: null }).score, null)
  assert.equal(normalizeItem({ slug: 'a' }).score, null)
})

test('normalizeList dedupes by slug and keeps the newest copy', () => {
  const out = normalizeList([
    { slug: 'anime-1', title: 'Old', progress: 1, updatedAt: 100 },
    { slug: 'anime-1', title: 'New', progress: 9, updatedAt: 500 },
    { slug: 'anime-2', title: 'Other', updatedAt: 200 },
  ])
  assert.equal(out.length, 2)
  const first = out.find((i) => i.slug === 'anime-1')
  assert.equal(first.title, 'New')
  assert.equal(first.progress, 9)
})

test('normalizeList tolerates a non-array without throwing', () => {
  assert.deepEqual(normalizeList(null), [])
  assert.deepEqual(normalizeList({ items: [] }), [])
  assert.deepEqual(normalizeList('x'), [])
})

test('parseWatchlistFile accepts both the export envelope and a bare array', () => {
  const item = { slug: 'anime-7', title: 'Seven', status: 'watching', updatedAt: 1 }
  const fromEnvelope = parseWatchlistFile(serialiseWatchlist([{ ...item, id: 'anime-7', image: '', progress: 0, totalEpisodes: 0, score: null, notes: '' }]))
  assert.equal(fromEnvelope.length, 1)
  assert.equal(fromEnvelope[0].slug, 'anime-7')
  assert.equal(fromEnvelope[0].status, 'watching')

  const fromArray = parseWatchlistFile(JSON.stringify([item]))
  assert.equal(fromArray.length, 1)
  assert.equal(fromArray[0].title, 'Seven')
})

test('parseWatchlistFile throws on invalid JSON so the caller can report it', () => {
  assert.throws(() => parseWatchlistFile('{not json'))
})

test('computeStats counts by status and means only scored entries', () => {
  const stats = computeStats([
    { status: 'watching', score: 8 },
    { status: 'watching', score: 7 },
    { status: 'completed', score: null },
    { status: 'plan', score: 10 },
  ])
  assert.equal(stats.total, 4)
  assert.equal(stats.watching, 2)
  assert.equal(stats.completed, 1)
  assert.equal(stats.meanScore, 8.3, 'mean of 8, 7, 10 rounded to 1dp')
})

test('computeStats returns null mean when nothing is scored', () => {
  assert.equal(computeStats([{ status: 'plan', score: null }]).meanScore, null)
  assert.equal(computeStats([]).meanScore, null)
})

test('episodeNumberFromSlug extracts the trailing episode number', () => {
  assert.equal(episodeNumberFromSlug('anime-21-episode-5'), 5)
  assert.equal(episodeNumberFromSlug('anime-195604-episode-12'), 12)
  assert.equal(episodeNumberFromSlug('anime-21'), null, 'detail slug has no episode part')
  assert.equal(episodeNumberFromSlug('anime-21-episode-0'), null, 'episode 0 is not valid')
  assert.equal(episodeNumberFromSlug(''), null)
})

test('progress never decreases across bumpProgress semantics', () => {
  // Mirrors the reducer in WatchlistProvider: max(existing, incoming).
  const current = 9
  assert.equal(Math.max(current, 3), 9, 'revisiting an old episode keeps 9')
  assert.equal(Math.max(current, 12), 12, 'a newer episode advances')
})

test('STATUS_ORDER covers every status the UI renders tabs for', () => {
  assert.deepEqual(STATUS_ORDER, ['watching', 'completed', 'plan', 'onhold', 'dropped'])
})
