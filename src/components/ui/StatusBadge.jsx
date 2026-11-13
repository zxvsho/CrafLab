import { cn, statusLabel, statusToBadgeClass } from '../../lib/utils'

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-label-md font-label-md uppercase tracking-wider',
        statusToBadgeClass(status),
      )}
    >
      {statusLabel(status)}
    </span>
  )
}