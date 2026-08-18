import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction } from 'react'
import { Examen } from '../../examenes/types/Examen'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHourglassEnd,
  faHourglassStart,
} from '@fortawesome/free-solid-svg-icons'
import { faSquareCheck } from '@fortawesome/free-regular-svg-icons'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import {
  publicarExamenAPI,
  finalizarExamenAPI,
} from '../../administrar-examenes/services/administrarServices'
import useModal from 'app/hooks/useModal'

interface AdminActionButtonsProps {
  selectedExamen: Examen
  setSelectedExamen: Dispatch<SetStateAction<Examen | null>>
}

export default function AdminActionButtons({
  selectedExamen,
  setSelectedExamen,
}: AdminActionButtonsProps) {
  const router = useRouter()
  const {
    actions: { startLoading, stopLoading },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  async function publicarExamen() {
    const loadingId = startLoading('Publicando examen')
    await publicarExamenAPI(selectedExamen.id)
      .then((res) => {
        setSelectedExamen(res.data.data)
      })
      .finally(() => {
        stopLoading(loadingId)
      })
      .catch((error) => {
        const errorType = error.response?.data?.data?.error

        if (errorType) {
          const redirects: Record<string, string> = {
            sin_evaluadores: `/inicio/administrador/usuarios?examen=${selectedExamen.id}`,
            sin_evaluadores_casos_asignados: `/inicio/administrador/usuarios?examen=${selectedExamen.id}`,
            sin_estudiantes: `/inicio/administrador/usuarios?examen=${selectedExamen.id}`,
            sin_secciones: `/inicio/administrador/secciones?examen=${selectedExamen.id}`,
            sin_casos: `/inicio/administrador/casos?examen=${selectedExamen.id}`,
            sin_evaluables: `/inicio/administrador/preguntas?examen=${selectedExamen.id}`,
            sin_tablas: `/inicio/administrador/tablas-cotejo?examen=${selectedExamen.id}`,
            sin_items: `/inicio/administrador/tablas-cotejo?examen=${selectedExamen.id}`,
          }

          if (redirects[errorType as keyof typeof redirects]) {
            router.push(redirects[errorType as keyof typeof redirects])
          }
        }
      })
  }

  const handlePublicar = async () => {
    openModal({
      type: 'confirmacion',
      message:
        '¿Estás seguro que desea iniciar el examen? \nUna vez iniciado no se podrá editar la estructura para el mismo',
      button: { onClick: () => publicarExamen() },
    })
  }

  const handleConfirmarRetrocedible = async () => {
    if (selectedExamen.retrocedible) {
      openModal({
        type: 'confirmacion',
        message:
          'Este examen está configurado para poder navegar libremente entre preguntas. \n¿Es correcto?',
        button: {
          onClick: () => {
            setTimeout(() => handlePublicar(), 100)
          },
        },
      })
    } else {
      handlePublicar()
    }
  }

  async function finalizarExamen() {
    const loadingId = startLoading('Finalizando examen')
    await finalizarExamenAPI(selectedExamen.id)
      .then((res) => {
        setSelectedExamen(res.data.data)
      })
      .finally(() => {
        stopLoading(loadingId)
      })
  }

  const handleFinalizar = async () => {
    openModal({
      type: 'confirmacion',
      message:
        '¿Estás seguro que desea finalizar el examen? \nUna vez finalizado, los alumnos no podrán seguir respondiendo.',
      button: { onClick: () => finalizarExamen() },
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center bg-gray-400 px-4 py-3 text-white">
        <span className="font-medium">Examen</span>
      </div>
      <div className="flex flex-col space-y-2 p-3">
        <button
          className={`${
            !selectedExamen.publicado
              ? 'cursor-pointer rounded bg-green-500 px-4 py-3 font-medium text-white hover:bg-green-600'
              : 'rounded bg-green-300 px-4 py-3 font-medium text-white'
          }`}
          disabled={selectedExamen.publicado}
          onClick={() => handleConfirmarRetrocedible()}
        >
          <FontAwesomeIcon className="mr-2" icon={faHourglassStart} />
          Comenzar examen
        </button>
        <button
          className={`${
            selectedExamen.publicado && !selectedExamen.finalizado
              ? 'cursor-pointer rounded bg-red-500 px-4 py-3 font-medium text-white hover:bg-red-600'
              : 'rounded bg-red-300 px-4 py-3 font-medium text-white'
          }`}
          disabled={!selectedExamen.publicado || selectedExamen.finalizado}
          onClick={() => handleFinalizar()}
        >
          <FontAwesomeIcon className="mr-2" icon={faHourglassEnd} />
          Finalizar examen
        </button>
        <button
          className="cursor-pointer rounded bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600"
          onClick={() =>
            router.push(
              `/inicio/administrador/administrar-examenes/defensas?examen=${selectedExamen.id}`,
            )
          }
        >
          <FontAwesomeIcon className="mr-2" icon={faSquareCheck} />
          Defensa
        </button>
      </div>
    </div>
  )
}
