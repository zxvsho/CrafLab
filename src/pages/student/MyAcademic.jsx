import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'

export default function MyAcademic() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [grades, setGrades] = useState([])
  const [groupById, setGroupById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadAcademicData() {
      setLoading(true)
      setError('')
      const { data: student, error: studentError } = await supabase.from('students').select('id').eq('profile_id', user.id).maybeSingle()
      if (studentError || !student) {
        if (active) {
          setError(studentError?.message ?? 'Tu cuenta aún no está vinculada a un registro de estudiante. Contacta al administrador.')
          setLoading(false)
        }
        return
      }

      const [enrollmentResult, gradeResult] = await Promise.all([
        supabase.from('enrollments').select('id, group_id, status, enrolled_at').eq('student_id', student.id).order('enrolled_at', { ascending: false }),
        supabase.from('grades').select('id, group_id, score, comments, updated_at').eq('student_id', student.id).order('updated_at', { ascending: false }),
      ])
      const failed = enrollmentResult.error ?? gradeResult.error
      if (failed) {
        if (active) setError(failed.message)
      } else {
        const allEnrollments = enrollmentResult.data ?? []
        const allGrades = gradeResult.data ?? []
        const groupIds = [...new Set([...allEnrollments.map((item) => item.group_id), ...allGrades.map((item) => item.group_id)])]
        const { data: groups, error: groupsError } = groupIds.length
          ? await supabase.from('groups').select('id, name, academic_year, subjects(name, code)').in('id', groupIds)
          : { data: [], error: null }
        if (groupsError) {
          if (active) setError(groupsError.message)
        } else if (active) {
          setEnrollments(allEnrollments)
          setGrades(allGrades)
          setGroupById(Object.fromEntries((groups ?? []).map((group) => [group.id, group])))
        }
      }
      if (active) setLoading(false)
    }

    loadAcademicData()
    return () => { active = false }
  }, [user.id])

  if (loading) return <p className="rounded-xl border border-outline-variant bg-surface p-6 text-on-surface-variant">Cargando tu información académica...</p>

  return (
    <section className="space-y-gutter">
      <header>
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Mi información académica</h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">Consulta tus matrículas, asignaturas y calificaciones.</p>
      </header>
      {error ? <div role="alert" className="rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</div> : null}

      <section className="space-y-4">
        <h3 className="text-headline-md font-headline-md text-on-surface">Mis matrículas y asignaturas</h3>
        {enrollments.map((enrollment) => {
          const group = groupById[enrollment.group_id]
          return (
            <article key={enrollment.id} className="rounded-xl border border-outline-variant bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-body-md font-body-md font-semibold text-on-surface">{group?.subjects?.name ?? 'Asignatura'}</h4>
                  <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">{group?.name ?? 'Grupo'} · {group?.academic_year ?? ''}</p>
                </div>
                <span className="rounded-full bg-secondary-fixed px-3 py-1 text-label-md font-label-md text-on-secondary-fixed">{enrollment.status === 'active' ? 'Activa' : 'Retirada'}</span>
              </div>
            </article>
          )
        })}
        {enrollments.length === 0 ? <p className="rounded-xl border border-outline-variant bg-surface p-5 text-on-surface-variant">No tienes matrículas activas.</p> : null}
      </section>

      <section className="space-y-4">
        <h3 className="text-headline-md font-headline-md text-on-surface">Mis calificaciones</h3>
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-5 py-3 text-label-md font-label-md text-on-surface-variant">Asignatura y grupo</th>
                <th className="px-5 py-3 text-label-md font-label-md text-on-surface-variant">Calificación</th>
                <th className="px-5 py-3 text-label-md font-label-md text-on-surface-variant">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td className="px-5 py-3 text-body-sm font-body-sm text-on-surface">{groupById[grade.group_id]?.subjects?.name ?? 'Asignatura'} · {groupById[grade.group_id]?.name ?? 'Grupo'}</td>
                  <td className="px-5 py-3 text-body-sm font-body-sm text-on-surface">{grade.score}</td>
                  <td className="px-5 py-3 text-body-sm font-body-sm text-on-surface-variant">{grade.comments ?? '—'}</td>
                </tr>
              ))}
              {grades.length === 0 ? <tr><td className="px-5 py-8 text-center text-body-sm font-body-sm text-on-surface-variant" colSpan="3">Aún no tienes calificaciones registradas.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
