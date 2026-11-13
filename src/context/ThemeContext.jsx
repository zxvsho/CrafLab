import { useEffect, useLayoutEffect, useState } from 'react'
import { ThemeContext } from './themeContext'
import { THEMES } from '../lib/themes'

const STORAGE_KEY = 'crafLabTheme'

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY)
    return THEMES.some(({ id }) => id === savedTheme) ? savedTheme : 'everforest'
  } catch (error) {
    console.error('No se pudo leer el tema guardado.', error)
    return 'everforest'
  }
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(getInitialTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const theme = THEMES.find(({ id }) => id === themeId) ?? THEMES[0]

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme.id
    root.classList.toggle('dark', theme.id !== 'claro')
    root.style.colorScheme = theme.id === 'claro' ? 'light' : 'dark'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.browserColor)

    try {
      window.localStorage.setItem(STORAGE_KEY, theme.id)
    } catch (error) {
      console.error('No se pudo guardar el tema seleccionado.', error)
    }
  }, [theme])

  useEffect(() => {
    function handleThemeShortcut(event) {
      const target = event.target
      const isEditingText = target instanceof HTMLElement
        && (target.isContentEditable || target.closest('input, textarea, select, [contenteditable="true"]'))

      if (event.key.toLowerCase() !== 't' || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || isEditingText) {
        return
      }

      event.preventDefault()
      setMenuOpen((isOpen) => !isOpen)
    }

    window.addEventListener('keydown', handleThemeShortcut)
    return () => window.removeEventListener('keydown', handleThemeShortcut)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, themes: THEMES, setTheme: setThemeId, menuOpen, setMenuOpen }}>
      {children}
    </ThemeContext.Provider>
  )
}
