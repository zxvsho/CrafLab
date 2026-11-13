import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-margin-mobile backdrop-blur-sm md:p-margin-desktop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_20px_45px_rgba(30,58,95,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-outline-variant pb-4">
          <h2 className="text-headline-md font-headline-md text-on-surface">{title}</h2>
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}