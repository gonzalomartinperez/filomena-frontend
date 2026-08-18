/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

const styles = {
  heading: 'text-4xl border-b border-gray-200 mb-6',
  table: 'mb-6 min-w-full mt-4',
  thead: 'bg-gray-100 text-left text-sm font-semibold text-gray-700',
  th: 'px-4 py-2 border-b border-gray-300',
  td: 'px-4 py-2 align-top border-b border-gray-300 text-sm text-gray-800',
  tdClamped:
    'px-4 py-2 align-top border-b border-gray-300 text-sm text-gray-800 max-w-xs',
  clampedText: 'line-clamp-3 break-words',
  link: 'text-blue-600 hover:underline',
}

export interface PreguntasDeCasoColumn<T, TAdditional = unknown> {
  key: string
  header: string
  getValue?: (item: T, additionalData?: TAdditional) => React.ReactNode
  render?: (item: T, additionalData?: TAdditional) => React.ReactNode
  type?: 'text' | 'link' | 'custom'
  getHref?: (item: T, additionalData?: TAdditional) => string
  className?: string
  isClamped?: boolean
}

interface PreguntasDeCasoProps<T, TAdditional = unknown> {
  title: string
  columns: PreguntasDeCasoColumn<T, TAdditional>[]
  data: T[]
  additionalData?: TAdditional
}

export default function PreguntasDeCaso<T, TAdditional = unknown>({
  title,
  columns,
  data,
  additionalData,
}: PreguntasDeCasoProps<T, TAdditional>) {
  const renderCellContent = (
    column: PreguntasDeCasoColumn<T, TAdditional>,
    item: T,
  ) => {
    let content: React.ReactNode

    if (column.render) {
      content = column.render(item, additionalData)
    } else if (column.getValue) {
      content = column.getValue(item, additionalData)
    } else {
      content = (item as any)[column.key]
    }

    if (column.type === 'link' && column.getHref) {
      return (
        <a href={column.getHref(item, additionalData)} className={styles.link}>
          {content}
        </a>
      )
    }

    return content
  }

  return (
    <div>
      <h1 className={styles.heading}>{title}</h1>

      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={styles.th}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={
                    column.className ||
                    (column.isClamped ? styles.tdClamped : styles.td)
                  }
                >
                  {column.isClamped ? (
                    <div className={styles.clampedText}>
                      {renderCellContent(column, item)}
                    </div>
                  ) : (
                    renderCellContent(column, item)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
