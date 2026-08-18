'use client'

import { HiCheck, HiX } from 'react-icons/hi'

type Props = {
  value: boolean | null
  onChange: (v: boolean) => void
  disabled?: boolean
  labelYes?: string
  labelNo?: string
}

export default function YesNoCheck({
  value,
  onChange,
  disabled = false,
  labelYes = 'Sí',
  labelNo = 'No',
}: Props) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border text-sm shadow-sm select-none">
      <button
        type="button"
        className={`flex cursor-pointer items-center gap-1 px-3 py-1.5 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
          value === true
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-700 hover:bg-green-50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={() => !disabled && onChange(true)}
        aria-pressed={value === true}
        disabled={disabled}
      >
        <HiCheck aria-hidden size={16} /> {labelYes}
      </button>

      <div className="h-5 w-px bg-gray-200" aria-hidden />

      <button
        type="button"
        className={`flex cursor-pointer items-center gap-1 px-3 py-1.5 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
          value === false
            ? 'bg-red-600 text-white'
            : 'bg-white text-gray-700 hover:bg-red-50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={() => !disabled && onChange(false)}
        aria-pressed={value === false}
        disabled={disabled}
      >
        <HiX aria-hidden size={16} /> {labelNo}
      </button>
    </div>
  )
}
