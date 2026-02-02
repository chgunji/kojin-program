import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '個サル予約 - 個人フットサル・個人ソサイチ検索・予約',
    template: '%s | 個サル予約',
  },
  description: '個人フットサル・個人ソサイチの検索・予約サービス。全国の施設で開催されるプログラムに気軽に参加できます。',
  keywords: ['個人フットサル', '個サル', '個人ソサイチ', 'フットサル', '予約'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: '個サル予約',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
