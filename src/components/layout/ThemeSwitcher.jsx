import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 font-mono text-xs uppercase tracking-wide text-on-surface transition-colors hover:bg-surface-container-high"
        aria-label={`Cambiar tema. Tema actual: ${theme.label}`}
        aria-expanded={open}
        aria-controls="theme-options"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{theme.icon}</span>
        <span className="hidden sm:inline">{theme.label}</span>
      </button>

      {open ? (
        <div
          id="theme-options"
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-60 overflow-y-auto rounded-md border border-outline-variant bg-surface-container-lowest p-2 font-mono shadow-[0px_12px_30px_rgba(30,58,95,0.3)]"
          role="group"
          aria-label="Paletas de color"
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Colorscheme</p>
          {themes.map((option) => (
            <button
              key={option.id}
              type="button"
              className={[
                'flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm transition-colors',
                theme.id === option.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface hover:bg-surface-container-high',
              ].join(' ')}
              aria-pressed={theme.id === option.id}
              onClick={() => {
                setTheme(option.id)
                setOpen(false)
                triggerRef.current?.focus()
              }}
            >
              <span className="h-3.5 w-3.5 rounded-sm border border-outline-variant" style={{ backgroundColor: option.swatch }} aria-hidden="true" />
              <span className="flex-1">{option.label}</span>
              {theme.id === option.id ? <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check</span> : null}
            </button>
          ))}
          <p className="px-3 pb-1 pt-2 text-[10px] text-on-surface-variant">T para recorrer paletas</p>
        </div>
      ) : null}
    </div>
  )
}
