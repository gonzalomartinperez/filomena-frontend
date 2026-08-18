import { MenuItem } from 'app/types/Components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface NavigationButtonProps {
  item: MenuItem
  activeItem: string
  navigateTo: (path: string) => void
}

export default function NavigationButton({
  item,
  activeItem,
  navigateTo,
}: NavigationButtonProps) {
  const isActive = activeItem === item.id

  return (
    <button
      onClick={() => navigateTo(item.id)}
      className={`flex w-full cursor-pointer items-center px-4 py-3 text-sm text-gray-200 hover:bg-white/10 ${
        isActive
          ? 'border-l-4 border-blue-500 bg-white/10 text-white'
          : 'border-l-4 border-transparent'
      }`}
    >
      <FontAwesomeIcon icon={item.icon} className="mr-3 w-4" fixedWidth />
      <span className="font-normal">{item.label}</span>
    </button>
  )
}
