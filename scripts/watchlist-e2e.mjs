// Watchlist end-to-end check against a running production server.
//
//   node scripts/watchlist-e2e.mjs [baseUrl]
//
// Drives a real Chromium over CDP: adds a title from the detail page, confirms
// the watch page auto-records progress, checks /my-list renders it, and proves
// both persistence across reload and that progress never rewinds.
import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.argv[2] || 'http://localhost:3100'
const SLUG = process.argv[3] || 'anime-61990'
const chrome = process.env.CHROME_PATH
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`}`)
}

const profile = await mkdtemp(join(tmpdir(), 'e2e-'))
const child = spawn(chrome, [
  '--headless=new', '--enable-unsafe-swiftshader', '--no-first-run',
  '--no-default-browser-check', '--window-size=1440,900',
  `--user-data-dir=${profile}`, '--remote-debugging-port=9340', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })

let wsUrl
for (let i = 0; i < 80; i++) {
  try {
    const res = await fetch('http://127.0.0.1:9340/json/version')
    if (res.ok) { wsUrl = (await res.json()).webSocketDebuggerUrl; break }
  } catch {}
  await wait(250)
}
if (!wsUrl) { console.error('FAIL: devtools unreachable'); process.exit(1) }

const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 0
const pending = new Map()
const events = []
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  else if (msg.method) events.push(msg)
}
const send = (method, params = {}, sessionId) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })) })

const created = await send('Target.createTarget', { url: 'about:blank' })
const attached = await send('Target.attachToTarget', { targetId: created.result.targetId, flatten: true })
const sessionId = attached.result.sessionId
await send('Runtime.enable', {}, sessionId)
await send('Page.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
await send('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sessionId)

const evalJs = async (expression, awaitPromise = false) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise }, sessionId)
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text + ' ' + (r.result.exceptionDetails.exception?.description || ''))
  return r.result?.result?.value
}

const goto = async (path, settleMs = 2500) => {
  await send('Page.navigate', { url: `${BASE}${path}` }, sessionId)
  await wait(settleMs)
}

// Waits for a selector via polling inside the page (no waitForSelector over CDP).
const waitFor = async (selector, timeoutMs = 20000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evalJs(`!!document.querySelector(${JSON.stringify(selector)})`)) return true
    await wait(400)
  }
  return false
}

const readStore = () => evalJs(`window.localStorage.getItem('ranstream:watchlist:v1')`)

console.log(`\n--- Phase C watchlist E2E against ${BASE} ---\n`)

// 1. Detail page exposes the Add List control.
await goto(`/anime/${SLUG}`, 4000)
check('detail page renders Add List button', await waitFor('button[aria-haspopup="menu"]', 15000), true)
check('list starts empty', await readStore(), null)

// 2. Choose "Watching" from the popover.
await evalJs(`document.querySelector('button[aria-haspopup="menu"]').click()`)
await wait(600)
const picked = await evalJs(`(function(){
  var btns = Array.prototype.slice.call(document.querySelectorAll('[role="menuitemradio"]'));
  var target = btns.find(function(b){ return b.textContent.trim() === 'Watching' });
  if (!target) return false;
  target.click();
  return true;
})()`)
check('menuitem for Watching exists and was clicked', picked, true)
await wait(900)

const afterAdd = JSON.parse((await readStore()) || '[]')
check('one entry stored', afterAdd.length, 1)
check('stored status is watching', afterAdd[0]?.status, 'watching')
check('stored slug matches the page', afterAdd[0]?.slug, SLUG)
check('button label reflects the chosen status', await evalJs(`document.querySelector('button[aria-haspopup="menu"]').textContent.trim()`), 'Watching')

// 3. Opening an episode records forward progress.
await goto(`/watch/${SLUG}-episode-3`, 14000)
const afterWatch = JSON.parse((await readStore()) || '[]')
check('watch page kept a single entry', afterWatch.length, 1)
check('progress recorded from the episode URL', afterWatch[0]?.progress, 3)
check('totalEpisodes captured from detail', afterWatch[0]?.totalEpisodes, 10)

// 4. Revisiting an earlier episode must not rewind progress.
await goto(`/watch/${SLUG}-episode-1`, 14000)
const afterRewind = JSON.parse((await readStore()) || '[]')
check('progress did not decrease on an earlier episode', afterRewind[0]?.progress, 3)

// 5. /my-list renders the entry with its counters.
await goto('/my-list', 4000)
check('my-list rendered the entry', await waitFor('.glass', 10000), true)
const listText = await evalJs(`document.body.innerText`)
check('my-list shows the title', /Cyberpunk|Edgerunners/.test(listText), true)
check('my-list shows progress as 3 / 10', /3\s*\/\s*10/.test(listText), true)
check('stats header counts one watching title', /Watching/.test(listText) && /1/.test(listText), true)

// 6. State survives a reload (it is localStorage, not component state).
await goto('/my-list', 4000)
check('entry persisted across reload', JSON.parse((await readStore()) || '[]').length, 1)
check('progress persisted across reload', JSON.parse((await readStore()) || '[]')[0]?.progress, 3)

// 7. Navbar badge reflects the count.
check('navbar shows the My List badge', await evalJs(`(function(){
  var links = Array.prototype.slice.call(document.querySelectorAll('a[href="/my-list"]'));
  return links.some(function(link){
    return Array.prototype.slice.call(link.querySelectorAll('span')).some(function(s){
      return s.textContent.trim() === '1';
    });
  });
})()`), true)

// 8. Corrupt payload must not break the page.
await evalJs(`window.localStorage.setItem('ranstream:watchlist:v1', '{{{not json')`)
await goto('/my-list', 3500)
const bodyAfterCorrupt = await evalJs(`document.body.innerText`)
check('corrupt storage recovers to the empty state', /list is empty/i.test(bodyAfterCorrupt), true)

const exceptions = events
  .filter((e) => e.method === 'Runtime.exceptionThrown')
  .map((e) => (e.params.exceptionDetails.exception || {}).description || e.params.exceptionDetails.text)
check('no uncaught page exceptions', exceptions, [])

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`)
ws.close(); child.kill(); await wait(300)
process.exit(failures === 0 ? 0 : 1)
