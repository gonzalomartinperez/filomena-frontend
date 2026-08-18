'use client'
import React, { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faEye,
  faPencilAlt,
  faTimes,
  faTrash,
  faBackward,
} from '@fortawesome/free-solid-svg-icons'
import { Examen } from 'app/inicio/administrador/examenes/types/Examen'

const styles = {
  datagridContainer: 'flex flex-col w-full h-full',
  searchInput:
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:w-1/3 mb-4',
  tableContainer: 'w-full h-110 overflow-x-auto rounded-lg border',
  tableScroll: 'overflow-y-auto',
  table: 'min-w-full table-auto divide-y divide-gray-200',
  thead: 'sticky top-0 z-10 bg-gray-50',
  th: 'px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase',
  tableBody: 'divide-y divide-gray-200',
  tableRow: 'odd:bg-white even:bg-gray-50',
  td: 'px-4 py-2 text-sm text-gray-700',
  actionsCell: 'px-4 py-2 text-sm text-gray-700',
  actionsWrapper: 'flex items-center gap-3',
  actionBtn: 'p-1 transition-colors',
  viewBtn: 'hover:text-blue-600',
  editBtn: 'hover:text-green-600',
  deleteBtn: 'hover:text-red-600',
  rewindBtn: 'hover:text-yellow-600',
  noResults: 'px-4 py-6 text-center text-gray-500',
  booleanIcon: 'inline-flex items-center justify-center text-lg font-black',
  booleanTrue: 'text-green-600',
  booleanFalse: 'text-red-600',
}

type ColumnType = 'text' | 'date' | 'boolean' | 'custom'

export interface Column<T> {
  field: keyof T
  headerName: string
  type?: ColumnType
  renderCell?: (row: T) => React.ReactNode
  booleanRender?: {
    trueIcon?: React.ReactNode
    falseIcon?: React.ReactNode
  }
  asLink?: boolean
  href?: (row: T) => string
}

export interface DataGridProps<T extends object> {
  rows: T[]
  columns: Column<T>[]
  rowKey: keyof T | ((row: T) => string | number)
  exam?: Examen
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onRewind?: (row: T) => void
  showSearch?: boolean
}

export function DataGrid<T extends object>({
  rows,
  columns,
  rowKey,
  exam,
  onView,
  onEdit,
  onDelete,
  onRewind,
  showSearch = true,
}: DataGridProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>('')

  const rowIsExamen = (
    row: unknown,
  ): row is {
    publicado?: boolean
    finalizado?: boolean
    defendido?: boolean
  } =>
    typeof row === 'object' &&
    row !== null &&
    'publicado' in row &&
    'finalizado' in row &&
    'defendido' in row

  const formatDateForDisplay = (dateValue: unknown): string => {
    if (!dateValue) return ''

    const dateStr = String(dateValue)

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    }

    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    return String(dateValue)
  }

  const renderBooleanValue = (
    value: unknown,
    booleanRender?: Column<T>['booleanRender'],
  ): React.ReactNode => {
    const boolValue = Boolean(value)

    if (booleanRender) {
      if (boolValue) {
        return (
          booleanRender.trueIcon || (
            <span className={`${styles.booleanIcon} ${styles.booleanTrue}`}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
          )
        )
      } else {
        return (
          booleanRender.falseIcon || (
            <span className={`${styles.booleanIcon} ${styles.booleanFalse}`}>
              <FontAwesomeIcon icon={faTimes} />
            </span>
          )
        )
      }
    }

    return (
      <span
        className={`${styles.booleanIcon} ${boolValue ? styles.booleanTrue : styles.booleanFalse}`}
      >
        <FontAwesomeIcon icon={boolValue ? faCheck : faTimes} />
      </span>
    )
  }

  const renderCellContent = (row: T, col: Column<T>): React.ReactNode => {
    const value = row[col.field]

    if (col.renderCell) {
      return col.renderCell(row)
    }

    switch (col.type) {
      case 'date':
        return formatDateForDisplay(value)
      case 'boolean':
        return renderBooleanValue(value, col.booleanRender)
      case 'custom':
        return value as React.ReactNode
      case 'text':
      default:
        if (col.asLink && col.href) {
          const href = `/inicio/administrador/${col.href(row)}`
          const label = String(value ?? '')
          return (
            <a
              href={href}
              className="text-indigo-600 underline transition-colors hover:opacity-80"
            >
              {label}
            </a>
          )
        }
        return value as React.ReactNode
    }
  }

  const getSearchableText = (row: T, col: Column<T>): string => {
    const value = row[col.field]

    switch (col.type) {
      case 'date':
        return formatDateForDisplay(value)
      case 'boolean':
        return value ? 'true yes si sí verdadero' : 'false no falso'
      default:
        return String(value ?? '')
    }
  }

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return rows.filter((row) =>
      columns.some((col) => {
        const searchableText = getSearchableText(row, col)
        return searchableText.toLowerCase().includes(term)
      }),
    )
  }, [rows, searchTerm, columns])

  const hasActions = Boolean(onView || onEdit || onDelete || onRewind)

  return (
    <div className={styles.datagridContainer}>
      {showSearch && (
        <input
          type="text"
          placeholder="🔍 Buscar…"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}
      <div className={styles.tableContainer}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {columns.map((col) => (
                  <th key={String(col.field)} className={styles.th}>
                    {col.headerName}
                  </th>
                ))}
                {hasActions && <th className={styles.th}>Acciones</th>}
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredRows.map((row) => {
                const keyValue =
                  typeof rowKey === 'function'
                    ? rowKey(row)
                    : (row[rowKey] as unknown as string | number)
                return (
                  <tr key={String(keyValue)} className={styles.tableRow}>
                    {columns.map((col) => (
                      <td key={String(col.field)} className={styles.td}>
                        {renderCellContent(row, col)}
                      </td>
                    ))}
                    {hasActions && (
                      <td className={styles.actionsCell}>
                        <div className={styles.actionsWrapper}>
                          {onView && (
                            <button
                              onClick={() => onView(row)}
                              className={`cursor-pointer ${styles.actionBtn} ${styles.viewBtn}`}
                              aria-label="Ver"
                              title="Ver detalle"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              disabled={
                                (rowIsExamen(row)
                                  ? row.publicado
                                  : exam?.publicado) ?? false
                              }
                              onClick={() => onEdit(row)}
                              className={`${(rowIsExamen(row) ? row.publicado : exam?.publicado) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${styles.actionBtn} ${styles.editBtn}`}
                              aria-label="Editar"
                              title="Editar elemento"
                            >
                              <FontAwesomeIcon icon={faPencilAlt} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              disabled={
                                (rowIsExamen(row)
                                  ? row.publicado && !row.defendido
                                  : exam?.publicado && !exam?.defendido) ??
                                false
                              }
                              onClick={() => onDelete(row)}
                              className={`${(rowIsExamen(row) ? row.publicado && !row.defendido : exam?.publicado && !exam?.defendido) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${styles.actionBtn} ${styles.deleteBtn}`}
                              aria-label="Eliminar"
                              title="Eliminar elemento"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                          {onRewind && (
                            <button
                              disabled={
                                (rowIsExamen(row)
                                  ? row.publicado && !row.defendido
                                  : exam?.publicado && !exam?.defendido) ??
                                false
                              }
                              onClick={() => onRewind(row)}
                              className={`${(rowIsExamen(row) ? row.publicado && !row.defendido : exam?.publicado && !exam?.defendido) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${styles.actionBtn} ${styles.rewindBtn}`}
                              aria-label="Reestablecer"
                              title="Reestablecer elemento"
                            >
                              <FontAwesomeIcon icon={faBackward} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                    className={styles.noResults}
                  >
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
