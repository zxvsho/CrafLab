/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import StatusBadge from '../../components/ui/StatusBadge'
import { supabase } from '../../lib/supabaseClient'
import { formatDate, formatDateTime, isOverdue } from '../../lib/utils'

export default function Reports() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [projectsResult, tasksResult] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      ])

      const projectsError = projectsResult.error
      const tasksError = tasksResult.error

      if (projectsError || tasksError) {
        throw new Error(projectsError?.message || tasksError?.message || 'No se pudieron cargar los reportes desde la base de datos.')
      }

      setProjects(projectsResult.data ?? [])
      setTasks(tasksResult.data ?? [])
    } catch (err) {
      console.error('Error crítico en reportes:', err.message)
      setError(err.message || 'Error de conexión con el servidor. Por favor, intenta de nuevo.')
      // Inicializamos estados limpios en caso de error para evitar congelamiento en los useMemo
      setProjects([])
      setTasks([])
    } finally {
      // Garantiza apagar el estado "Cargando..." pase lo que pase
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Protegemos los reducers y mapeos asegurando que operen siempre con arreglos válidos
  const projectById = useMemo(() => {
    if (!Array.isArray(projects)) return {}
    return projects.reduce((accumulator, project) => ({ ...accumulator, [project.id]: project }), {})
  }, [projects])

  const projectSummaries = useMemo(() => {
    if (!Array.isArray(projects) || !Array.isArray(tasks)) return []
    return projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.project_id === project.id)
      const completedTasks = projectTasks.filter((task) => task.status === 'finalizado').length
      const percentage = projectTasks.length ? Math.round((completedTasks / projectTasks.length) * 100) : 0

      return { ...project, completedTasks, totalTasks: projectTasks.length, percentage }
    })
  }, [projects, tasks])

  const completedLast7Days = useMemo(() => {
    if (!Array.isArray(tasks)) return []
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return tasks
      .filter((task) => task.completed_at && new Date(task.completed_at) >= sevenDaysAgo)
      .sort((left, right) => new Date(right.completed_at) - new Date(left.completed_at))
  }, [tasks])

  const overdueTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return []
    return tasks.filter((task) => task.status && isOverdue(task.due_date, task.status))
  }, [tasks])

  if (loading) {
    return <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">Cargando reportes...</div>
  }

  return (
    <div className="space-y-gutter">
      <div>
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Informes</h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Seguimiento de progreso y alertas de tareas.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container flex flex-col gap-2">
          <span>{error}</span>
          <button 
            onClick={loadData} 
            className="w-fit px-3 py-1 bg-error text-white font-medium rounded text-xs hover:bg-opacity-90 transition-all"
          >
            Reintentar cargar datos
          </button>
        </div>
      ) : null}

      <section className="grid gap-gutter md:grid-cols-2 xl:grid-cols-3">
        {projectSummaries.map((project) => (
          <article key={project.id} className="rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Progreso del Proyecto</p>
                <h3 className="mt-1 text-headline-md font-headline-md text-on-surface">{project.name}</h3>
              </div>
              <span className="rounded-full bg-secondary-fixed px-3 py-1 text-label-md font-label-md text-on-secondary-fixed">{project.percentage}%</span>
            </div>

            <div className="mt-5 h-2 rounded-full bg-surface-container-high">
              <div className="h-2 rounded-full bg-secondary" style={{ width: `${project.percentage}%` }} />
            </div>

            <div className="mt-4 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
              <span>{project.completedTasks} finalizadas</span>
              <span>{project.totalTasks} totales</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-gutter xl:grid-cols-2">
        <article className="rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-md font-headline-md text-on-surface">Tareas Finalizadas</h3>
            <span className="text-body-sm font-body-sm text-on-surface-variant">Últimos 7 días</span>
          </div>
          <div className="space-y-3">
            {completedLast7Days.map((task) => (
              <div key={task.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-body-md font-body-md text-on-surface">{task.title}</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">{projectById[task.project_id]?.name || 'Proyecto sin nombre'}</p>
                  </div>
                  <StatusBadge status="finalizado" />
                </div>
                <p className="mt-2 text-label-md font-label-md text-on-surface-variant">Completada {formatDateTime(task.completed_at)}</p>
              </div>
            ))}
            {completedLast7Days.length === 0 ? <p className="text-body-sm font-body-sm text-on-surface-variant">Sin tareas finalizadas en la última semana.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-md font-headline-md text-on-surface">Tareas Pendientes/Vencidas</h3>
            <span className="rounded-full bg-error-container px-3 py-1 text-label-md font-label-md text-on-error-container">{overdueTasks.length}</span>
          </div>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-body-md font-body-md text-on-surface">{task.title}</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">{projectById[task.project_id]?.name || 'Proyecto sin nombre'}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <p className="mt-2 text-label-md font-label-md text-error">Vence {formatDate(task.due_date)}</p>
              </div>
            ))}
            {overdueTasks.length === 0 ? <p className="text-body-sm font-body-sm text-on-surface-variant">No hay tareas vencidas o pendientes fuera de fecha.</p> : null}
          </div>
        </article>
      </section>
    </div>
  )
}
