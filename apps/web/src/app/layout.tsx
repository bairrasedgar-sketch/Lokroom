import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lok’Room',
  description: 'Micro-locations d’espaces sécurisées (FR + QC)'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="mx-auto max-w-5xl p-6">
          <header className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold">Lok’Room</h1>
            <nav className="text-sm text-gray-600">Semaine 1</nav>
          </header>
          <main>{children}</main>
          <footer className="mt-12 border-t pt-6 text-xs text-gray-500">© {new Date().getFullYear()} Lok’Room</footer>
        </div>
      </body>
    </html>
  )
}
