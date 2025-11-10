import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Storytopia',
  description: 'Turn your child’s drawings into meaningful, interactive stories!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=pally@500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Pally', sans-serif" }}>{children}</body>
    </html>
  )
}
