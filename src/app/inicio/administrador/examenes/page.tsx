'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSerializer } from 'nuqs'
import { Examen } from './types/Examen'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import {
  deleteExamenAPI,
  reestablecerExamenAPI,
} from './services/examenesServices'
import { Button } from 'app/components/buttons/GeneralButton'
import {
  faBackward,
  faCircleExclamation,
  faCirclePlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useModal from 'app/hooks/useModal'
import ExamenListComponent from '../components/lists/ExamenListComponent'

const BASE = '/inicio/administrador/examenes'

const styles = {
  container: 'font-geist-sans min-h-screen overflow-y-auto pb-24',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  warningsSection: 'mt-4 rounded-lg border border-red-200 bg-red-50 p-6',
  warningsTitle: 'mb-4 flex items-center text-lg font-semibold text-red-800',
  warningsIcon: 'ml-2 mr-1 h-5 w-5',
  warningsList: 'space-y-3 text-sm text-red-700',
  warningItem: 'relative pl-6',
  warningItemHeader: 'flex items-center gap-2 font-medium text-red-800',
  warningItemIcon: 'text-red-600',
  warningItemIconText: 'font-semibold',
  warningBullet: 'absolute left-0 top-2 h-2 w-2 rounded-full bg-red-400',
  warningDescription: 'mt-1 text-sm text-red-700',
  warningDescriptionContinue: 'mt-2 text-sm text-red-700',
}

export default function Page() {
  const router = useRouter()
  const [listReloadKey, setListReloadKey] = useState(0)

  const serialize = useMemo(() => createSerializer({}), [])

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  const handleCreate = () => {
    router.push(serialize(`${BASE}/crear`, {}))
  }

  const handleEdit = (e: Examen) => {
    router.push(serialize(`${BASE}/editar/${e.id}`, {}))
  }

  const deleteElement = (e: Examen) => {
    const id = startLoading('Eliminando examen')
    deleteExamenAPI(e.id)
      .then(() => {
        openToast({ severity: 'success', message: 'Examen eliminado' })
        setListReloadKey((k) => k + 1)
      })
      .finally(() => stopLoading(id))
  }

  const handleDelete = (e: Examen) => {
    openModal({
      type: 'confirmacion',
      message:
        '¿Estás seguro que desea eliminar el examen junto con todos sus datos?',
      button: { onClick: () => deleteElement(e) },
    })
  }

  const rewindElement = (e: Examen) => {
    const id = startLoading('Reestableciendo examen')
    reestablecerExamenAPI(e.id)
      .then(() => {
        openToast({ severity: 'success', message: 'Examen reestablecido' })
        setListReloadKey((k) => k + 1)
      })
      .finally(() => stopLoading(id))
  }

  const handleRewind = (e: Examen) => {
    openModal({
      type: 'confirmacion',
      message:
        '¿Está seguro que desea llevar el examen a sus condiciones iniciales?',
      button: { onClick: () => rewindElement(e) },
    })
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Examenes</h1>

      <div className={styles.controls}>
        <div className={styles.buttonsWrapper}>
          <Button variant="default" icon={faCirclePlus} onClick={handleCreate}>
            Crear examen
          </Button>
        </div>
      </div>

      <ExamenListComponent
        key={listReloadKey}
        rowClickEnabled={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRewind={handleRewind}
      />

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
            <div className={styles.warningItemHeader}>
              <span>La operación</span>
              <FontAwesomeIcon
                icon={faTrash}
                className={styles.warningItemIcon}
              />
              <span className={styles.warningItemIconText}>
                Eliminar examen
              </span>
            </div>
            <p className={styles.warningDescription}>
              debe emplearse después de haber exportado los reportes necesarios,
              ya que la misma remueve todos los datos guardados hasta el momento
              en el sistema.
            </p>
          </li>

          <li className={styles.warningItem}>
            <span className={styles.warningBullet}></span>
            <div className={styles.warningItemHeader}>
              <span>La operación</span>
              <FontAwesomeIcon
                icon={faBackward}
                className={styles.warningItemIcon}
              />
              <span className={styles.warningItemIconText}>
                Reestablecer examen
              </span>
            </div>
            <p className={styles.warningDescription}>
              lleva al examen cargado hasta el momento a las iniciales. Esto es,
              mantiene toda su estructura (casos, preguntas, tabla de cotejo y
              asignaciones) pero elimina todos los datos que se guardan al
              rendirlo, corregirlo o defenderlo. En lo respectivo a los
              usuarios, elimina todos los alumnos pero mantiene los evaluadores.
            </p>
            <p className={styles.warningDescriptionContinue}>
              Esta operación es muy útil para que el administrador cree un
              alumno ficticio y rinda el examen como tal para visualizar
              exactamente lo que el estudiante va a ver cuando rinda.
            </p>
          </li>
        </ul>
      </div>
    </div>
  )
}
