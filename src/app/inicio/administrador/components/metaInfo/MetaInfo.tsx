import React from 'react'

const styles = {
  heading: 'text-4xl border-b border-gray-200 mb-6',
  label: 'text-blue-700 text-xl font-semibold mt-4',
  value: 'text-gray-800',
  interactiveValue:
    'text-indigo-600 underline transition-colors hover:opacity-80',
}

export interface MetaField<T> {
  name: keyof T
  label: string
  type: 'text' | 'link'
  getValue?: (data: T) => React.ReactNode
  getHref?: (data: T) => string
}

interface MetaInfoProps<T> {
  title: string
  fields: MetaField<T>[]
  data: T
}

export default function MetaInfo<T>({ title, fields, data }: MetaInfoProps<T>) {
  return (
    <div>
      <h1 className={styles.heading}>{title}</h1>

      {fields.map((field) => {
        const value = field.getValue ? field.getValue(data) : data[field.name]

        if (!value && value !== 0) return null

        const renderValue = value as React.ReactNode

        return (
          <div key={String(field.name)} className="mb-4">
            <div className={styles.label}>{field.label}</div>
            {field.type === 'link' && field.getHref ? (
              <a href={field.getHref(data)} className={styles.interactiveValue}>
                {renderValue}
              </a>
            ) : (
              <div className={styles.value}>{renderValue}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
