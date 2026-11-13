/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { supabase } from '../../lib/supabaseClient'
import { formatDate, getInitials, priorityLabel } from '../../lib/utils'

const emptyTaskForm = {
  title: '',
  description: '',
  priority: 'media',
  assigned_to: '',
  due_date: '',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [students, setStudents] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [assignStudentId, setAssignStudentId] = useState('')
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editForm, setEditForm] = useState(emptyTaskForm)
  const [savingEdit, setSavingEdit] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')

    const [{ data: projectData, error: projectError }, { data: membersData, error: membersError }, { data: tasksData, error: tasksError }, { data: studentsData, error: studentsError }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_members').select('*').eq('project_id', id),
      supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name', { ascending: true }),
    ])

    if (projectError || membersError || tasksError || studentsError) {
      setError(projectError?.message || membersError?.message || tasksError?.message || studentsError?.message || 'No se pudo cargar el proyecto.')
    }

    setProject(projectData ?? null)
    setMembers(membersData ?? [])
    setTasks(tasksData ?? [])
    setStudents(studentsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const memberIds = useMemo(() => members.map((member) => member.student_id), [members])
  const memberProfiles = useMemo(() => students.filter((student) => memberIds.includes(student.id)), [memberIds, students])
  const availableStudents = useMemo(() => students.filter((student) => !memberIds.includes(student.id)), [memberIds, students])
  const studentOptions = useMemo(() => memberProfiles.filter(Boolean), [memberProfiles])

  async function handleAssignStudent(event) {
    event.preventDefault()
    if (!assignStudentId) return

    setSaving(true)
    const { error: insertError } = await supabase.from('project_members').insert({ project_id: id, student_id: assignStudentId, role_in_project: 'miembro' })

    if (insertError) {
      setError(insertError.message)
    } else {
      setAssignOpen(false)
      setAssignStudentId('')
      loadData()
    }

    setSaving(false)
  }

  async function handleCreateTask(event) {
    event.preventDefault()
    setSaving(true)

    const payload = {
      project_id: id,
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      assigned_to: taskForm.assigned_to || null,
      due_date: taskForm.due_date || null,
      status: 'pendiente',
      created_by: null,
    }

    const { error: insertError } = await supabase.from('tasks').insert(payload)

    if (insertError) {
      setError(insertError.message)
    } else {
      setTaskOpen(false)
      setTaskForm(emptyTaskForm)
      loadData()
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">Cargando proyecto...</div>
  }

  if (!project) {
    return <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">Proyecto no encontrado.</div>
  }

  return (
    <div className="space-y-gutter">
      {error ? <div className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}

      <section className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)]">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <span className="rounded-full bg-surface-container px-3 py-1 text-label-md font-label-md text-on-surface-variant">{formatDate(project.deadline)}</span>
            </div>
            <div>
              <h2 className="text-headline-lg font-headline-lg text-on-surface">{project.name}</h2>
              <p className="mt-2 max-w-3xl text-body-md font-body-md text-on-surface-variant">{project.description || 'Sin descripción disponible.'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="rounded-lg border border-outline-variant px-4 py-3 text-label-md font-label-md text-on-surface-variant" onClick={() => setAssignOpen(true)}>
              Asignar estudiante
            </button>
            <button type="button" className="rounded-lg bg-primary-container px-4 py-3 text-label-md font-label-md text-on-primary-container" onClick={() => setTaskOpen(true)}>
              Nueva Tarea
            </button>
            <button type="button" className="rounded-lg bg-secondary px-4 py-3 text-label-md font-label-md text-on-secondary" onClick={() => navigate(`/admin/projects/${id}/kanban`)}>
              Ir al Kanban
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-gutter xl:grid-cols-12">
        <div className="rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)] xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-md font-headline-md text-on-surface">Estudiantes Asignados</h3>
            <span className="rounded-full bg-surface-container px-3 py-1 text-label-md font-label-md text-on-surface-variant">{memberProfiles.length}</span>
          </div>

          <div className="space-y-3">
            {memberProfiles.map((student) => (
              <article key={student.id} className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-label-md font-label-md text-on-primary-container">
                  {getInitials(student.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-body-sm text-on-surface">{student.full_name}</p>
                  <p className="truncate text-label-md font-label-md text-on-surface-variant">{student.email}</p>
                </div>
              </article>
            ))}
            {memberProfiles.length === 0 ? <p className="text-body-sm font-body-sm text-on-surface-variant">Todavía no hay estudiantes asignados.</p> : null}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_4px_rgba(30,58,95,0.05)] xl:col-span-8">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-headline-md font-headline-md text-on-surface">Tareas del Proyecto</h3>
            <span className="text-body-sm font-body-sm text-on-surface-variant">{tasks.length} tareas registradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-4 py-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Tarea</th>
                  <th className="px-4 py-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Prioridad</th>
                  <th className="px-4 py-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Asignado</th>
                  <th className="px-4 py-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Vencimiento</th>
                  <th className="px-4 py-3 text-right text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {tasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 text-body-sm font-body-sm text-on-surface">
                      <div className="space-y-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-on-surface-variant">{task.description || 'Sin descripción'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-body-sm font-body-sm text-on-surface-variant">{priorityLabel(task.priority)}</td>
                    <td className="px-4 py-4 text-body-sm font-body-sm text-on-surface-variant">{studentOptions.find((student) => student.id === task.assigned_to)?.full_name || 'Sin asignar'}</td>
                    <td className="px-4 py-4 text-body-sm font-body-sm text-on-surface-variant">{formatDate(task.due_date)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high" onClick={() => {
                          setEditingTask(task)
                          setEditForm({ title: task.title || '', description: task.description || '', priority: task.priority || 'media', assigned_to: task.assigned_to || '', due_date: task.due_date || '' })
                          setEditOpen(true)
                        }}>
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high" onClick={async () => {
                          if (!window.confirm(`Eliminar la tarea "${task.title}"?`)) return
                          const { error: deleteError } = await supabase.from('tasks').delete().eq('id', task.id)
                          if (deleteError) {
                            setError(deleteError.message)
                          } else {
                            loadData()
                          }
                        }}>
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Asignar estudiante">
        <form className="space-y-4" onSubmit={handleAssignStudent}>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Estudiante
            <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={assignStudentId} onChange={(event) => setAssignStudentId(event.target.value)}>
              <option value="">Selecciona un estudiante</option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-label-md text-on-surface-variant" onClick={() => setAssignOpen(false)}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary disabled:opacity-70">
              Asignar
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={taskOpen} onClose={() => setTaskOpen(false)} title="Nueva Tarea">
        <form className="space-y-4" onSubmit={handleCreateTask}>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Título
            <input className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} />
          </label>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Descripción
            <textarea className="min-h-24 rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
              Prioridad
              <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant md:col-span-2">
              Asignado a
              <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={taskForm.assigned_to} onChange={(event) => setTaskForm({ ...taskForm, assigned_to: event.target.value })}>
                <option value="">Sin asignar</option>
                {memberProfiles.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Fecha límite
            <input type="date" className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} />
          </label>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-label-md text-on-surface-variant" onClick={() => setTaskOpen(false)}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary disabled:opacity-70">
              Crear tarea
            </button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar Tarea">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault()
          if (!editingTask) return
          setSavingEdit(true)
          const payload = {
            title: editForm.title,
            description: editForm.description || null,
            priority: editForm.priority,
            assigned_to: editForm.assigned_to || null,
            due_date: editForm.due_date || null,
          }
          const { error: updateError } = await supabase.from('tasks').update(payload).eq('id', editingTask.id)
          if (updateError) {
            setError(updateError.message)
          } else {
            setEditOpen(false)
            setEditingTask(null)
            loadData()
          }
          setSavingEdit(false)
        }}>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Título
            <input className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" required value={editForm.title} onChange={(ev) => setEditForm({ ...editForm, title: ev.target.value })} />
          </label>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Descripción
            <textarea className="min-h-24 rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.description} onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })} />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
              Prioridad
              <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.priority} onChange={(ev) => setEditForm({ ...editForm, priority: ev.target.value })}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant md:col-span-2">
              Asignado a
              <select className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.assigned_to} onChange={(ev) => setEditForm({ ...editForm, assigned_to: ev.target.value })}>
                <option value="">Sin asignar</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Fecha límite
            <input type="date" className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-secondary focus:outline-none" value={editForm.due_date} onChange={(ev) => setEditForm({ ...editForm, due_date: ev.target.value })} />
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