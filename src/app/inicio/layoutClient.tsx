'use client'

import React from 'react'
import HeadBar from 'app/components/headbar/HeadBarComponent'

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={styles.appContainer}>
      {/* Header fijo arriba en el flujo */}
      <div style={styles.headerWrapper}>
        <HeadBar />
      </div>

      {/* Área de contenido donde viven todas las páginas / layouts hijos */}
      <div style={styles.contentWrapper}>{children}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
  },
  headerWrapper: {
    flexShrink: 0,
    zIndex: 1,
  },
  contentWrapper: {
    flex: 1,
    minHeight: 0, // importante para que el contenido interno pueda scrollear bien
    overflow: 'hidden', // el scroll lo manejarán los layouts internos (ej: administrador)
  },
}
