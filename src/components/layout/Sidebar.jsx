import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../lib/utils'

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { profile, signOut } = useAuth()
  const items = profile?.role === 'admin'
    ? [
        { to: '/admin/dashboard', icon: 'dashboard', label: 'Panel' },
        { to: '/admin/students', icon: 'school', label: 'Estudiantes' },
        { to: '/admin/teachers', icon: 'co_present', label: 'Profesores' },
        { to: '/admin/subjects', icon: 'menu_book', label: 'Asignaturas' },
        { to: '/admin/groups', icon: 'groups', label: 'Grupos' },
        { to: '/admin/enrollments', icon: 'how_to_reg', label: 'Matrículas' },
        { to: '/admin/grades', icon: 'grade', label: 'Calificaciones' },
        { to: '/admin/projects', icon: 'folder_copy', label: 'Proyectos' },
        { to: '/admin/reports', icon: 'assessment', label: 'Informes' },
      ]
    : profile?.role === 'teacher'
      ? [{ to: '/teacher/grades', icon: 'grade', label: 'Mis grupos y notas' }]
      : [{ to: '/student/academic', icon: 'school', label: 'Mi información académica' }]

  const content = (
    <>
      <div className="mb-8 px-4 py-2">
        <h1 className="text-headline-md font-headline-md font-black text-primary">GesTask</h1>
      </div>

      <div className="mb-6 flex items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-label-md font-label-md text-on-primary-container">
          {getInitials(profile?.full_name || 'GesTask')}
        </div>
        <div>
          <div className="text-label-md font-label-md text-on-surface">{profile?.full_name || 'Administrador GesTask'}</div>
          <div className="text-body-sm font-body-sm text-on-surface-variant">{profile?.role || 'Usuario'}</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-4 py-3 transition-all',
                isActive ? 'translate-x-1 bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
              ].join(' ')
            }
            onClick={onClose}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {item.icon}
            </span>
            <span className="text-label-md font-label-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-outline-variant pt-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          onClick={signOut}
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md font-label-md">Cerrar sesión</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="fixed left-0 top-0 hidden h-screen w-[280px] flex-col border-r border-outline-variant bg-surface-container-low shadow-sm md:flex">
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose}>
          <aside
            className="flex h-full w-[280px] flex-col bg-surface-container-low p-4 shadow-[0px_20px_45px_rgba(30,58,95,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            {content}
          </aside>
        </div>
      ) : null}
    </>
  )
}