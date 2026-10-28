import PageHeader from '@/components/ui/PageHeader'
import MyListClient from '@/components/watchlist/MyListClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My List',
  description: 'Track what you are watching, completed, or planning to watch.',
}

export default function MyListPage() {
  return (
    <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
      <PageHeader
        title="My List"
        subtitle="Your watchlist lives in this browser only. Nothing is uploaded, and clearing site data will erase it — export a backup if you care about it."
      />
      <MyListClient />
    </div>
  )
}
