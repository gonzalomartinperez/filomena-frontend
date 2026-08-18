'use client'

import React from 'react'
import Image from 'next/image'
import Tooltip from 'app/components/tooltip/Tooltip'
import { HiInformationCircle } from 'react-icons/hi'
import {
  MonitorEstudiante,
  MonitorEvaluador,
} from '../../administrar-examenes/types/Monitor'
import { ESTUDIANTE, EVALUADOR } from '../../usuarios/constants/roles'
import { Examen } from '../../examenes/types/Examen'

interface ExamProgressTableProps {
  data: MonitorEstudiante[] | MonitorEvaluador[]
  onAlert: (student: MonitorEstudiante) => void
  monitor: typeof ESTUDIANTE | typeof EVALUADOR
  examen?: Examen
}

const styles = {
  container: 'flex flex-col w-full h-full',
  tableContainer:
    'w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm',
  tableScroll: 'overflow-y-auto',
  table: 'min-w-full table-auto divide-y divide-gray-200',
  thead: 'sticky top-0 z-10 bg-gray-50',
  th: 'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
  tableBody: 'bg-white divide-y divide-gray-200',
  tableRow: 'hover:bg-gray-50 transition-colors duration-150',
  td: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900',
  tdStatus: 'px-6 py-4 text-sm text-gray-900',
  tdActions: 'px-6 py-4 whitespace-nowrap text-center text-sm font-medium',
  alertBtn:
    'inline-flex cursor-pointer items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200',
  alertBtnDisabled:
    'inline-flex cursor-not-allowed items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 transition-colors',
  finalizadoText:
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
  procesoContainer: 'space-y-2',
  problemTitle: 'text-sm font-medium text-gray-900',
  questionInfo: 'text-xs text-gray-500',
  statusLabel: 'text-xs font-medium text-gray-600 uppercase tracking-wide',
  progressBarContainer: 'flex items-center space-x-3',
  progressBarWrapper: 'flex-1 bg-gray-200 rounded-full h-2.5',
  progressBar:
    'bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full transition-all duration-500 ease-out',
  progressText: 'text-sm font-medium text-gray-700 min-w-[3rem]',
  checkIcon: 'text-green-600 text-xl font-bold',
  crossIcon: 'text-red-600 text-xl font-bold',
  centeredText: 'text-center',
  alertIconsContainer:
    'flex flex-wrap justify-center gap-1 max-w-[120px] mx-auto',
  alertIcon: 'w-6 h-6 object-contain',
  alertIconRow: 'flex justify-center gap-1',
}

const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => {
  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.progressBarWrapper}>
        <div
          className={styles.progressBar}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={styles.progressText}>{percentage}%</span>
    </div>
  )
}

const AlertIcons: React.FC<{ alertasDisponibles: number }> = ({
  alertasDisponibles,
}) => {
  if (alertasDisponibles === 0) {
    return <span className="text-xs text-gray-400">5+ alertas hechas</span>
  }

  const totalAlerts = 5
  const emptyAlerts = totalAlerts - alertasDisponibles

  const filledIcons = Array.from({ length: alertasDisponibles }, (_, index) => (
    <Image
      key={index}
      src="/Heart.png"
      alt="Alerta disponible"
      width={24}
      height={24}
      className={styles.alertIcon}
    />
  ))

  const emptyIcons = Array.from({ length: emptyAlerts }, (_, index) => (
    <Image
      key={`empty-${index}`}
      src="/EmptyHeart.png"
      alt="Alerta utilizada"
      width={24}
      height={24}
      className={styles.alertIcon}
    />
  ))

  const allIcons = [...filledIcons, ...emptyIcons]

  // Agrupar íconos en filas de máximo 5 elementos
  const rows = []
  for (let i = 0; i < allIcons.length; i += 5) {
    rows.push(
      <div key={i} className={styles.alertIconRow}>
        {allIcons.slice(i, i + 5)}
      </div>,
    )
  }

  return <div className={styles.alertIconsContainer}>{rows}</div>
}

export default function MonitorTable({
  data,
  onAlert,
  monitor,
  examen,
}: ExamProgressTableProps) {
  const renderExamStatus = (student: MonitorEstudiante) => {
    if (student.finalizado) {
      return <span className={styles.finalizadoText}>Finalizado</span>
    } else {
      return (
        <div className={styles.procesoContainer}>
          <div className={styles.problemTitle}>
            {/* Texto del problema/pregunta en curso */}
            Problema {student.caso_orden} de {student.caso_orden}:{' '}
            {student.caso_titulo}
          </div>
          <div className={styles.questionInfo}>
            Pregunta {student.ultima_pregunta_respondida} de{' '}
            {student.ultima_pregunta_caso}
          </div>
          <div className={styles.statusLabel}>Proceso</div>
          <ProgressBar percentage={student.porcentaje} />
        </div>
      )
    }
  }

  const handleAlert = (student: MonitorEstudiante) => {
    onAlert(student)
  }

  if (monitor === ESTUDIANTE) {
    const studentData = data as MonitorEstudiante[]

    return (
      <div className={styles.container}>
        <div className={styles.tableContainer}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Estudiante</th>
                  <th className={styles.th}>Estado del examen</th>
                  <th className={styles.th}>Alertar</th>
                  <th className={styles.th}>
                    <div className="inline-flex items-center justify-center gap-1">
                      Alertas disponibles
                      <Tooltip
                        variant="info"
                        content="Las alertas disponibles es solo un elemento informativo. La cantidad de corazones negros indica la cantidad de alertas realizadas a ese estudiante. La cantidad total es el recomendado a hacer por examen y es posible hacer más de 5 si se desea."
                      >
                        <span
                          aria-label="Información sobre alertas disponibles"
                          className="inline-flex cursor-help text-gray-500"
                        >
                          <HiInformationCircle size={14} />
                        </span>
                      </Tooltip>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {studentData.map((student) => (
                  <tr key={student.estudiante_id} className={styles.tableRow}>
                    {/* Columna Estudiante */}
                    <td className={styles.td}>
                      <div className="font-medium">
                        {student.estudiante_pseudonimo}
                      </div>
                    </td>

                    {/* Columna Estado del examen */}
                    <td className={styles.tdStatus}>
                      {renderExamStatus(student)}
                    </td>

                    {/* Columna Alertar */}
                    <td className={styles.tdActions}>
                      <button
                        onClick={() => handleAlert(student)}
                        className={
                          examen?.finalizado ||
                          student.finalizado ||
                          student.alertado
                            ? styles.alertBtnDisabled
                            : styles.alertBtn
                        }
                        aria-disabled={
                          examen?.finalizado ||
                          student.finalizado ||
                          student.alertado
                        }
                        title={
                          examen?.finalizado ||
                          student.finalizado ||
                          student.alertado
                            ? 'No disponible para alertar'
                            : 'Enviar alerta a este estudiante'
                        }
                      >
                        Alertar
                      </button>
                    </td>

                    {/* Columna Alertas disponibles */}
                    <td className={styles.td}>
                      <AlertIcons
                        alertasDisponibles={student.alertas_disponibles}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (monitor === EVALUADOR) {
    const evaluatorData = data as MonitorEvaluador[]

    return (
      <div className={styles.container}>
        <div className={styles.tableContainer}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Evaluador</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Casos asignados</th>
                  <th className={styles.th}>Porcentaje</th>
                  <th className={styles.th}>Finalizó corrección</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {evaluatorData.map((evaluator) => (
                  <tr key={evaluator.evaluador_id} className={styles.tableRow}>
                    {/* Columna Evaluador */}
                    <td className={styles.td}>
                      <div className="font-medium">
                        {evaluator.evaluador_nombre}
                      </div>
                    </td>

                    {/* Columna Email */}
                    <td className={styles.td}>{evaluator.evaluador_email}</td>

                    {/* Columna Casos asignados */}
                    <td className={styles.td}>
                      <div className="space-y-1">
                        {evaluator.casos_asignados?.map((caso) => (
                          <div key={caso?.id} className="text-xs">
                            {caso?.titulo} ({caso?.orden_relativo})
                          </div>
                        )) || (
                          <span className="text-xs text-gray-400">
                            Sin casos asignados
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Columna Porcentaje */}
                    <td className={styles.td}>
                      <ProgressBar percentage={evaluator.porcentaje} />
                    </td>

                    {/* Columna Finalizó corrección */}
                    <td className={`${styles.td} ${styles.centeredText}`}>
                      {evaluator.finalizado ? (
                        <span className={styles.checkIcon}>✓</span>
                      ) : (
                        <span className={styles.crossIcon}>✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return null
}
