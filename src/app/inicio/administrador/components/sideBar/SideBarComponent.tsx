'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  faBook,
  faUsers,
  faUserSecret,
  faTable,
  faQuestion,
  faBriefcase,
  faDesktop,
  faChartColumn,
  faDownload,
  faPenToSquare,
  faHouse,
} from '@fortawesome/free-solid-svg-icons'
import { faBookmark, faFileLines } from '@fortawesome/free-regular-svg-icons'
import { MenuItem, MenuGroup } from 'app/types/Components'
import DropdownButton from './DropdownButtonComponent'
import NavigationButton from './NavigationButtonComponent'
import { ADMINISTRADOR } from '../../usuarios/constants/roles'

export default function SideBar() {
  const router = useRouter()
  const pathname = usePathname()
  const activeItem = pathname?.split('/').pop() || ADMINISTRADOR
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean
  }>({
    abm: true,
  })

  const navigateTo = (path: string): void => {
    if (path == ADMINISTRADOR) {
      router.push(`/inicio/administrador`)
    } else {
      router.push(`/inicio/administrador/${path}`)
    }
  }

  const toggleGroup = (groupId: string): void => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // Defino boton para volver al inicio
  const inicioButton: MenuItem = {
    id: ADMINISTRADOR,
    label: 'Inicio',
    icon: faHouse,
  }

  // Defino items de un dropdown
  const abmItems: MenuItem[] = [
    { id: 'examenes', label: 'Examenes', icon: faBook },
    { id: 'usuarios', label: 'Usuarios', icon: faUsers },
    { id: 'pseudonimos', label: 'Pseudónimos', icon: faUserSecret },
    { id: 'secciones', label: 'Secciones', icon: faBookmark },
    { id: 'casos', label: 'Casos', icon: faFileLines },
    { id: 'preguntas', label: 'Preguntas', icon: faQuestion },
    { id: 'tablas-cotejo', label: 'Tablas de cotejo', icon: faTable },
    { id: 'mochila-carga', label: 'Mochila de carga', icon: faBriefcase },
  ]

  // Defino botones dropdown
  const menuGroups: MenuGroup[] = [
    {
      id: 'abm',
      label: 'ABM',
      icon: faPenToSquare,
      items: abmItems,
    },
  ]

  // Defino items independientes
  const standaloneMenuItems: MenuItem[] = [
    {
      id: 'administrar-examenes',
      label: 'Administrar examenes',
      icon: faDesktop,
    },
    { id: 'graficos', label: 'Gráficos', icon: faChartColumn },
    { id: 'reportes', label: 'Reportes', icon: faDownload },
  ]

  return (
    <aside className="w-[224px] overflow-auto border-r border-[#2f3640] bg-[#262626] text-[#d2dae2]">
      <nav className="py-2">
        <ul className="m-0 list-none p-0">
          {/* Render boton para volver al inicio */}
          <li key={inicioButton.id} className="mb-1 w-full">
            <NavigationButton
              item={inicioButton}
              activeItem={activeItem}
              navigateTo={navigateTo}
            />
          </li>
          {/* Render botones dropdown */}
          {menuGroups.map((group) => (
            <li key={group.id} className="mb-1 w-full">
              <DropdownButton
                group={group}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
              />
              {/* Render botones de dropdown */}
              {expandedGroups[group.id] && (
                <ul className="m-0 list-none p-0 pl-4">
                  {group.items.map((item) => (
                    <li key={item.id} className="mb-1 w-full">
                      <NavigationButton
                        item={item}
                        activeItem={activeItem}
                        navigateTo={navigateTo}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {/* Render botones independientes */}
          {standaloneMenuItems.map((item) => (
            <li key={item.id} className="mb-1 w-full">
              <NavigationButton
                item={item}
                activeItem={activeItem}
                navigateTo={navigateTo}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
