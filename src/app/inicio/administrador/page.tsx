import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleExclamation,
  faPenToSquare,
  faBook,
  faUsers,
  faUserSecret,
  faQuestion,
  faTable,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons'
import { faBookmark, faFileLines } from '@fortawesome/free-regular-svg-icons'

const styles = {
  container: 'min-h-screen px-4 py-8 overflow-y-auto',
  maxWidth: 'mx-auto max-w-4xl',
  headerCard: 'mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
  title: 'mb-4 text-3xl font-bold text-gray-900',
  headerText: 'leading-relaxed text-gray-700',
  welcomeText: 'font-medium text-blue-600',
  stepsContainer: 'mb-6 space-y-4',
  stepCard: 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
  stepContent: 'flex items-start space-x-4',
  stepNumberContainer: 'flex-shrink-0',
  stepNumber:
    'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600',
  stepTextContainer: 'flex-1',
  stepTitleContainer: 'mb-2 flex items-center space-x-2',
  stepTitle: 'text-lg font-semibold text-gray-900',
  stepDescription: 'text-sm leading-relaxed text-gray-700',
  icon: 'h-4 w-4',
  warningsSection: 'rounded-lg border border-red-200 bg-red-50 p-6',
  warningsTitle: 'mb-4 flex items-center text-lg font-semibold text-red-800',
  warningsIcon: 'mr-2 h-5 w-5',
  warningsList: 'space-y-3 text-sm text-red-700',
  warningItem: 'flex items-start',
  warningBullet: 'mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-red-400',
  warningSubItem: 'mt-1 ml-4 block',
  highlightText: 'text-blue-600 font-medium',
}

export default function FilomenaExamPage() {
  const steps = [
    {
      number: 1,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Examenes',
      description:
        'Solamente podrá existir un único examen, por lo que una vez creado no podrá crearse otro.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faBook} className={styles.icon} />
      ),
    },
    {
      number: 2,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Usuarios',
      description:
        'Crear todos los usuarios correspondientes, esto es, estudiantes, evaluadores y administradores. El sistema contará con un administrador por defecto, y siempre garantizará que existe al menos uno. Es por eso que si se quiere eliminar un administrador y este es el único del sistema, el mismo no podrá eliminarse. Para poder eliminarlo, bastará con crear otro administrador y eliminar nuevamente el viejo administrador.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faUsers} className={styles.icon} />
      ),
      highlights: ['estudiantes', 'evaluadores', 'administradores'],
    },
    {
      number: 3,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Pseudónimos',
      description:
        'no se crean pseudonimos en sí. El sistema cuenta por defecto con 1000 pseudónimos que representan los números del 1 al 1000. Los mismos son asignados automáticamente cuando los alumnos son creados. El administrador no necesita establecer la relación explícitamente. En esta vista se listan los pseudonimos de un examen permitiendo al administrador ver cuales están en uso.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faUserSecret} className={styles.icon} />
      ),
    },
    {
      number: 4,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Secciones',
      description:
        'Las secciones creadas, podrán ser utilizadas luego para crear las tablas de cotejo correspondientes. Para poder crear una sección debe estar creado el examen.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faBookmark} className={styles.icon} />
      ),
    },
    {
      number: 5,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Casos',
      description:
        'Se definen los nombres de los casos que se van a utilizar durante el examen. Para poder crear un caso debe estar creado el examen.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faFileLines} className={styles.icon} />
      ),
    },
    {
      number: 6,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Preguntas',
      description:
        'Para poder crear las preguntas, deberá estar creado el examen. Luego la lista de casos disponibles a cada pregunta dependerá de los casos creados hasta el momento.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faQuestion} className={styles.icon} />
      ),
    },
    {
      number: 7,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Tablas de cotejo',
      description:
        'Para poder crear una tabla de cotejo debe existir al menos un caso y una sección creada. Se podrá ir agregando dinámicamente los ítems asociados a cada sección.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faTable} className={styles.icon} />
      ),
    },
    {
      number: 8,
      titleLeftSide: 'Dirigirse a ABM → ',
      titleRightSide: 'Mochila de carga',
      description:
        'si se quiere agregar un conjunto de PDF para que el alumno pueda consultar al resolver los casos.',
      abmIcon: <FontAwesomeIcon icon={faPenToSquare} className={styles.icon} />,
      destinationIcon: (
        <FontAwesomeIcon icon={faBriefcase} className={styles.icon} />
      ),
    },
  ]

  const getHighlightedText = (text: string, highlights: string[] = []) => {
    if (highlights.length === 0) return text

    let highlightedText = text
    highlights.forEach((highlight) => {
      const regex = new RegExp(`(${highlight})`, 'gi')
      highlightedText = highlightedText.replace(
        regex,
        `<span class="${styles.highlightText}">$1</span>`,
      )
    })

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Header */}
        <div className={styles.headerCard}>
          <h1 className={styles.title}>Filomena</h1>
          <p className={styles.headerText}>
            <span className={styles.welcomeText}>
              Bienvenido Administrador!
            </span>{' '}
            Para poder crear un examen Filomena debe realizar en orden los
            siguientes pasos:
          </p>
        </div>

        {/* Steps */}
        <div className={styles.stepsContainer}>
          {steps.map((step) => (
            <div key={step.number} className={styles.stepCard}>
              <div className={styles.stepContent}>
                <div className={styles.stepNumberContainer}>
                  <div className={styles.stepNumber}>{step.number}</div>
                </div>
                <div className={styles.stepTextContainer}>
                  <div className={styles.stepTitleContainer}>
                    {step.abmIcon}
                    <h3 className={styles.stepTitle}>{step.titleLeftSide}</h3>
                    {step.destinationIcon}
                    <h3 className={styles.stepTitle}>{step.titleRightSide}</h3>
                  </div>
                  <p className={styles.stepDescription}>
                    {step.highlights
                      ? getHighlightedText(step.description, step.highlights)
                      : step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Warnings Section */}
        <div className={styles.warningsSection}>
          <h2 className={styles.warningsTitle}>
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className={styles.warningsIcon}
            />
            Aclaraciones
          </h2>
          <ul className={styles.warningsList}>
            <li className={styles.warningItem}>
              <span className={styles.warningBullet}></span>
              <span>
                Los pasos 2, 4, 5 podrán realizarse sin respetar el orden
                establecido entre ellos
              </span>
            </li>
            <li className={styles.warningItem}>
              <span className={styles.warningBullet}></span>
              <span>
                El ABM (crear, editar y eliminar) sólo podrá realizarse mientras
                que se cumplan las siguientes condiciones:
                <br />
                <span className={styles.warningSubItem}>
                  1) El examen haya sido creado pero no publicado
                </span>
              </span>
            </li>
            <li className={styles.warningItem}>
              <span className={styles.warningBullet}></span>
              <span>
                Con otras palabras, mientras el examen esté publicado
                (estudiantes rindiendo), está siendo corregido y/o defendido no
                podrán realizarse modificaciones en la estructura del mismo. Una
                vez finalizada la defensa y exportados los datos, el
                administrador puede eliminar el examen y cargar uno nuevo para
                la próxima prueba.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
