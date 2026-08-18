import { MenuItem } from 'app/types/Components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface ToolButtonProps {
  item: MenuItem
  color: string
  action: () => void
}

export default function ToolButton({ item, color, action }: ToolButtonProps) {
  return (
    <button
      onClick={() => action()}
      className={
        'flex w-full cursor-pointer items-center rounded border-l-4 border-transparent px-4 py-3 text-sm text-gray-200 hover:bg-white/10'
      }
      style={{ backgroundColor: color }}
    >
      <FontAwesomeIcon icon={item.icon} className="mr-3 w-4" fixedWidth />
      <span className="font-normal">{item.label}</span>
    </button>
  )
}
