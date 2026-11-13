import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../lib/utils'

export default function Topbar({ onMenuClick, showMenuButton = false, title = 'GesTask' }) {
  const { profile } = useAuth()
  const [query, setQuery] = useState('')

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-surface px-margin-mobile shadow-[0px_2px_4px_rgba(30,58,95,0.05)] md:px-margin-desktop">
      <div className="flex items-center gap-3">
        {showMenuButton ? (
          <button
            type="button"
            className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-high md:hidden"
            onClick={onMenuClick}
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        ) : null}
        <div>
          <h1 className="text-headline-md font-headline-md text-primary">{title}</h1>
          <p className="hidden text-body-sm font-body-sm text-on-surface-variant md:block">Portal de Gestión Académica</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden w-full max-w-xl items-center rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 focus-within:border-secondary md:flex">
          <span className="material-symbols-outlined mr-2 text-outline">search</span>
          <input
            className="w-full border-none bg-transparent text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:ring-0"
            placeholder="Buscar proyectos, tareas..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button type="button" className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-high" aria-label="Notificaciones">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <div className="flex items-center gap-3 rounded-full border border-outline-variant bg-surface-container-low px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-label-md font-label-md text-on-primary-container">
            {getInitials(profile?.full_name || 'GT') || 'GT'}
          </div>
          <div className="hidden pr-2 md:block">
            <p className="text-body-sm font-body-sm text-on-surface">{profile?.full_name || title}</p>
            <p className="text-label-md font-label-md text-on-surface-variant">{profile?.role || 'Usuario'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}