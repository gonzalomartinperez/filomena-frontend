import { CSSProperties } from 'react'

const styles: { [key: string]: CSSProperties } = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  iconContainer: {
    position: 'relative',
    width: 150,
    height: 150,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    animation: 'fadeCycle 3s infinite',
    objectFit: 'contain',
  },
  image1: {
    animationDelay: '0s',
  },

  image2: {
    animationDelay: '1s',
  },

  image3: {
    animationDelay: '2s',
  },
  labelsContainer: {
    textAlign: 'center',
    marginTop: '2rem',
  },
  label: {
    color: 'white',
    fontSize: '1rem',
    marginBottom: '0.5rem',
  },
}

export default styles
