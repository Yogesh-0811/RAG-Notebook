import './globals.css'

export const metadata = {
  title: 'RAG System',
  description: 'Document Indexing & Intelligent Chat Assistant',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}