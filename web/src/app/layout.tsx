import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Just Audio',
  description: 'Your lightest audio experience',
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
