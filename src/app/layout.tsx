import type { Metadata, Viewport } from 'next'
import { Sora, Manrope } from 'next/font/google'
import './globals.css'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import AuroraBackground from '@/components/scene/AuroraBackground'

// Sora for display headings (geometric, cinematic), Manrope for body copy.
const sora = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#07070c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`dark ${sora.variable} ${manrope.variable}`}>
      <body className="font-sans min-h-screen bg-background">
        {/* One shared canvas for the whole app, fixed behind everything. */}
        <AuroraBackground />
        <Navbar />
        <main className="relative z-10 min-h-screen pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  )
}
