import { faUserDoctor, faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import GaugeComponent from 'react-gauge-component'
import { ESTUDIANTE, EVALUADOR } from '../../usuarios/constants/roles'

const getStyles = (rol: Role) => ({
  container: 'overflow-hidden rounded-lg border border-gray-200 bg-white',
  containerHeader: `flex items-center ${rol === EVALUADOR ? 'bg-yellow-500' : 'bg-green-500'} px-4 py-3 text-white`,
  containerIcon: 'mr-2',
  containerLabel: 'font-medium',
  containerContent: 'p-8',
  contentTitle: 'mb-6 text-center text-2xl font-bold text-gray-800',
  contentBody: 'mb-4 flex justify-center',
  contentGaugeSize: 'w-96',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  graphicsContainer: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
})

type Role = typeof EVALUADOR | typeof ESTUDIANTE

interface ProgressChartProps {
  rol: Role
  progress: number
}

export default function ProgressChart({ rol, progress }: ProgressChartProps) {
  const styles = getStyles(rol)
  const icon = rol === EVALUADOR ? faUserDoctor : faUsers
  const label = rol === EVALUADOR ? 'Evaluadores' : 'Estudiantes'
  const percentageCounterColor = rol === EVALUADOR ? '#eab308' : '#40c647'
  const progreso = progress ? progress : 0

  return (
    <div className={styles.container}>
      <div className={styles.containerHeader}>
        <span className={styles.containerIcon}>
          <FontAwesomeIcon icon={icon} />
        </span>
        <span className={styles.containerLabel}>{label}</span>
      </div>
      <div className={styles.containerContent}>
        <h3 className={styles.contentTitle}>Porcentaje de finalización</h3>
        <div className={styles.contentBody}>
          <div className={styles.contentGaugeSize}>
            <GaugeComponent
              arc={{
                cornerRadius: 0,
                padding: 0.02,
                width: 0.25,
                subArcs: [
                  { limit: 20, color: '#EA4228' },
                  { limit: 40, color: '#e88900' },
                  { limit: 60, color: '#F5CD19' },
                  { limit: 80, color: '#5BE12C' },
                  { color: '#0c8404' },
                ],
              }}
              labels={{
                valueLabel: {
                  style: { fill: percentageCounterColor, fontWeight: 'bold' },
                },
                tickLabels: {
                  type: 'outer',
                  hideMinMax: false,
                  ticks: [{ value: 0 }, { value: 50 }, { value: 100 }],
                },
              }}
              value={progreso}
              minValue={0}
              maxValue={100}
              pointer={{
                type: 'blob',
                animationDelay: 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
