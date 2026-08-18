import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Filomena',
  description: 'Aplicación de Examenes de Medicina',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
