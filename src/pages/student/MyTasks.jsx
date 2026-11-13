/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { formatDate, statusToSelectClass } from '../../lib/utils'
import Modal from '../../components/ui/Modal'

export default function MyTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingUpdates, setPendingUpdates] = useState({})
  const [editOpen, setEditOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'media', due_date: '', status: 'pendiente' })
  const [savingEdit, setSavingEdit] = useState(false)

  async function loadData() {
    if (!user?.id) return

    setLoading(true)
    setError('')

    const [{ data: tasksData, error: tasksError }, { data: projectsData, error: projectsError }] = await Promise.all([
      supabase.from('tasks').select('*').eq('assigned_to', user.id).order('due_date', { ascending: true }),
      supabase.from('projects').select('id, name'),
    ])

    if (tasksError || projectsError) {
      setError(tasksError?.message || projectsError?.message || 'No se pudieron cargar tus tareas.')
    }

    setTasks(tasksData ?? [])
    setProjects(projectsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const projectById = useMemo(() => projects.reduce((accumulator, project) => ({ ...accumulator, [project.id]: project }), {}), [projects])

  if (!user) {
    return <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">Cargando sesión...</div>
  }

  async function handleStatusChange(task, nextStatus) {
    const previousStatus = task.status
    setPendingUpdates((current) => ({ ...current, [task.id]: true }))

    setTasks((currentTasks) => currentTasks.map((currentTask) => (currentTask.id === task.id ? { ...currentTask, status: nextStatus } : currentTask)))

    const { error: updateError } = await supabase.from('tasks').update({ status: nextStatus, completed_at: nextStatus === 'finalizado' ? new Date().toISOString() : null }).eq('id', task.id)

    if (updateError) {
      setTasks((currentTasks) => currentTasks.map((currentTask) => (currentTask.id === task.id ? { ...currentTask, status: previousStatus } : currentTask)))
      setError(updateError.message)
    }

    setPendingUpdates((current) => {
      const next = { ...current }
      delete next[task.id]
      return next
    })
  }

  function openEdit(task) {
    setEditingTask(task)
    setEditForm({ title: task.title || '', description: task.description || '', priority: task.priority || 'media', due_date: task.due_date || '', status: task.status || 'pendiente' })
    setEditOpen(true)
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    if (!editingTask) return
    setSavingEdit(true)
    const payload = {
      title: editForm.title,
      description: editForm.description || null,
      priority: editForm.priority,
      due_date: editForm.due_date || null,
      status: editForm.status,
    }

    const { error: updateError } = await supabase.from('tasks').update(payload).eq('id', editingTask.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setTasks((current) => current.map((t) => (t.id === editingTask.id ? { ...t, ...payload } : t)))
      setEditOpen(false)
      setEditingTask(null)
    }

    setSavingEdit(false)
  }

  async function handleDelete(task) {
    if (!window.confirm(`Eliminar la tarea "${task.title}"?`)) return
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', task.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setTasks((current) => current.filter((t) => t.id !== task.id))
  }

  if (loading) {
    return <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">Cargando tus tareas...</div>
  }

  return (
    <div className="space-y-gutter">
      <div>
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Mis Tareas</h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Actualiza el estado de tus tareas al instante.</p>
      </div>

      {error ? <div className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}

      <div className="space-y-4">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">{projectById[task.project_id]?.name || 'Proyecto sin nombre'}</p>
                <h3 className="text-headline-md font-headline-md text-on-surface">{task.title}</h3>
                <p className="max-w-3xl text-body-sm font-body-sm text-on-surface-variant">{task.description || 'Sin descripción'}</p>
              </div>

              <div className="flex flex-col gap-3 md:min-w-[240px] md:items-end">
                <StatusBadge status={task.status} />
                <p className="text-body-sm font-body-sm text-on-surface-variant">Fecha de vencimiento: {formatDate(task.due_date)}</p>
                <select
                  className={`rounded-md border px-4 py-3 text-label-md font-label-md transition-colors ${statusToSelectClass(task.status)}`}
                  disabled={pendingUpdates[task.id]}
                  value={task.status}
                  onChange={(event) => handleStatusChange(task, event.target.value)}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="finalizado">Finalizado</option>
                </select>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="rounded-md border px-3 py-2 text-label-md font-label-md text-on-surface-variant" onClick={() => openEdit(task)}>
                    Editar
                  </button>
                  <button type="button" className="rounded-md border px-3 py-2 text-label-md font-label-md text-on-surface-variant" onClick={() => handleDelete(task)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {tasks.length === 0 ? <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">No tienes tareas asignadas por ahora.</div> : null}

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar Tarea">
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Título
            <input className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </label>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Descripción
            <textarea className="min-h-24 rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
              Prioridad
              <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant md:col-span-2">
              Estado
              <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Fecha límite
            <input type="date" className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
          </label>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-label-md text-on-surface-variant" onClick={() => setEditOpen(false)}>
              Cancelar
            </button>
            <button type="submit" disabled={savingEdit} className="rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary disabled:opacity-70">
              {savingEdit ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}