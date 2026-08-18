import React, { Fragment } from 'react'

const styles = {
  link: 'text-blue-600 hover:underline',
  container: 'pt-6',
  heading: 'text-4xl border-b border-gray-200 mb-6',
  table: 'mb-6 min-w-full mt-4',
  thead: 'bg-gray-100 text-left text-sm font-semibold text-gray-700',
  th: 'px-4 py-2 border-b border-gray-300',
  td: 'px-4 py-2 align-top border-b border-gray-300 text-sm text-gray-800',
  sectionRow: 'bg-gray-50 text-blue-800 font-semibold',
}

export interface Columna<T, TAdditional = unknown> {
  key: string
  header: string
  getValue?: (item: T, additionalData?: TAdditional) => React.ReactNode
  render?: (item: T, additionalData?: TAdditional) => React.ReactNode
  type?: 'text' | 'link' | 'custom'
  getHref?: (item: T, additionalData?: TAdditional) => string
  className?: string
  colSpan?: number
}

export interface Seccion<TSection, TItem> {
  sectionData: TSection
  items: TItem[]
  getSectionName: (section: TSection) => React.ReactNode
  getSectionExtra?: (section: TSection) => React.ReactNode
}

interface TablaCotejoStructureProps<TSection, TItem, TAdditional = unknown> {
  title: string
  columns: Columna<TItem, TAdditional>[]
  sections: Seccion<TSection, TItem>[]
  additionalData?: TAdditional
}

export default function TablaCotejoStructure<TSection, TItem, TAdditional>({
  title,
  columns,
  sections,
  additionalData,
}: TablaCotejoStructureProps<TSection, TItem, TAdditional>) {
  const renderCellContent = (
    column: Columna<TItem, TAdditional>,
    item: TItem,
  ) => {
    let content: React.ReactNode

    if (column.render) {
      content = column.render(item, additionalData)
    } else if (column.getValue) {
      content = column.getValue(item, additionalData)
    } else {
      content = [column.key]
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
    <div className={styles.container}>
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
          {sections.map((section, sectionIndex) => (
            <Fragment key={sectionIndex}>
              {/* Section Header Row */}
              <tr className={styles.sectionRow}>
                <td className={styles.td} colSpan={columns.length}>
                  {section.getSectionName(section.sectionData)}
                  {section.getSectionExtra && (
                    <span>{section.getSectionExtra(section.sectionData)}</span>
                  )}
                </td>
              </tr>

              {/* Section Items */}
              {section.items.map((item, itemIndex) => (
                <tr key={itemIndex}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.className || styles.td}
                      colSpan={column.colSpan}
                    >
                      {renderCellContent(column, item)}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
