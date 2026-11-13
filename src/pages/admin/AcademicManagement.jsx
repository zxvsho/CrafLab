/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { supabase } from '../../lib/supabaseClient'

const resources = {
  students: {
    title: 'Estudiantes',
    table: 'students',
    search: ['student_code', 'full_name', 'email'],
    fields: [
      { key: 'student_code', label: 'Código estudiantil', required: true },
      { key: 'full_name', label: 'Nombre completo', required: true },
      { key: 'email', label: 'Correo', type: 'email', required: true },
      { key: 'profile_id', label: 'Cuenta de acceso', reference: 'profiles:student', optional: true },
    ],
    columns: ['student_code', 'full_name', 'email'],
  },
  teachers: {
    title: 'Profesores',
    table: 'teachers',
    search: ['staff_code', 'full_name', 'email'],
    fields: [
      { key: 'staff_code', label: 'Código docente', required: true },
      { key: 'full_name', label: 'Nombre completo', required: true },
      { key: 'email', label: 'Correo', type: 'email', required: true },
      { key: 'profile_id', label: 'Cuenta de acceso', reference: 'profiles:teacher', optional: true },
    ],
    columns: ['staff_code', 'full_name', 'email'],
  },
  subjects: {
    title: 'Asignaturas',
    table: 'subjects',
    search: ['code', 'name'],
    fields: [
      { key: 'code', label: 'Código', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'credits', label: 'Créditos', type: 'number', required: true, min: 1, max: 30 },
    ],
    columns: ['code', 'name', 'credits'],
  },
  groups: {
    title: 'Grupos',
    table: 'groups',
    search: ['name', 'academic_year'],
    fields: [
      { key: 'name', label: 'Nombre del grupo', required: true },
      { key: 'academic_year', label: 'Periodo académico', required: true },
      { key: 'subject_id', label: 'Asignatura', reference: 'subjects', required: true },
      { key: 'teacher_id', label: 'Profesor', reference: 'teachers', required: true },
    ],
    columns: ['name', 'academic_year', 'subject_id', 'teacher_id'],
  },
  enrollments: {
    title: 'Matrículas',
    table: 'enrollments',
    search: ['status'],
    fields: [
      { key: 'student_id', label: 'Estudiante', reference: 'students', required: true },
      { key: 'group_id', label: 'Grupo', reference: 'groups', required: true },
      { key: 'status', label: 'Estado', type: 'select', options: [['active', 'Activa'], ['withdrawn', 'Retirada']], required: true },
      { key: 'enrolled_at', label: 'Fecha de matrícula', type: 'date', required: true },
    ],
    columns: ['student_id', 'group_id', 'status', 'enrolled_at'],
  },
  grades: {
    title: 'Calificaciones',
    table: 'grades',
    search: ['comments'],
    fields: [
      { key: 'student_id', label: 'Estudiante matriculado', reference: 'students', required: true },
      { key: 'group_id', label: 'Grupo', reference: 'groups', required: true },
      { key: 'score', label: 'Calificación (0–100)', type: 'number', required: true, min: 0, max: 100, step: 0.01 },
      { key: 'comments', label: 'Observaciones', type: 'textarea', optional: true },
    ],
    columns: ['student_id', 'group_id', 'score', 'comments'],
  },
}

function getLabel(record) {
  return record.full_name || record.name || record.student_code || record.staff_code || record.code || record.id
}

function initialValues(fields) {
  return Object.fromEntries(fields.map(({ key, type, options }) => [
    key,
    type === 'date' ? new Date().toISOString().slice(0, 10) : options?.[0]?.[0] ?? '',
  ]))
}

export default function AcademicManagement({ resource }) {
  const config = resources[resource]
  const [records, setRecords] = useState([])
  const [references, setReferences] = useState({})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(() => initialValues(config.fields))

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    const refTables = [...new Set(config.fields.map((field) => field.reference?.split(':')[0]).filter(Boolean))]
    const requests = [
      supabase.from(config.table).select('*'),
      ...refTables.map((table) => supabase.from(table).select('*')),
    ]
    const results = await Promise.all(requests)
    const failed = results.find((result) => result.error)
    if (failed) {
      setError(failed.error.message)
      setRecords([])
      setReferences({})
    } else {
      setRecords(results[0].data ?? [])
      setReferences(Object.fromEntries(refTables.map((table, index) => [table, results[index + 1].data ?? []])))
    }
    setLoading(false)
  }, [config])

  useEffect(() => {
    loadData()
  }, [loadData])

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return records
    return records.filter((record) => config.search.some((key) => String(record[key] ?? '').toLocaleLowerCase().includes(normalizedQuery)))
  }, [config, query, records])

  function displayValue(key, value) {
    if (value == null || value === '') return '—'
    const field = config.fields.find((item) => item.key === key)
    if (field?.reference) {
      const table = field.reference.split(':')[0]
      return getLabel((references[table] ?? []).find((item) => item.id === value) ?? {})
    }
    if (key === 'status') return value === 'active' ? 'Activa' : value === 'withdrawn' ? 'Retirada' : value
    return value
  }

  function openCreate() {
    setEditing(null)
    setForm(initialValues(config.fields))
    setModalOpen(true)
  }

  function openEdit(record) {
    setEditing(record)
    setForm(Object.fromEntries(config.fields.map(({ key }) => [key, record[key] ?? ''])))
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = Object.fromEntries(config.fields.map(({ key, type, optional }) => {
      const value = form[key]
      return [key, value === '' && optional ? null : type === 'number' ? Number(value) : value]
    }))
    const result = editing
      ? await supabase.from(config.table).update(payload).eq('id', editing.id)
      : await supabase.from(config.table).insert(payload)
    if (result.error) {
      setError(result.error.message)
    } else {
      setModalOpen(false)
      await loadData()
    }
    setSaving(false)
  }

  async function handleDelete(record) {
    if (!window.confirm(`¿Eliminar este registro de ${config.title.toLocaleLowerCase()}?`)) return
    const { error: deleteError } = await supabase.from(config.table).delete().eq('id', record.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await loadData()
  }

  return (
    <section className="space-y-gutter">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface">{config.title}</h2>
          <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Consulta, filtra y administra los registros académicos.</p>
        </div>
        <button type="button" className="rounded-lg bg-primary px-4 py-3 text-label-md font-label-md text-on-primary" onClick={openCreate}>
          Crear registro
        </button>
      </header>

      <label className="block max-w-lg">
        <span className="sr-only">Buscar {config.title.toLocaleLowerCase()}</span>
        <input className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface" placeholder={`Buscar ${config.title.toLocaleLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      {error ? <div role="alert" className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}
      {loading ? <p className="rounded-xl border border-outline-variant bg-surface p-6 text-on-surface-variant">Cargando...</p> : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr>
                {config.columns.map((key) => <th key={key} className="px-5 py-3 text-label-md font-label-md text-on-surface-variant">{config.fields.find((field) => field.key === key)?.label}</th>)}
                <th className="px-5 py-3 text-right text-label-md font-label-md text-on-surface-variant">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visibleRecords.map((record) => (
                <tr key={record.id}>
                  {config.columns.map((key) => <td key={key} className="px-5 py-3 text-body-sm font-body-sm text-on-surface">{displayValue(key, record[key])}</td>)}
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="mr-3 text-secondary hover:underline" onClick={() => openEdit(record)}>Editar</button>
                    <button type="button" className="text-error hover:underline" onClick={() => handleDelete(record)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {visibleRecords.length === 0 ? <tr><td className="px-5 py-8 text-center text-body-sm font-body-sm text-on-surface-variant" colSpan={config.columns.length + 1}>No hay registros que coincidan con la búsqueda.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Editar' : 'Crear'} ${config.title.slice(0, -1)}`}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {config.fields.map((field) => {
            const referenceParts = field.reference?.split(':')
            const referenceTable = referenceParts?.[0]
            const options = (references[referenceTable] ?? []).filter((item) => !referenceParts?.[1] || item.role === referenceParts[1])
            return (
              <label key={field.key} className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
                {field.label}
                {field.reference ? (
                  <select required={field.required} className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={form[field.key]} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                    <option value="">{field.optional ? 'Sin cuenta vinculada' : 'Selecciona una opción'}</option>
                    {options.map((option) => <option key={option.id} value={option.id}>{getLabel(option)}</option>)}
                  </select>
                ) : field.options ? (
                  <select required={field.required} className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={form[field.key]} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                    {field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea className="min-h-24 rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={form[field.key]} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : (
                  <input type={field.type ?? 'text'} min={field.min} max={field.max} step={field.step} required={field.required} className="rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={form[field.key]} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
                )}
              </label>
            )
          })}
          {error ? <p role="alert" className="text-body-sm font-body-sm text-error">{error}</p> : null}
          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button type="button" className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-label-md" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary disabled:opacity-70">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
