import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export interface MenuItem {
  id: string
  label: string
  icon: IconDefinition
  action?: () => void
}

export interface MenuGroup {
  id: string
  label: string
  icon: IconDefinition
  items: MenuItem[]
}
