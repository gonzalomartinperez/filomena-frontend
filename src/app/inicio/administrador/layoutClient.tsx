'use client'

import SideBar from './components/sideBar/SideBarComponent'

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={styles.container}>
      <SideBar />
      <main style={styles.contentContainer}>{children}</main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    height: '100%',
    overflow: 'auto',
    padding: '1.5rem',
  },
}
