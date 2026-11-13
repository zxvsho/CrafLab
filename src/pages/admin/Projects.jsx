/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import ProjectCard from '../../components/ui/ProjectCard'
import { supabase } from '../../lib/supabaseClient'

const emptyForm = {
  name: '',
  description: '',
  deadline: '',
  status: 'pendiente',
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
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

    const [{ data: projectsData, error: projectsError }, { data: membersData, error: membersError }, { data: tasksData, error: tasksError }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('project_members').select('*'),
      supabase.from('tasks').select('*'),
    ])

    if (projectsError || membersError || tasksError) {
      setError(projectsError?.message || membersError?.message || tasksError?.message || 'No se pudieron cargar los proyectos.')
    }

    setProjects(projectsData ?? [])
    setMembers(membersData ?? [])
    setTasks(tasksData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const membersByProject = useMemo(() => {
    return members.reduce((accumulator, member) => {
      accumulator[member.project_id] = (accumulator[member.project_id] ?? 0) + 1
      return accumulator
    }, {})
  }, [members])

  const tasksByProject = useMemo(() => {
    return tasks.reduce((accumulator, task) => {
      accumulator[task.project_id] = (accumulator[task.project_id] ?? 0) + 1
      return accumulator
    }, {})
  }, [tasks])

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
          <h2 className="text-headline-lg font-headline-lg text-on-surface">Proyectos</h2>
          <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Gestión completa de proyectos académicos.</p>
        </div>
        <button type="button" className="rounded-lg bg-primary px-4 py-3 text-label-md font-label-md text-on-primary shadow-sm" onClick={openCreateModal}>
          Nuevo Proyecto
        </button>
      </div>

      {error ? <div className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}

      {loading ? (
        <div className="grid gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <div className="grid gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              membersCount={membersByProject[project.id] ?? 0}
              tasksCount={tasksByProject[project.id] ?? 0}
              onClick={() => navigate(`/admin/projects/${project.id}`)}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
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