/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { supabase } from '../../lib/supabaseClient'
import { formatDate } from '../../lib/utils'

const emptyForm = {
  name: '',
  description: '',
  deadline: '',
  status: 'pendiente',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')

    const [{ data: projectsData, error: projectsError }, { data: tasksData, error: tasksError }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    ])

    if (projectsError || tasksError) {
      setError(projectsError?.message || tasksError?.message || 'No se pudieron cargar los datos del tablero.')
    }

    setProjects(projectsData ?? [])
    setTasks(tasksData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const metrics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'finalizado').length
    const pending = tasks.filter((task) => task.status === 'pendiente').length

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completed,
      pending,
    }
  }, [projects, tasks])

  const recentProjects = useMemo(() => projects.slice(0, 5), [projects])

  function openCreateModal() {
    setEditingProject(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditModal(project) {
    setEditingProject(project)
    setForm({
      name: project.name ?? '',
      description: project.description ?? '',
      deadline: project.deadline ?? '',
      status: project.status ?? 'pendiente',
    })
    setModalOpen(true)
  }

  async function handleDelete(project) {
    if (!window.confirm(`Eliminar el proyecto "${project.name}"?`)) return

    const { error: deleteError } = await supabase.from('projects').delete().eq('id', project.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    loadData()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      description: form.description,
      deadline: form.deadline || null,
      status: form.status,
    }

    const response = editingProject
      ? await supabase.from('projects').update(payload).eq('id', editingProject.id)
      : await supabase.from('projects').insert(payload)

    if (response.error) {
      setError(response.error.message)
    } else {
      setModalOpen(false)
      setEditingProject(null)
      setForm(emptyForm)
      loadData()
    }

    setSaving(false)
  }

  return (
    <div className="space-y-gutter">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface">Resumen del Tablero</h2>
          <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Monitorea el progreso de proyectos y la distribución de tareas.</p>
        </div>
          <button
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-label-md font-label-md text-on-primary shadow-sm transition-shadow hover:shadow-md"
          type="button"
          onClick={openCreateModal}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {error ? <div className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}

      {loading ? (
        <div className="grid gap-gutter md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="folder_copy" label="Total de proyectos" value={metrics.totalProjects} note="Proyectos activos" />
            <StatCard icon="task" label="Total de tareas" value={metrics.totalTasks} accentClass="bg-surface-container-highest text-on-surface" />
            <StatCard icon="check_circle" label="Tareas completadas" value={metrics.completed} accentClass="bg-secondary/20 text-secondary" note={`${metrics.totalTasks ? Math.round((metrics.completed / metrics.totalTasks) * 100) : 0}% del total`} />
            <StatCard icon="pending_actions" label="Tareas pendientes" value={metrics.pending} accentClass="bg-tertiary-container/20 text-on-tertiary-container" note="Requieren atención" />
          </div>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-[0px_2px_4px_rgba(30,58,95,0.05)]">
            <div className="flex items-center justify-between border-b border-outline-variant p-6">
              <h3 className="text-headline-md font-headline-md text-on-surface">Proyectos Recientes</h3>
              <button type="button" className="text-label-md font-label-md text-secondary hover:underline" onClick={() => navigate('/admin/projects')}>
                Ver todos
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Nombre del proyecto</th>
                    <th className="px-6 py-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Estado</th>
                    <th className="px-6 py-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Fecha</th>
                    <th className="px-6 py-3 text-right text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-surface">
                  {recentProjects.map((project) => (
                    <tr key={project.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 text-body-sm font-body-sm font-medium text-on-surface">{project.name}</td>
                      <td className="px-6 py-4 text-body-sm font-body-sm text-on-surface-variant"><StatusBadge status={project.status} /></td>
                      <td className="px-6 py-4 text-body-sm font-body-sm text-on-surface-variant">{formatDate(project.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high" onClick={() => openEditModal(project)}>
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high" onClick={() => handleDelete(project)}>
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
              Nombre
              <input className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
              Fecha límite
              <input type="date" className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Descripción
            <textarea className="min-h-28 rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>

          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Estado
            <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </label>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-label-md text-on-surface-variant" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary disabled:opacity-70">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}