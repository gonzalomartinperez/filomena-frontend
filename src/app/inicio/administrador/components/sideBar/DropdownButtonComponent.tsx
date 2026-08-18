import { MenuGroup } from 'app/types/Components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons'

interface DropdownButtonProps {
  group: MenuGroup
  expandedGroups: { [key: string]: boolean }
  toggleGroup: (groupId: string) => void
}

export default function DropdownButton({
  group,
  expandedGroups,
  toggleGroup,
}: DropdownButtonProps) {
  return (
    <button
      onClick={() => toggleGroup(group.id)}
      className="flex w-full cursor-pointer items-center px-4 py-3 text-sm font-medium text-gray-200 hover:bg-white/10"
    >
      <FontAwesomeIcon icon={group.icon} className="mr-3 w-4" fixedWidth />
      <span className="font-normal">{group.label}</span>
      <FontAwesomeIcon
        icon={expandedGroups[group.id] ? faCaretDown : faCaretRight}
        className="ml-1 w-3"
        fixedWidth
      />
    </button>
  )
}
