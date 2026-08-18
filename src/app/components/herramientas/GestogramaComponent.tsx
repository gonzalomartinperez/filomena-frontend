/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useEffect } from 'react'

const styles = {
  container:
    'flex flex-row items-start justify-center gap-8 p-4 max-h-[80vh] overflow-auto',
  leftColumn: 'flex flex-col items-center',
  title: 'mb-6 text-2xl font-bold text-gray-800',
  svgContainer: 'relative flex justify-center items-center',
  svg: 'w-full h-auto max-w-[500px]',
  outerRing: {
    fill: '#e5e7eb',
    stroke: '#9ca3af',
    strokeWidth: '2',
  },
  monthText: 'fill-gray-700 text-sm font-bold',
  dayMarkMain: {
    stroke: '#6b7280',
    strokeWidth: 1.5,
  },
  dayMarkMinor: {
    stroke: '#6b7280',
    strokeWidth: 0.8,
  },
  currentDateLine: {
    stroke: '#3b82f6',
    strokeWidth: '3',
  },
  todayLabel: 'fill-blue-600 text-xs font-bold',
  innerCircle: {
    fill: 'white',
    stroke: '#d1d5db',
    strokeWidth: '2',
  },
  weekNumberPregnancy: 'text-xs font-bold fill-blue-600',
  weekNumberRegular: 'text-xs font-bold fill-gray-400',
  furPointer: {
    stroke: '#dc2626',
    strokeWidth: '3',
  },
  furArrow: {
    fill: '#dc2626',
  },
  furLabel: 'fill-red-600 text-xs font-bold',
  centerCircle: {
    fill: 'white',
    stroke: '#d1d5db',
    strokeWidth: '1',
  },
  furDateLabel: 'fill-blue-600 text-xs font-semibold',
  furDayName: 'fill-blue-800 text-lg font-bold',
  furDayNumber: 'fill-blue-900 text-2xl font-black',
  furMonth: 'fill-blue-700 text-xs',
  dueDateLabel: 'fill-green-600 text-xs font-semibold',
  dueDate: 'fill-green-700 text-sm font-bold',
  draggableArea: 'cursor-grab active:cursor-grabbing',
  infoPanel: 'w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg',
  infoPanelTitle: 'mb-6 text-xl font-bold text-gray-800',
  gridLayout: 'mb-6 grid grid-cols-2 gap-4',
  leftInfoColumn: 'flex flex-col space-y-4',
  rightInfoColumn: 'flex flex-col space-y-4',
  infoCard: 'flex flex-1 flex-col rounded-lg p-4',
  furCard: 'border-l-4 border-pink-400 bg-pink-50',
  furCardTitle: 'mb-2 font-semibold text-pink-800',
  furCardText: 'flex flex-1 items-center text-sm font-medium text-pink-700',
  dueDateCard: 'border-l-4 border-blue-400 bg-blue-50',
  dueDateCardTitle: 'mb-2 font-semibold text-blue-800',
  dueDateCardText: 'flex flex-1 items-center text-sm font-medium text-blue-700',
  weeksCard: 'border-l-4 border-green-400 bg-green-50',
  weeksCardTitle: 'mb-2 font-semibold text-green-800',
  weeksCardText: 'flex flex-1 items-center text-sm font-medium text-green-700',
  measurementsCard: 'border-l-4 border-purple-400 bg-purple-50',
  measurementsCardTitle: 'mb-3 font-semibold text-purple-800',
  measurementsGrid: 'grid flex-1 grid-cols-2 content-center gap-2 text-xs',
  measurementRow: 'flex flex-col',
  measurementLabel: 'font-medium text-purple-700',
  measurementValue: 'text-purple-600 ml-1',
  daysCard: 'border-l-4 border-yellow-400 bg-yellow-50',
  daysCardTitle: 'mb-2 font-semibold text-yellow-800',
  daysCardText: 'flex flex-1 items-center text-sm font-medium text-yellow-700',
  currentDateCard: 'border-l-4 border-gray-400 bg-gray-50',
  currentDateCardTitle: 'mb-2 font-semibold text-gray-800',
  currentDateCardText:
    'flex flex-1 items-center text-sm font-medium text-gray-700',
  instructions: 'rounded-lg border border-blue-200 bg-blue-100 p-4',
  instructionsText: 'text-sm text-blue-800',
}

interface PregnancyMeasurement {
  altura_uterina: string
  ganancia_peso_materno: string
  peso_fetal: string
  contracciones: string
}

interface PregnancyData extends PregnancyMeasurement {
  weekOfPregnancy: number
  dayOfPregnancy: number
}

interface WheelCenter {
  x: number
  y: number
}

export default function Gestograma() {
  const [wheelAngle, setWheelAngle] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [angleDifference, setAngleDifference] = useState<number>(0)
  const [furDate, setFurDate] = useState<Date | null>(null)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [pregnancyData, setPregnancyData] = useState<PregnancyData>({
    weekOfPregnancy: 0,
    dayOfPregnancy: 0,
    altura_uterina: 'Sin estimaciones',
    ganancia_peso_materno: 'Sin estimaciones',
    peso_fetal: 'Sin estimaciones',
    contracciones: 'Sin estimaciones',
  })

  const wheelRef = useRef<SVGCircleElement>(null)

  // Date calculations
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const isLeapYear = new Date(currentYear, 1, 29).getDate() === 29
  const numberOfDays = isLeapYear ? 366 : 365
  const yearStart = new Date(currentYear, 0, 1)
  const currentDayOfYear = Math.round(
    (currentDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24) + 0.5,
  )
  const currentAngle = 360 * (currentDayOfYear / numberOfDays)

  const pregnancyMeasurements: Record<number, PregnancyMeasurement> = {
    13: {
      altura_uterina: '8 - 12 cm',
      ganancia_peso_materno: '0,4 - 3,5 kg',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    },
    14: {
      altura_uterina: '9 - 14 cm',
      ganancia_peso_materno: '1,2 - 4,8 kg',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    },
    15: {
      altura_uterina: '10 - 15 cm',
      ganancia_peso_materno: '1,3 - 4,9 kg',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    },
    16: {
      altura_uterina: '12 - 17 cm',
      ganancia_peso_materno: '1,8 - 5,1 kg',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    },
    17: {
      altura_uterina: '13 - 18 cm',
      ganancia_peso_materno: '2,4 - 6,4 kg',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    },
    18: {
      altura_uterina: '14 - 19 cm',
      ganancia_peso_materno: '2,6 - 7,0kg',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    },
    19: {
      altura_uterina: '14 - 20 cm',
      ganancia_peso_materno: '2,9 - 8,1 kg',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    },
    20: {
      altura_uterina: '15 - 21 cm',
      ganancia_peso_materno: '3,2 - 8,2 kg',
      peso_fetal: '0,2 - 0,6 kg',
      contracciones: 'Sin estimaciones',
    },
    21: {
      altura_uterina: '16 - 22 cm',
      ganancia_peso_materno: '4,1 - 8,6 kg',
      peso_fetal: '0,24 - 0,7 kg',
      contracciones: 'Sin estimaciones',
    },
    22: {
      altura_uterina: '17 - 23 cm',
      ganancia_peso_materno: '4,4 - 9,2 kg',
      peso_fetal: '0,3 - 0,74 kg',
      contracciones: 'Sin estimaciones',
    },
    23: {
      altura_uterina: '18 - 23 cm',
      ganancia_peso_materno: '4,7 - 10,5 kg',
      peso_fetal: '0,36 - 0,8 kg',
      contracciones: 'Sin estimaciones',
    },
    24: {
      altura_uterina: '19 - 24 cm',
      ganancia_peso_materno: '5,1 - 10,8 kg',
      peso_fetal: '0,4 - 0,98 kg',
      contracciones: 'Sin estimaciones',
    },
    25: {
      altura_uterina: '20 - 25 cm',
      ganancia_peso_materno: '5,6 - 11,3 kg',
      peso_fetal: '0,47 - 1,0 kg',
      contracciones: 'Sin estimaciones',
    },
    26: {
      altura_uterina: '20 - 26 cm',
      ganancia_peso_materno: '5,9 - 11, 6 kg',
      peso_fetal: '0,56 - 1,1 kg',
      contracciones: '1',
    },
    27: {
      altura_uterina: '21 - 27 cm',
      ganancia_peso_materno: '6,0 - 11,7 kg',
      peso_fetal: '0,6 - 1,3 kg',
      contracciones: '3',
    },
    28: {
      altura_uterina: '22 - 27 cm',
      ganancia_peso_materno: '6,2 - 11,9 kg',
      peso_fetal: '0,7 - 1,55 kg',
      contracciones: '5',
    },
    29: {
      altura_uterina: '23 - 28 cm',
      ganancia_peso_materno: '6,9 - 12,7 kg',
      peso_fetal: '0,8 - 1,8 kg',
      contracciones: '7',
    },
    30: {
      altura_uterina: '24 - 29 cm',
      ganancia_peso_materno: '7,3 - 13,5 kg',
      peso_fetal: '1,0 - 2,0 kg',
      contracciones: '8',
    },
    31: {
      altura_uterina: '24 - 30 cm',
      ganancia_peso_materno: '7,6 - 13,9 kg',
      peso_fetal: '1,1 - 2,2 kg',
      contracciones: '8',
    },
    32: {
      altura_uterina: '25 - 30 cm',
      ganancia_peso_materno: '7,9 - 14,5 kg',
      peso_fetal: '1,3 - 2,4 kg',
      contracciones: '8',
    },
    33: {
      altura_uterina: '26 - 31 cm',
      ganancia_peso_materno: '8,1 - 14,7 kg',
      peso_fetal: '1,5 - 2,6 kg',
      contracciones: '8',
    },
    34: {
      altura_uterina: '26 - 32cm',
      ganancia_peso_materno: '8,2 - 15,0 kg',
      peso_fetal: '1,8 - 2,9 kg',
      contracciones: '9',
    },
    35: {
      altura_uterina: '27 - 33 cm',
      ganancia_peso_materno: '8,2 - 15,4 kg',
      peso_fetal: '2,0 - 3,2 kg',
      contracciones: '9',
    },
    36: {
      altura_uterina: '28 - 33 cm',
      ganancia_peso_materno: '8,2 - 15,7 kg',
      peso_fetal: '2,3 - 3,5 kg',
      contracciones: '9',
    },
    37: {
      altura_uterina: '29 - 34 cm',
      ganancia_peso_materno: '8,2 - 15,7 kg',
      peso_fetal: '2,5 - 3,7 kg',
      contracciones: 'Sin estimaciones',
    },
    38: {
      altura_uterina: '30 - 34 cm',
      ganancia_peso_materno: '8,2 - 15,9kg',
      peso_fetal: '2,7 - 3,8 kg',
      contracciones: 'Sin estimaciones',
    },
    39: {
      altura_uterina: '31 - 35 cm',
      ganancia_peso_materno: '8,2 - 16,0 kg',
      peso_fetal: '2,8 - 3,9 kg',
      contracciones: 'Sin estimaciones',
    },
    40: {
      altura_uterina: '31 - 35 cm',
      ganancia_peso_materno: '8,2 - 16,0 kg',
      peso_fetal: '2,9 - 4,0 kg',
      contracciones: 'Sin estimaciones',
    },
  }

  const getWheelCenter = (): WheelCenter => {
    if (!wheelRef.current) return { x: 0, y: 0 }
    const rect = wheelRef.current.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  const calculateCursorAngle = (e: MouseEvent): number => {
    const center = getWheelCenter()
    const deltaX = center.x - e.clientX
    const deltaY = center.y - e.clientY
    const hypotenuse = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (hypotenuse === 0) return 0

    const radians = Math.asin(deltaX / hypotenuse)
    const angleBuffer = (radians * 180) / Math.PI

    let cursorAngle: number
    if (e.clientX >= center.x && e.clientY < center.y) {
      cursorAngle = -angleBuffer
    } else if (e.clientX > center.x && e.clientY >= center.y) {
      cursorAngle = 180 + angleBuffer
    } else if (e.clientX <= center.x && e.clientY > center.y) {
      cursorAngle = 180 + angleBuffer
    } else if (e.clientX < center.x && e.clientY <= center.y) {
      cursorAngle = 360 - angleBuffer
    } else {
      cursorAngle = 0
    }

    return cursorAngle
  }

  const angleToDayOfYear = (angle: number): number => {
    return Math.round(angle / (360 / numberOfDays))
  }

  const dateFromDay = (baseYear: number, day: number): Date => {
    const date = new Date(baseYear, 0)
    return new Date(date.setDate(day))
  }

  const furToDueDate = (furDayOfYear: number, furYear: number): Date => {
    const daysInFurYear = new Date(furYear, 1, 29).getDate() === 29 ? 366 : 365

    const dueDay =
      furDayOfYear + 280 <= daysInFurYear
        ? furDayOfYear + 280
        : furDayOfYear + 280 - daysInFurYear

    const dueYear = furDayOfYear + 280 > daysInFurYear ? furYear + 1 : furYear

    return dateFromDay(dueYear, dueDay)
  }

  const formatSpanishDate = (date: Date): string => {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]

    return `${date.getDate()} de ${months[date.getMonth()]}`
  }

  const updateData = (angle: number): void => {
    const furDayOfYear = angleToDayOfYear(angle)
    let dayOfPregnancy

    if (currentDayOfYear >= furDayOfYear) {
      dayOfPregnancy = currentDayOfYear - furDayOfYear
    } else {
      dayOfPregnancy = currentDayOfYear + (numberOfDays - furDayOfYear)
    }

    const weekOfPregnancy = Math.ceil(dayOfPregnancy / 7)

    const furYear =
      currentDayOfYear < furDayOfYear ? currentYear - 1 : currentYear

    const newFurDate = dateFromDay(furYear, furDayOfYear)
    const newDueDate = furToDueDate(furDayOfYear, furYear)

    // Get measurements for current week
    const measurements = pregnancyMeasurements[weekOfPregnancy] || {
      altura_uterina: 'Sin estimaciones',
      ganancia_peso_materno: 'Sin estimaciones',
      peso_fetal: 'Sin estimaciones',
      contracciones: 'Sin estimaciones',
    }

    setFurDate(newFurDate)
    setDueDate(newDueDate)
    setPregnancyData({
      weekOfPregnancy,
      dayOfPregnancy,
      ...measurements,
    })
  }

  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement>): void => {
    e.preventDefault()
    setIsDragging(true)
    const mouseEvent = e.nativeEvent
    const angle = calculateCursorAngle(mouseEvent)
    setAngleDifference(angle - wheelAngle)
  }

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging) return

    const angle = calculateCursorAngle(e)
    let newWheelAngle = angle - angleDifference

    if (newWheelAngle > 360) newWheelAngle -= 360
    else if (newWheelAngle < 0) newWheelAngle = 360 + newWheelAngle

    setWheelAngle(newWheelAngle)
    updateData(newWheelAngle)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, angleDifference, wheelAngle])

  useEffect(() => {
    // Initialize wheel so F.U.M. pointer points to week 1 (start position)
    setWheelAngle(0)
    updateData(0)
  }, [])

  return (
    <div className={styles.container}>
      {/* Gestograma Wheel - Left Side */}
      <div className={styles.leftColumn}>
        <h1 className={styles.title}>Gestograma - Calculadora de Embarazo</h1>

        <div className={styles.svgContainer}>
          <svg width="500" height="500" className={styles.svg}>
            {/* Outer gray ring */}
            <circle
              cx="250"
              cy="250"
              r="240"
              fill={styles.outerRing.fill}
              stroke={styles.outerRing.stroke}
              strokeWidth={styles.outerRing.strokeWidth}
            />

            {/* Month labels */}
            {[
              'Enero',
              'Febrero',
              'Marzo',
              'Abril',
              'Mayo',
              'Junio',
              'Julio',
              'Agosto',
              'Septiembre',
              'Octubre',
              'Noviembre',
              'Diciembre',
            ].map((month, index) => {
              const angle = index * 30 - 90
              const radian = (angle * Math.PI) / 180
              const x = 250 + 200 * Math.cos(radian)
              const y = 250 + 200 * Math.sin(radian)
              return (
                <text
                  key={month}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={styles.monthText}
                  transform={`rotate(${angle + 90}, ${x}, ${y})`}
                >
                  {month}
                </text>
              )
            })}

            {/* Day markings */}
            {Array.from({ length: numberOfDays }, (_, i) => {
              const angle = (i * 360) / numberOfDays - 90
              const radian = (angle * Math.PI) / 180
              const isMainMark = i % 5 === 0
              const length = isMainMark ? 12 : 6
              const x1 = 250 + 180 * Math.cos(radian)
              const y1 = 250 + 180 * Math.sin(radian)
              const x2 = 250 + (180 - length) * Math.cos(radian)
              const y2 = 250 + (180 - length) * Math.sin(radian)
              const strokeStyle = isMainMark
                ? styles.dayMarkMain
                : styles.dayMarkMinor

              return (
                <line
                  key={`day-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeStyle.stroke}
                  strokeWidth={strokeStyle.strokeWidth}
                />
              )
            })}

            {/* Current date indicator */}
            <line
              x1="250"
              y1="50"
              x2="250"
              y2="100"
              stroke={styles.currentDateLine.stroke}
              strokeWidth={styles.currentDateLine.strokeWidth}
              transform={`rotate(${currentAngle}, 250, 250)`}
            />

            {/* Today label */}
            <text
              x="250"
              y="35"
              textAnchor="middle"
              className={styles.todayLabel}
              transform={`rotate(${currentAngle}, 250, 250)`}
            >
              HOY
            </text>

            {/* Inner white circle */}
            <circle
              cx="250"
              cy="250"
              r="160"
              fill={styles.innerCircle.fill}
              stroke={styles.innerCircle.stroke}
              strokeWidth={styles.innerCircle.strokeWidth}
            />

            {/* Rotatable inner wheel - week numbers distributed across the full year */}
            <g transform={`rotate(${wheelAngle}, 250, 250)`}>
              {/* Week numbers - now using 52 weeks for the full calendar year */}
              {Array.from({ length: 52 }, (_, i) => {
                const week = i + 1
                // Distribute 52 weeks evenly across 360 degrees
                const angle = (week - 1) * (360 / 52) - 90
                const radian = (angle * Math.PI) / 180
                const x = 250 + 120 * Math.cos(radian)
                const y = 250 + 120 * Math.sin(radian)

                // Only show week numbers that are relevant to pregnancy (1-42)
                const isPregnancyWeek = week <= 42

                return (
                  <text
                    key={`week-${week}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={
                      isPregnancyWeek
                        ? styles.weekNumberPregnancy
                        : styles.weekNumberRegular
                    }
                    transform={`rotate(${-wheelAngle}, ${x}, ${y})`}
                    opacity={isPregnancyWeek ? 1 : 0.5}
                  >
                    {week}
                  </text>
                )
              })}

              {/* F.U.M. pointer - red arrow pointing outward */}
              <line
                x1="250"
                y1="90"
                x2="250"
                y2="110"
                stroke={styles.furPointer.stroke}
                strokeWidth={styles.furPointer.strokeWidth}
              />

              {/* Arrow head for . pointer */}
              <polygon
                points="250,110 245,105 255,105"
                fill={styles.furArrow.fill}
              />

              {/* F.U.M. label */}
              <text
                x="250"
                y="75"
                textAnchor="middle"
                className={styles.furLabel}
                transform={`rotate(${-wheelAngle}, 250, 75)`}
              >
                F.U.M.
              </text>
            </g>

            {/* Center date display - stays fixed */}
            <circle
              cx="250"
              cy="250"
              r="80"
              fill={styles.centerCircle.fill}
              stroke={styles.centerCircle.stroke}
              strokeWidth={styles.centerCircle.strokeWidth}
            />

            <text
              x="250"
              y="220"
              textAnchor="middle"
              className={styles.furDateLabel}
            >
              Fecha de última menstruación
            </text>

            {furDate && (
              <>
                <text
                  x="250"
                  y="255"
                  textAnchor="middle"
                  className={styles.furDayNumber}
                >
                  {furDate.getDate()}
                </text>
                <text
                  x="250"
                  y="275"
                  textAnchor="middle"
                  className={styles.furMonth}
                >
                  de{' '}
                  {
                    [
                      'Ene',
                      'Feb',
                      'Mar',
                      'Abr',
                      'May',
                      'Jun',
                      'Jul',
                      'Ago',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dic',
                    ][furDate.getMonth()]
                  }
                </text>
              </>
            )}

            <text
              x="250"
              y="295"
              textAnchor="middle"
              className={styles.dueDateLabel}
            >
              Fecha estimada de parto
            </text>

            {dueDate && (
              <text
                x="250"
                y="310"
                textAnchor="middle"
                className={styles.dueDate}
              >
                {dueDate.getDate()} de{' '}
                {
                  [
                    'Ene',
                    'Feb',
                    'Mar',
                    'Abr',
                    'May',
                    'Jun',
                    'Jul',
                    'Ago',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dic',
                  ][dueDate.getMonth()]
                }
              </text>
            )}

            {/* Invisible draggable area */}
            <circle
              ref={wheelRef}
              cx="250"
              cy="250"
              r="160"
              fill="transparent"
              className={styles.draggableArea}
              onMouseDown={handleMouseDown}
            />
          </svg>
        </div>
      </div>

      {/* Information Panel */}
      <div className={styles.infoPanel}>
        <h2 className={styles.infoPanelTitle}>Información del Embarazo</h2>

        {/* Two Column Layout */}
        <div className={styles.gridLayout}>
          {/* Left Column */}
          <div className={styles.leftInfoColumn}>
            <div className={`${styles.infoCard} ${styles.furCard}`}>
              <h3 className={styles.furCardTitle}>
                Fecha de Última Menstruación (F.U.M.)
              </h3>
              <p className={styles.furCardText}>
                {furDate
                  ? formatSpanishDate(furDate)
                  : 'Ajuste la rueda para calcular'}
              </p>
            </div>

            <div className={`${styles.infoCard} ${styles.dueDateCard}`}>
              <h3 className={styles.dueDateCardTitle}>
                Fecha Estimada de Parto
              </h3>
              <p className={styles.dueDateCardText}>
                {dueDate
                  ? formatSpanishDate(dueDate)
                  : 'Ajuste la rueda para calcular'}
              </p>
            </div>

            <div className={`${styles.infoCard} ${styles.weeksCard}`}>
              <h3 className={styles.weeksCardTitle}>Semanas de Embarazo</h3>
              <p className={styles.weeksCardText}>
                {pregnancyData.weekOfPregnancy > 0 &&
                pregnancyData.weekOfPregnancy < 43
                  ? `Semana ${pregnancyData.weekOfPregnancy} de embarazo`
                  : 'No hay embarazo activo'}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightInfoColumn}>
            <div className={`${styles.infoCard} ${styles.measurementsCard}`}>
              <h3 className={styles.measurementsCardTitle}>
                Medidas Estimadas
              </h3>
              <div className={styles.measurementsGrid}>
                <div className={styles.measurementRow}>
                  <span className={styles.measurementLabel}>
                    Altura uterina (min - max):
                  </span>
                  <span className={styles.measurementValue}>
                    {pregnancyData.altura_uterina}
                  </span>
                </div>
                <div className={styles.measurementRow}>
                  <span className={styles.measurementLabel}>
                    Ganancia de peso materno (min - max):
                  </span>
                  <span className={styles.measurementValue}>
                    {pregnancyData.ganancia_peso_materno}
                  </span>
                </div>
                <div className={styles.measurementRow}>
                  <span className={styles.measurementLabel}>
                    Peso fetal (min - max):
                  </span>
                  <span className={styles.measurementValue}>
                    {pregnancyData.peso_fetal}
                  </span>
                </div>
                <div className={styles.measurementRow}>
                  <span className={styles.measurementLabel}>
                    Contracciones uterinas (por hora):
                  </span>
                  <span className={styles.measurementValue}>
                    {pregnancyData.contracciones}
                  </span>
                </div>
              </div>
            </div>

            <div className={`${styles.infoCard} ${styles.daysCard}`}>
              <h3 className={styles.daysCardTitle}>Días de Embarazo</h3>
              <p className={styles.daysCardText}>
                {pregnancyData.dayOfPregnancy} días
              </p>
            </div>

            <div className={`${styles.infoCard} ${styles.currentDateCard}`}>
              <h3 className={styles.currentDateCardTitle}>Fecha Actual</h3>
              <p className={styles.currentDateCardText}>
                {formatSpanishDate(currentDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions spanning full width */}
        <div className={styles.instructions}>
          <p className={styles.instructionsText}>
            <strong>Instrucciones:</strong> Haga clic y arrastre la rueda
            interior para ajustar la fecha de última menstruación (F.U.M.) y
            calcular automáticamente todos los datos del embarazo. Los números
            del 1-42 representan semanas de embarazo, distribuidas a lo largo
            del año calendario.
          </p>
        </div>
      </div>
    </div>
  )
}
