'use client'
import React from 'react'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const styles = {
  default:
    'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 ' +
    'font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 ' +
    'focus:outline-none',
  alternative:
    'py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none ' +
    'bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 ' +
    'focus:z-10 focus:ring-4 focus:ring-gray-100',
  dark:
    'text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 ' +
    'focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2',
  light:
    'text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 ' +
    'focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2',
  green:
    'text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 ' +
    'font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none',
  red:
    'text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 ' +
    'font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none',
  yellow:
    'text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 ' +
    'font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none',
  orange:
    'text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:ring-orange-300 ' +
    'font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none',
  purple:
    'text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 ' +
    'font-medium rounded-lg text-sm px-5 py-2.5 mb-2 focus:outline-none',
}

type ButtonVariant =
  | 'default'
  | 'alternative'
  | 'dark'
  | 'light'
  | 'green'
  | 'red'
  | 'yellow'
  | 'orange'
  | 'purple'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: IconDefinition
}

export function Button({
  variant = 'default',
  icon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const variantClass = styles[variant] || styles.default
  const disabledClass = rest.disabled
    ? 'cursor-not-allowed opacity-50'
    : 'cursor-pointer'
  return (
    <button
      {...rest}
      className={`${disabledClass} ${variantClass} ${className}`}
    >
      {icon && <FontAwesomeIcon icon={icon} className="mr-3 w-4" />}
      {children}
    </button>
  )
}
