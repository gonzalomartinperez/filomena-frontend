import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDownWideShort,
  faSortUp,
  faSortDown,
  faUserDoctor,
} from '@fortawesome/free-solid-svg-icons'

const styles = {
  container: 'overflow-hidden rounded-lg border border-gray-200 bg-white',
  header: 'flex items-center gap-2 bg-red-400 px-4 py-3 text-white',
  headerTitle: 'font-medium',
  emptyState: 'p-8 text-center text-gray-500',
  sortControls: 'border-b border-gray-200 bg-gray-50 px-4 py-3',
  sortControlsWrapper: 'flex items-center gap-2',
  sortLabel: 'text-sm text-gray-600',
  sortButtonBase:
    'inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-colors',
  sortButtonActive: 'text-white',
  sortButtonInactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
  sortButtonAscActive: 'bg-green-600',
  sortButtonDescActive: 'bg-red-500',
  content: 'p-4',
  grid: 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  card: 'overflow-hidden rounded-lg border-2 border-red-400 bg-white shadow-sm transition-shadow hover:shadow-md',
  cardHeader: 'bg-red-400 px-3 py-2 text-center text-white',
  cardHeaderIcon: 'mb-1 text-lg',
  cardHeaderTitle: 'text-sm font-medium',
  cardContent: 'p-3 text-center',
  cardPosition: 'mb-1 text-2xl font-bold text-gray-800',
  cardPseudonym: 'border-t pt-2 text-xs text-gray-500',
  summary: 'mt-4 border-t border-gray-200 pt-4',
  summaryText: 'text-center text-sm text-gray-600',
  summaryCount: 'font-semibold',
}

export interface StudentCompletion {
  pseudonimo: string
  posicion_finalizacion: number
}

interface CompletionOrderProps {
  data: StudentCompletion[]
}

type SortOrder = 'asc' | 'desc'

export default function CompletionOrder({ data }: CompletionOrderProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const sortedData = [...data].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.posicion_finalizacion - b.posicion_finalizacion
    } else {
      return b.posicion_finalizacion - a.posicion_finalizacion
    }
  })

  const handleSortToggle = (order: SortOrder) => {
    setSortOrder(order)
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <FontAwesomeIcon icon={faArrowDownWideShort} />
          <span className={styles.headerTitle}>Posiciones</span>
        </div>
        <div className={styles.emptyState}>
          No hay estudiantes que hayan finalizado el examen todavía.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <FontAwesomeIcon icon={faArrowDownWideShort} />
        <span className={styles.headerTitle}>Posiciones</span>
      </div>

      {/* Sort Controls */}
      <div className={styles.sortControls}>
        <div className={styles.sortControlsWrapper}>
          <span className={styles.sortLabel}>Ordenar por:</span>
          <button
            onClick={() => handleSortToggle('asc')}
            className={`${styles.sortButtonBase} ${
              sortOrder === 'asc'
                ? `${styles.sortButtonAscActive} ${styles.sortButtonActive}`
                : styles.sortButtonInactive
            }`}
          >
            <FontAwesomeIcon icon={faSortUp} />
            Ascendente
          </button>
          <button
            onClick={() => handleSortToggle('desc')}
            className={`${styles.sortButtonBase} ${
              sortOrder === 'desc'
                ? `${styles.sortButtonDescActive} ${styles.sortButtonActive}`
                : styles.sortButtonInactive
            }`}
          >
            <FontAwesomeIcon icon={faSortDown} />
            Descendente
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.grid}>
          {sortedData.map((student) => (
            <div
              key={`${student.pseudonimo}-${student.posicion_finalizacion}`}
              className={styles.card}
            >
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <FontAwesomeIcon
                  icon={faUserDoctor}
                  className={styles.cardHeaderIcon}
                />
                <div className={styles.cardHeaderTitle}>Alumno</div>
              </div>

              {/* Card Content */}
              <div className={styles.cardContent}>
                <div className={styles.cardPosition}>
                  {student.posicion_finalizacion}
                </div>
                <div className={styles.cardPseudonym}>
                  Pseudonimo: {student.pseudonimo}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <p className={styles.summaryText}>
            Total de estudiantes que finalizaron:{' '}
            <span className={styles.summaryCount}>{data.length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
