import React from 'react'
import { Examen } from '../../examenes/types/Examen'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronRight,
  faFileAlt,
  faHeartPulse,
} from '@fortawesome/free-solid-svg-icons'

interface MonitorCardsProps {
  selectedExamen: Examen
  handleMonitorClick: () => void
}

export default function MonitorCards({
  selectedExamen,
  handleMonitorClick,
}: MonitorCardsProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center bg-gray-400 px-4 py-3 text-white">
        <span className="font-medium">Tiempo real</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Monitor Estudiantes */}
        <div
          className={`${
            selectedExamen.publicado && !selectedExamen.finalizado
              ? 'mr-2 ml-4 cursor-pointer overflow-hidden rounded-lg bg-pink-400 transition-colors hover:bg-pink-500'
              : 'mr-2 ml-4 cursor-not-allowed overflow-hidden rounded-lg bg-gray-500 transition-colors'
          }`}
          onClick={handleMonitorClick}
          role="button"
          tabIndex={
            selectedExamen.publicado && !selectedExamen.finalizado ? 0 : -1
          }
          onKeyDown={(e) => {
            if (selectedExamen.publicado && !selectedExamen.finalizado) {
              e.preventDefault()
              handleMonitorClick()
            }
          }}
        >
          <div className="p-6 text-white">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon
                icon={faHeartPulse}
                className="h-8 w-8"
                size="3x"
              />
              <div>
                <h3 className="text-xl font-semibold">Monitor</h3>
                <p className="text-sm opacity-90">de estudiantes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border border-gray-200 bg-white p-4">
            <span
              className={`${
                selectedExamen.publicado && !selectedExamen.finalizado
                  ? 'text-sm text-pink-400'
                  : 'text-sm text-gray-600'
              }`}
            >
              Ver
            </span>
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`${
                selectedExamen.publicado && !selectedExamen.finalizado
                  ? 'text-pink-400'
                  : 'text-gray-600'
              }`}
            />
          </div>
        </div>

        {/* Monitor Evaluadores */}
        <div
          className={`${
            selectedExamen.finalizado
              ? 'mr-4 ml-2 cursor-pointer overflow-hidden rounded-lg bg-yellow-400 transition-colors hover:bg-yellow-500'
              : 'mr-4 ml-2 cursor-not-allowed overflow-hidden rounded-lg bg-gray-500 transition-colors'
          }`}
          onClick={handleMonitorClick}
          role="button"
          tabIndex={selectedExamen.finalizado ? 0 : -1}
          onKeyDown={(e) => {
            if (selectedExamen.finalizado) {
              e.preventDefault()
              handleMonitorClick()
            }
          }}
        >
          <div className="p-6 text-white">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faFileAlt} className="h-8 w-8" size="3x" />
              <div>
                <h3 className="text-xl font-semibold">Proceso</h3>
                <p className="text-sm opacity-90">de corrección</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border border-gray-200 bg-white p-4">
            <span
              className={`${
                selectedExamen.finalizado
                  ? 'text-sm text-yellow-400'
                  : 'text-sm text-gray-600'
              }`}
            >
              Ver
            </span>
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`${
                selectedExamen.finalizado ? 'text-yellow-400' : 'text-gray-600'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
