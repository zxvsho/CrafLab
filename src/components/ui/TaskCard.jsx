import StatusBadge from './StatusBadge'
import { cn, formatDate, priorityLabel, priorityToBadgeClass } from '../../lib/utils'

export default function TaskCard({ task, projectName, assignedName, dragAttributes, dragListeners, dragRef, dragStyle, dragging = false }) {
  return (
    <article
      ref={dragRef}
      style={dragStyle}
      {...dragAttributes}
      {...dragListeners}
      className={cn(
        'cursor-grab rounded-xl border border-outline-variant bg-surface p-4 shadow-[0px_2px_4px_rgba(30,58,95,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_10px_15px_rgba(30,58,95,0.1)] active:cursor-grabbing',
        dragging && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {projectName ? <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">{projectName}</p> : null}
          <h4 className="mt-1 text-body-md font-body-md text-on-surface">{task.title}</h4>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-body-sm font-body-sm text-on-surface-variant">{task.description || 'Sin descripción'}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-3 py-1 text-label-md font-label-md uppercase tracking-wider', priorityToBadgeClass(task.priority))}>
          {priorityLabel(task.priority)}
        </span>
        {assignedName ? <span className="rounded-full bg-surface-container px-3 py-1 text-label-md font-label-md text-on-surface-variant">{assignedName}</span> : null}
        {task.due_date ? <span className="rounded-full bg-surface-container px-3 py-1 text-label-md font-label-md text-on-surface-variant">{formatDate(task.due_date)}</span> : null}
      </div>
    </article>
  )
}