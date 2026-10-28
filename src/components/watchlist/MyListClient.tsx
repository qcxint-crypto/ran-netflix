'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWatchlist } from './WatchlistProvider'
import {
  STATUS_LABELS,
  STATUS_ORDER,
  parseWatchlistFile,
  serialiseWatchlist,
  type WatchStatus,
  type WatchlistItem,
} from '@/lib/watchlist'

type TabKey = WatchStatus | 'all'
type ViewMode = 'grid' | 'list'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  ...STATUS_ORDER.map((key) => ({ key, label: STATUS_LABELS[key] })),
]

export default function MyListClient() {
  const { items, stats, ready, upsert, remove, replaceAll, get } = useWatchlist()
  const [tab, setTab] = useState<TabKey>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [editing, setEditing] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((i) => i.status === tab)),
    [items, tab],
  )

  const exportJson = () => {
    const blob = new Blob([serialiseWatchlist(items)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ranstream-watchlist-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    try {
      const incoming = parseWatchlistFile(await file.text())
      if (!incoming.length) {
        setNotice('That file contained no usable entries.')
        return
      }
      replaceAll(incoming)
      setNotice(`Imported ${incoming.length} ${incoming.length === 1 ? 'title' : 'titles'}.`)
    } catch {
      setNotice('Could not read that file — expected RANStream watchlist JSON.')
    }
  }

  if (!ready) {
    return (
      <div className="glass rounded-2xl h-64 animate-pulse" aria-hidden />
    )
  }

  if (!items.length) {
    return (
      <div className="glass rounded-3xl px-6 py-16 text-center">
        <h2 className="font-display text-xl font-bold mb-2">Your list is empty</h2>
        <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
          Open any anime and use the <span className="text-text-primary">Add List</span> button to
          start tracking what you watch. Progress is saved in this browser.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/ongoing"
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black rounded-full text-sm font-semibold transition-colors"
          >
            Browse anime
          </Link>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-5 py-2.5 glass rounded-full text-sm font-medium text-text-primary hover:border-accent/50 transition-colors"
          >
            Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importJson(f)
            e.target.value = ''
          }}
        />
        {notice && <p className="mt-5 text-sm text-text-secondary">{notice}</p>}
      </div>
    )
  }

  return (
    <div>
      {/* Stats header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile label="Total" value={String(stats.total)} />
        <StatTile label="Watching" value={String(stats.watching)} />
        <StatTile label="Completed" value={String(stats.completed)} />
        <StatTile label="Mean score" value={stats.meanScore === null ? '—' : String(stats.meanScore)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex flex-wrap gap-1.5 min-w-0" role="tablist" aria-label="Filter by status">
          {TABS.map((t) => {
            const count =
              t.key === 'all' ? items.length : items.filter((i) => i.status === t.key).length
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-2 rounded-full text-sm transition-colors ${
                  tab === t.key
                    ? 'bg-accent text-black font-semibold'
                    : 'glass text-text-secondary hover:text-text-primary'
                }`}
              >
                {t.label}
                <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-black/60' : 'text-text-muted'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="glass rounded-full p-1 flex" role="group" aria-label="Layout">
            {(['grid', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                aria-pressed={view === mode}
                aria-label={`${mode} view`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  view === mode ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportJson}
            className="px-3.5 py-2 glass rounded-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-3.5 py-2 glass rounded-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importJson(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {notice && (
        <p className="mb-5 text-sm text-text-secondary glass rounded-xl px-4 py-3">{notice}</p>
      )}

      {!filtered.length ? (
        <div className="glass rounded-2xl px-6 py-12 text-center text-sm text-text-secondary">
          Nothing in {tab === 'all' ? 'your list' : STATUS_LABELS[tab as WatchStatus]} yet.
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <GridItem key={item.slug} item={item} onEdit={() => setEditing(item.slug)} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-border/50 overflow-hidden">
          {filtered.map((item) => (
            <ListItem
              key={item.slug}
              item={item}
              editing={editing === item.slug}
              onEdit={() => setEditing(item.slug)}
              onClose={() => setEditing(null)}
              onSave={(patch) => {
                upsert(item.slug, patch)
                setEditing(null)
              }}
              onRemove={() => {
                remove(item.slug)
                setEditing(null)
              }}
            />
          ))}
        </div>
      )}

      {/* Editing in grid view needs somewhere to happen; reuse the list editor. */}
      {view === 'grid' && editing && get(editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-strong rounded-2xl p-5 border border-border/60">
            <ListEditor
              item={get(editing)!}
              onClose={() => setEditing(null)}
              onSave={(patch) => {
                upsert(editing, patch)
                setEditing(null)
              }}
              onRemove={() => {
                remove(editing)
                setEditing(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1">{label}</div>
      <div className="font-display text-2xl font-bold text-text-primary">{value}</div>
    </div>
  )
}

function ProgressBadge({ item }: { item: WatchlistItem }) {
  const total = item.totalEpisodes || null
  return (
    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[11px] font-medium text-text-primary">
      {item.progress}
      {total ? ` / ${total}` : ''}
    </span>
  )
}

function GridItem({ item, onEdit }: { item: WatchlistItem; onEdit: () => void }) {
  return (
    <div className="group relative">
      <Link
        href={`/anime/${item.slug}`}
        className="block relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-surface"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, 240px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted px-2 text-center">
            {item.title}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <ProgressBadge item={item} />
        </div>
        {item.score !== null && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent text-black text-[11px] font-bold">
            {item.score}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 to-transparent">
          <p className="text-xs font-semibold line-clamp-2 leading-snug">{item.title}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">{STATUS_LABELS[item.status]}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${item.title}`}
        className="absolute bottom-2 right-2 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 w-8 h-8 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-text-primary hover:border-accent/60 transition-opacity"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
      </button>
    </div>
  )
}

function ListItem({
  item,
  editing,
  onEdit,
  onClose,
  onSave,
  onRemove,
}: {
  item: WatchlistItem
  editing: boolean
  onEdit: () => void
  onClose: () => void
  onSave: (patch: Partial<WatchlistItem>) => void
  onRemove: () => void
}) {
  const total = item.totalEpisodes || 0
  const pct = total ? Math.min(100, Math.round((item.progress / total) * 100)) : 0

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <Link
          href={`/anime/${item.slug}`}
          className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-surface"
        >
          {item.image ? (
            <Image src={item.image} alt={item.title} fill sizes="48px" className="object-cover" unoptimized />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/anime/${item.slug}`} className="font-semibold text-sm hover:text-accent transition-colors line-clamp-1">
            {item.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-secondary">
            <span>{STATUS_LABELS[item.status]}</span>
            <span>
              {item.progress}
              {total ? ` / ${total}` : ''} eps
            </span>
            {item.score !== null && <span className="text-accent font-semibold">{item.score}/10</span>}
          </div>
          {total > 0 && (
            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden max-w-xs">
              <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
            </div>
          )}
          {item.notes && <p className="mt-2 text-xs text-text-muted line-clamp-2">{item.notes}</p>}
        </div>
        <button
          type="button"
          onClick={editing ? onClose : onEdit}
          className="shrink-0 px-3.5 py-2 glass rounded-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          {editing ? 'Close' : 'Edit'}
        </button>
      </div>
      {editing && <ListEditor item={item} onClose={onClose} onSave={onSave} onRemove={onRemove} className="mt-4" />}
    </div>
  )
}

function ListEditor({
  item,
  onClose,
  onSave,
  onRemove,
  className = '',
}: {
  item: WatchlistItem
  onClose: () => void
  onSave: (patch: Partial<WatchlistItem>) => void
  onRemove: () => void
  className?: string
}) {
  const [status, setStatus] = useState<WatchStatus>(item.status)
  const [progress, setProgress] = useState(String(item.progress))
  const [total, setTotal] = useState(String(item.totalEpisodes))
  const [score, setScore] = useState(item.score === null ? '' : String(item.score))
  const [notes, setNotes] = useState(item.notes)

  const save = () => {
    const parsedScore = score.trim() === '' ? null : Number(score)
    onSave({
      status,
      progress: Number.isFinite(Number(progress)) ? Math.max(0, Math.trunc(Number(progress))) : 0,
      totalEpisodes: Number.isFinite(Number(total)) ? Math.max(0, Math.trunc(Number(total))) : 0,
      score:
        parsedScore === null || !Number.isFinite(parsedScore)
          ? null
          : Math.min(10, Math.max(0, parsedScore)),
      notes: notes.slice(0, 1000),
    })
  }

  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1.5">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as WatchStatus)}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1.5">Score (0-10)</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="—"
            className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1.5">Progress</span>
          <input
            type="number"
            min={0}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1.5">Total eps</span>
          <input
            type="number"
            min={0}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60"
          />
        </label>
      </div>
      <label className="block mb-4">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1.5">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary resize-y focus:outline-none focus:border-accent/60"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-black rounded-full text-sm font-semibold transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 glass rounded-full text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto px-4 py-2 rounded-full text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
