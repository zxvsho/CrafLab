import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/ui/StatCard'
import { supabase } from '../../lib/supabaseClient'

const links = [
  { to: '/admin/students', label: 'Gestionar estudiantes', icon: 'school' },
  { to: '/admin/teachers', label: 'Gestionar profesores', icon: 'co_present' },
  { to: '/admin/subjects', label: 'Gestionar asignaturas', icon: 'menu_book' },
  { to: '/admin/groups', label: 'Gestionar grupos', icon: 'groups' },
  { to: '/admin/enrollments', label: 'Gestionar matrículas', icon: 'how_to_reg' },
  { to: '/admin/grades', label: 'Gestionar calificaciones', icon: 'grade' },
]

export default function AcademicDashboard() {
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadCounts() {
      const tables = ['students', 'teachers', 'subjects', 'groups', 'enrollments', 'grades']
      const results = await Promise.all(tables.map((table) => supabase.from(table).select('*', { count: 'exact', head: true })))
      const failed = results.find((result) => result.error)
      if (!active) return
      if (failed) {
        setError(failed.error.message)
      } else {
        setCounts(Object.fromEntries(tables.map((table, index) => [table, results[index].count ?? 0])))
      }
      setLoading(false)
    }
    loadCounts()
    return () => { active = false }
  }, [])

  return (
    <div className="space-y-gutter">
      <header>
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Panel de gestión académica</h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Resumen del sistema y accesos rápidos a los módulos.</p>
      </header>
      {error ? <div role="alert" className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}
      <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon="school" label="Estudiantes" value={loading ? '…' : counts.students ?? 0} />
        <StatCard icon="co_present" label="Profesores" value={loading ? '…' : counts.teachers ?? 0} />
        <StatCard icon="menu_book" label="Asignaturas" value={loading ? '…' : counts.subjects ?? 0} />
        <StatCard icon="groups" label="Grupos" value={loading ? '…' : counts.groups ?? 0} />
        <StatCard icon="how_to_reg" label="Matrículas" value={loading ? '…' : counts.enrollments ?? 0} />
        <StatCard icon="grade" label="Calificaciones" value={loading ? '…' : counts.grades ?? 0} />
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <Link key={item.to} to={item.to} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface p-5 text-on-surface transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-primary">{item.icon}</span>
            <span className="text-label-md font-label-md">{item.label}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
