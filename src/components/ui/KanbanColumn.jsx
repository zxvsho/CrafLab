import { useDroppable } from '@dnd-kit/core'
import { cn, statusLabel } from '../../lib/utils'

export default function KanbanColumn({ status, count, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status },
  })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex min-h-[420px] flex-col rounded-xl border border-outline-variant bg-surface-container-low p-4 transition-colors',
        isOver && 'bg-surface-container',
      )}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-headline-md font-headline-md text-on-surface">{statusLabel(status)}</h3>
          <p className="text-body-sm font-body-sm text-on-surface-variant">{count} tareas</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </section>
  )
}