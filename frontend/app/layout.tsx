import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Storytopia - AI Story Creator',
  description: 'Turn your drawings into magical animated stories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
