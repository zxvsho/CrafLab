import { cn } from '../../lib/utils'

export default function StatCard({ icon, label, value, accentClass = 'bg-primary-container text-on-primary-container', note }) {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)] transition-shadow hover:shadow-[0px_10px_15px_rgba(30,58,95,0.1)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className={cn('rounded-lg p-3', accentClass)}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        {note ? <span className="rounded-full bg-secondary/10 px-2 py-1 text-label-md font-label-md text-secondary">{note}</span> : null}
      </div>
      <div>
        <p className="mb-1 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">{label}</p>
        <h3 className="text-display-lg font-display-lg text-on-surface">{value}</h3>
      </div>
    </article>
  )
}