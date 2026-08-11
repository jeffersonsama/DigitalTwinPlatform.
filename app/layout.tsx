import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { LocaleProvider, localeInitScript } from '@/lib/i18n'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ICESCO Digital Twin Platform — Youth Knowledge Forum 2026',
  description:
    'ICESCO Crisis Management Knowledge Forum 2026 — Building Resilient Communities Through Knowledge and Innovation. A multilingual, AI-powered digital twin platform.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0b1e3f',
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} bg-background`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
