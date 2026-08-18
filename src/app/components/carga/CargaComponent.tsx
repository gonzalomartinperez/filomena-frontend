import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './cargaStyles'

interface LoadingInstance {
  id: string
  label: string
}

interface CargaProps {
  loadingInstances: LoadingInstance[]
}

function LoadingContent({ loadingInstances }: CargaProps) {
  const [showLabels, setShowLabels] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowLabels(true), 500)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <>
      <style>
        {`
          @keyframes fadeCycle {
            0%   { opacity: 0; }
            10%  { opacity: 1; }
            30%  { opacity: 1; }
            40%  { opacity: 0; }
            100% { opacity: 0; }
          }
        `}
      </style>

      <div style={styles.container}>
        <div style={styles.iconContainer}>
          <Image
            src="/EstetoscopioCeleste.png"
            alt="Celeste"
            width={100}
            height={100}
            priority
            style={{ ...styles.image, ...styles.image1 }}
          />
          <Image
            src="/EstetoscopioRosa.png"
            alt="Rosa"
            width={100}
            height={100}
            style={{ ...styles.image, ...styles.image2 }}
          />
          <Image
            src="/EstetoscopioAmarillo.png"
            alt="Amarillo"
            width={100}
            height={100}
            style={{ ...styles.image, ...styles.image3 }}
          />
        </div>
        {showLabels && (
          <div style={styles.labelsContainer}>
            {loadingInstances.map((instance) => (
              <p key={instance.id} style={styles.label}>
                {instance.label}
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function Carga({ loadingInstances }: CargaProps) {
  if (!loadingInstances.length) return null

  return <LoadingContent loadingInstances={loadingInstances} />
}
