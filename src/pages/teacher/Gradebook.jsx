/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'

export default function TeacherGradebook() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [studentId, setStudentId] = useState('')
  const [score, setScore] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: teacher, error: teacherError } = await supabase.from('teachers').select('id').eq('profile_id', user.id).maybeSingle()
    if (teacherError || !teacher) {
      setError(teacherError?.message ?? 'Tu cuenta no está vinculada a un perfil docente. Contacta al administrador.')
      setGroups([])
      setLoading(false)
      return
    }

    const { data, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, academic_year, subjects(name, code)')
      .eq('teacher_id', teacher.id)
      .order('name')
    if (groupsError) {
      setError(groupsError.message)
      setGroups([])
    } else {
      setGroups(data ?? [])
      setSelectedGroup((current) => data?.some((group) => group.id === current) ? current : data?.[0]?.id ?? '')
    }
    setLoading(false)
  }, [user.id])

  const loadGroupRecords = useCallback(async () => {
    if (!selectedGroup) {
      setStudents([])
      setGrades([])
      return
    }
    setError('')
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('group_id', selectedGroup)
      .eq('status', 'active')
    if (enrollmentError) {
      setError(enrollmentError.message)
      return
    }
    const ids = (enrollments ?? []).map((enrollment) => enrollment.student_id)
    const [studentsResult, gradesResult] = await Promise.all([
      ids.length ? supabase.from('students').select('id, student_code, full_name').in('id', ids).order('full_name') : Promise.resolve({ data: [], error: null }),
      supabase.from('grades').select('*').eq('group_id', selectedGroup).order('updated_at', { ascending: false }),
    ])
    if (studentsResult.error || gradesResult.error) {
      setError(studentsResult.error?.message ?? gradesResult.error?.message)
      return
    }
    setStudents(studentsResult.data ?? [])
    setGrades(gradesResult.data ?? [])
    setStudentId((current) => ids.includes(current) ? current : ids[0] ?? '')
  }, [selectedGroup])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    loadGroupRecords()
  }, [loadGroupRecords])

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])

  function editGrade(grade) {
    setStudentId(grade.student_id)
    setScore(String(grade.score))
    setComments(grade.comments ?? '')
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!selectedGroup || !studentId) return
    setSaving(true)
    setError('')
    setNotice('')
    const { error: saveError } = await supabase.from('grades').upsert({
      group_id: selectedGroup,
      student_id: studentId,
      score: Number(score),
      comments: comments.trim() || null,
    }, { onConflict: 'group_id,student_id' })

    if (saveError) {
      setError(saveError.message)
    } else {
      setNotice('Calificación guardada.')
      setScore('')
      setComments('')
      await loadGroupRecords()
    }
    setSaving(false)
  }

  const activeGroup = groups.find((group) => group.id === selectedGroup)

  return (
    <section className="space-y-gutter">
      <header>
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Mis grupos y calificaciones</h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Consulta las matrículas de tus grupos y registra sus notas.</p>
      </header>

      {error ? <div role="alert" className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}
      {notice ? <div role="status" className="rounded-lg bg-secondary-fixed px-4 py-3 text-body-sm font-body-sm text-on-secondary-fixed">{notice}</div> : null}
      {loading ? <p className="rounded-xl border border-outline-variant bg-surface p-6 text-on-surface-variant">Cargando tus grupos...</p> : (
        <>
          <label className="flex max-w-xl flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
            Grupo asignado
            <select className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name} — {group.subjects?.name ?? 'Asignatura'} ({group.academic_year})</option>)}
            </select>
          </label>

          {!selectedGroup ? <p className="rounded-xl border border-outline-variant bg-surface p-6 text-on-surface-variant">No tienes grupos asignados.</p> : (
            <>
              <section className="rounded-xl border border-outline-variant bg-surface p-5">
                <h3 className="text-headline-md font-headline-md text-on-surface">{activeGroup?.name} · {activeGroup?.subjects?.name}</h3>
                <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">Periodo {activeGroup?.academic_year} · {students.length} estudiantes matriculados</p>
              </section>

              <form className="grid gap-4 rounded-xl border border-outline-variant bg-surface p-5 md:grid-cols-[2fr_1fr_2fr_auto] md:items-end" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
                  Estudiante
                  <select required className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                    {students.map((student) => <option key={student.id} value={student.id}>{student.full_name} ({student.student_code})</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
                  Nota (0–100)
                  <input required type="number" min="0" max="100" step="0.01" className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={score} onChange={(event) => setScore(event.target.value)} />
                </label>
                <label className="flex flex-col gap-2 text-body-sm font-body-sm text-on-surface-variant">
                  Observaciones
                  <input className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface" value={comments} onChange={(event) => setComments(event.target.value)} />
                </label>
                <button disabled={saving || !studentId} className="rounded-lg bg-primary px-4 py-3 text-label-md font-label-md text-on-primary disabled:opacity-70" type="submit">{saving ? 'Guardando...' : 'Guardar nota'}</button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-5 py-3 text-label-md font-label-md text-on-surface-variant">Estudiante</th>
                      <th className="px-5 py-3 text-label-md font-label-md text-on-surface-variant">Calificación</th>
                      <th className="px-5 py-3 text-label-md font-label-md text-on-surface-variant">Observaciones</th>
                      <th className="px-5 py-3 text-right text-label-md font-label-md text-on-surface-variant">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {grades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-5 py-3 text-body-sm font-body-sm text-on-surface">{studentById.get(grade.student_id)?.full_name ?? 'Estudiante'}</td>
                        <td className="px-5 py-3 text-body-sm font-body-sm text-on-surface">{grade.score}</td>
                        <td className="px-5 py-3 text-body-sm font-body-sm text-on-surface-variant">{grade.comments ?? '—'}</td>
                        <td className="px-5 py-3 text-right"><button type="button" className="text-secondary hover:underline" onClick={() => editGrade(grade)}>Editar</button></td>
                      </tr>
                    ))}
                    {grades.length === 0 ? <tr><td className="px-5 py-8 text-center text-body-sm font-body-sm text-on-surface-variant" colSpan="4">Todavía no hay calificaciones para este grupo.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
