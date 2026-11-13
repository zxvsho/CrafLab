import StatusBadge from './StatusBadge'
import { cn, formatDate } from '../../lib/utils'

export default function ProjectCard({ project, membersCount = 0, tasksCount = 0, onClick, onEdit, onDelete }) {
  return (
    <article
      className="group cursor-pointer rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_10px_15px_rgba(30,58,95,0.1)]"
      onClick={onClick}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined text-[20px]">folder_copy</span>
        </div>
        <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={(event) => {
              event.stopPropagation()
              onEdit?.(project)
            }}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={(event) => {
              event.stopPropagation()
              onDelete?.(project)
            }}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-headline-md font-headline-md text-on-surface">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-body-sm font-body-sm text-on-surface-variant">{project.description || 'Sin descripción'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="rounded-full bg-surface-container px-3 py-1 text-label-md font-label-md text-on-surface-variant">{membersCount} estudiantes</span>
          <span className="rounded-full bg-surface-container px-3 py-1 text-label-md font-label-md text-on-surface-variant">{tasksCount} tareas</span>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant pt-4 text-body-sm font-body-sm text-on-surface-variant">
          <span>{formatDate(project.deadline)}</span>
          <span className={cn('text-label-md font-label-md uppercase tracking-wider', project.status === 'finalizado' ? 'text-secondary' : 'text-primary')}>
            Ver detalle
          </span>
        </div>
      </div>
    </article>
  )
}