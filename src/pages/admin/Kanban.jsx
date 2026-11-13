/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import KanbanColumn from '../../components/ui/KanbanColumn'
import Modal from '../../components/ui/Modal'
import TaskCard from '../../components/ui/TaskCard'
import { supabase } from '../../lib/supabaseClient'

const emptyTaskForm = {
  title: '',
  description: '',
  priority: 'media',
  assigned_to: '',
  due_date: '',
}

function SortableTaskItem({ task, projectName, assignedName }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  return (
    <TaskCard
      task={task}
      projectName={projectName}
      assignedName={assignedName}
      dragAttributes={attributes}
      dragListeners={listeners}
      dragRef={setNodeRef}
      dragStyle={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
    />
  )
}

export default function Kanban() {
  const { id } = useParams()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [saving, setSaving] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')

    const [{ data: projectData, error: projectError }, { data: tasksData, error: tasksError }, { data: membersData, error: membersError }, { data: studentsData, error: studentsError }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('project_members').select('*').eq('project_id', id),
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name', { ascending: true }),
    ])

    if (projectError || tasksError || membersError || studentsError) {
      setError(projectError?.message || tasksError?.message || membersError?.message || studentsError?.message || 'No se pudo cargar el tablero Kanban.')
    }

    setProject(projectData ?? null)
    setTasks(tasksData ?? [])
    setMembers(membersData ?? [])
    setStudents(studentsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const memberIds = useMemo(() => members.map((member) => member.student_id), [members])
  const memberProfiles = useMemo(() => students.filter((student) => memberIds.includes(student.id)), [memberIds, students])
  const taskById = useMemo(() => tasks.reduce((accumulator, task) => ({ ...accumulator, [task.id]: task }), {}), [tasks])
  const taskIdsByStatus = useMemo(
    () => ({
      pendiente: tasks.filter((task) => task.status === 'pendiente').map((task) => task.id),
      en_proceso: tasks.filter((task) => task.status === 'en_proceso').map((task) => task.id),
      finalizado: tasks.filter((task) => task.status === 'finalizado').map((task) => task.id),
    }),
    [tasks],
  )

  function openTaskModal() {
    setTaskForm(emptyTaskForm)
    setTaskOpen(true)
  }

  async function handleCreateTask(event) {
    event.preventDefault()
    setSaving(true)

    const { error: insertError } = await supabase.from('tasks').insert({
      project_id: id,
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      assigned_to: taskForm.assigned_to || null,
      due_date: taskForm.due_date || null,
      status: 'pendiente',
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setTaskOpen(false)
      setTaskForm(emptyTaskForm)
      loadData()
    }

    setSaving(false)
  }

  async function handleDragStart({ active }) {
    setActiveTaskId(active.id)
  }

  async function handleDragEnd({ active, over }) {
    setActiveTaskId(null)

    if (!over) return

    const activeTask = taskById[active.id]
    const nextStatus = over.data.current?.status || taskById[over.id]?.status

    if (!activeTask || !nextStatus || activeTask.status === nextStatus) return

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === activeTask.id
          ? { ...task, status: nextStatus, completed_at: nextStatus === 'finalizado' ? new Date().toISOString() : null }
          : task,
      ),
    )

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: nextStatus, completed_at: nextStatus === 'finalizado' ? new Date().toISOString() : null })
      .eq('id', activeTask.id)

    if (updateError) {
      setError(updateError.message)
      loadData()
    }
  }

  const activeTask = activeTaskId ? taskById[activeTaskId] : null

  if (loading) {
    return <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">Cargando Kanban...</div>
  }

  if (!project) {
    return <div className="rounded-xl border border-outline-variant bg-surface p-6 text-body-sm font-body-sm text-on-surface-variant">Proyecto no encontrado.</div>
  }

  return (
    <div className="space-y-gutter">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface">Kanban del Proyecto</h2>
          <p className="mt-1 text-body-md font-body-md text-on-surface-variant">{project.name}</p>
        </div>
        <button type="button" className="rounded-lg bg-primary px-4 py-3 text-label-md font-label-md text-on-primary" onClick={openTaskModal}>
          Nueva Tarea
        </button>
      </div>

      {error ? <div className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-gutter xl:grid-cols-3">
          {['pendiente', 'en_proceso', 'finalizado'].map((status) => (
            <KanbanColumn key={status} status={status} count={taskIdsByStatus[status].length}>
              <SortableContext items={taskIdsByStatus[status]} strategy={verticalListSortingStrategy}>
                {tasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      projectName={project.name}
                      assignedName={memberProfiles.find((student) => student.id === task.assigned_to)?.full_name || 'Sin asignar'}
                    />
                  ))}
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
        {activeTask ? <div className="sr-only">Arrastrando {activeTask.title}</div> : null}
      </DndContext>

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
    </div>
  )
}