import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import ts from 'typescript'

// The parser module carries no runtime project imports (only cheerio), so it can
// be transpiled and loaded here on its own — same idea as watchlist.test.mjs.
//
// The transpiled copy goes to a sibling file rather than a data: URL because
// node cannot resolve a bare specifier ("cheerio") from a data: URL. Writing
// next to the source keeps node_modules resolution working. File is removed in
// the finally below; a crash before that leaves a gitignored build artifact.

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, 'gogo.ts'), 'utf8')
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText

const buildPath = join(here, `.gogo-parser.test-${process.pid}.mjs`)
let mod
try {
  writeFileSync(buildPath, js)
  mod = await import(pathToFileURL(buildPath).href)
} finally {
  rmSync(buildPath, { force: true })
}

const { parseGogoSearch, parseGogoSeries, parseGogoEmbed, parseCanonical, canonicalMatches } = mod
const BASE = 'https://gogoanime.fi'

test('parseGogoSearch reads article.bs cards and dedupes by slug', () => {
  const html = `
    <div class="listupd">
      <article class="bs">
        <div class="bsx"><a href="https://gogoanime.fi/series/one-piece/" title="One Piece">
          <img src="https://cdn.example/one-piece.jpg" />
          <div class="status">Ongoing</div>
        </a></div>
      </article>
      <article class="bs">
        <div class="bsx"><a href="/series/naruto/" title="Naruto">
          <img src="https://cdn.example/naruto.jpg" />
        </a></div>
      </article>
      <article class="bs">
        <div class="bsx"><a href="/series/naruto/" title="Naruto duplicate"></a></div>
      </article>
    </div>`
  const results = parseGogoSearch(html, BASE)
  assert.equal(results.length, 2)
  assert.equal(results[0].slug, 'one-piece')
  assert.equal(results[0].title, 'One Piece')
  assert.equal(results[0].url, 'https://gogoanime.fi/series/one-piece/')
  assert.equal(results[0].status, 'Ongoing')
  // Relative hrefs resolve against the configured base, not the live default.
  assert.equal(results[1].url, 'https://gogoanime.fi/series/naruto/')
})

test('parseGogoSearch returns [] for the "Not Found" page', () => {
  // Searching a term the mirror lacks answers 200 with a centred heading, not a
  // 404 — so an empty parse, never a throw, is the contract.
  const html = '<center><h3>Not Found</h3></center>'
  assert.deepEqual(parseGogoSearch(html, BASE), [])
})

test('parseGogoSeries scopes episodes by slug and reads ?ep_page pagination', () => {
  const html = `
    <h1>Jujutsu Kaisen at Gogoanime</h1>
    <div class="eplister">
      <a href="/jujutsu-kaisen-episode-2-english-subbed/">Ep 2</a>
      <a href="/jujutsu-kaisen-episode-1-english-subbed/">Ep 1</a>
    </div>
    <div class="listupd">
      <a href="/other-show-episode-9-english-subbed/">Other show</a>
    </div>
    <div class="pagination">
      <a class="page-numbers" href="/series/jujutsu-kaisen/?ep_page=2">2</a>
      <a class="page-numbers" href="/series/jujutsu-kaisen/?ep_page=7">7</a>
    </div>`
  const series = parseGogoSeries(html, BASE, 'jujutsu-kaisen')
  assert.equal(series.title, 'Jujutsu Kaisen')
  // Sorted ascending, and the other show's episode is excluded.
  assert.deepEqual(series.episodes.map((e) => e.number), [1, 2])
  assert.equal(series.episodes[0].url, 'https://gogoanime.fi/jujutsu-kaisen-episode-1-english-subbed/')
  assert.equal(series.totalPages, 7)
})

test('parseGogoEmbed prefers the visible player over data-embed', () => {
  const visible = `
    <div id="pembed"><iframe src="https://blogger.com/video.g?token=abc"></iframe></div>`
  assert.equal(parseGogoEmbed(visible), 'https://blogger.com/video.g?token=abc')

  const fallbackSelector = `<div class="video-content"><iframe src="https://x.example/e"></iframe></div>`
  assert.equal(parseGogoEmbed(fallbackSelector), 'https://x.example/e')
})

test('parseGogoEmbed decodes a base64 data-embed payload', () => {
  const inner = '<iframe src="https://megaplay.buzz/stream/s-2/12345/sub?s=tcdn"></iframe>'
  const encoded = Buffer.from(inner, 'utf8').toString('base64')
  const html = `<div id="embed_holder"><div data-embed="${encoded}"></div></div>`
  assert.equal(parseGogoEmbed(html), 'https://megaplay.buzz/stream/s-2/12345/sub?s=tcdn')
})

test('parseGogoEmbed rejects a short or non-base64 data-embed', () => {
  // Buffer decodes garbage silently, so the length + charset guard is what keeps
  // this from returning junk as a player URL.
  assert.equal(parseGogoEmbed('<div data-embed="x.getAttribute"></div>'), null)
  assert.equal(parseGogoEmbed('<div data-embed="short"></div>'), null)
  assert.equal(parseGogoEmbed('<div>no player here</div>'), null)
})

test('canonicalMatches detects the redirect-to-homepage miss', () => {
  const home = '<link rel="canonical" href="https://gogoanime.fi/" />'
  assert.equal(parseCanonical(home), 'https://gogoanime.fi/')
  // A missing episode 301s to the front page and answers 200, so the canonical
  // link is the only reliable hit/miss signal.
  assert.equal(
    canonicalMatches(parseCanonical(home), 'https://gogoanime.fi/one-piece-episode-99999-english-subbed/'),
    false
  )

  const hit = '<link rel="canonical" href="https://gogoanime.fi/one-piece-episode-1-english-subbed/" />'
  assert.equal(
    canonicalMatches(parseCanonical(hit), 'https://gogoanime.fi/one-piece-episode-1-english-subbed'),
    true
  )
  assert.equal(canonicalMatches(null, 'https://gogoanime.fi/x/'), false)
})
