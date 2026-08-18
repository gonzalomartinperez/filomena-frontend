import { MenuGroup } from 'app/types/Components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons'

interface ToolsDropdownButtonProps {
  group: MenuGroup
  expandedGroups: { [key: string]: boolean }
  toggleGroup: (groupId: string) => void
}

export default function ToolsDropdownButton({
  group,
  expandedGroups,
  toggleGroup,
}: ToolsDropdownButtonProps) {
  return (
    <button
      onClick={() => toggleGroup(group.id)}
      className="ml-2 cursor-pointer rounded bg-white/10 px-2 py-1 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
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
