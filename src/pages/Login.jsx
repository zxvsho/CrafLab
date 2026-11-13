import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { user, profile, profileLoading, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState('login')
 
  useEffect(() => {
    if (!user || !profile) return

    const role = profile.role ?? user.user_metadata?.role ?? user.app_metadata?.role

    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    } else if (role === 'teacher') {
      navigate('/teacher/grades', { replace: true })
    } else if (role === 'student') {
      navigate('/student/academic', { replace: true })
    }
  }, [navigate, profile, user])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'register') {
      const { error: signUpError } = await signUp(email, password, fullName)

      if (signUpError) {
        setError('No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.')
      } else {
        setSuccess('Cuenta creada. Si tu proyecto requiere confirmación de correo, revisa tu bandeja de entrada.')
        setMode('login')
      }

      setLoading(false)
      return
    }

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError('No se pudo iniciar sesión. Verifica tus credenciales y que tu perfil esté habilitado.')
    }

    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-margin-mobile text-on-surface md:px-margin-desktop md:py-margin-desktop">
      <section className="flex w-full max-w-[420px] flex-col gap-8 rounded-xl border border-outline-variant bg-surface p-8 shadow-[0px_2px_4px_rgba(30,58,95,0.05)] md:p-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              task_alt
            </span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-primary tracking-tight">GesTask</h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Portal de Gestión Académica</p>
        </header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-body-sm text-on-surface-variant" htmlFor="fullName">
                Nombre completo
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">badge</span>
                <input
                  id="fullName"
                  className="w-full rounded-md border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                  placeholder="Tu nombre y apellido"
                  required
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-body-sm text-on-surface-variant" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">mail</span>
              <input
                id="email"
                className="w-full rounded-md border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                placeholder="ejemplo@institucion.edu"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-body-sm font-body-sm text-on-surface-variant" htmlFor="password">
                Contraseña
              </label>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
              <input
                id="password"
                className="w-full rounded-md border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          {error ? <p className="rounded-lg bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">{error}</p> : null}
          {user && !profileLoading && !profile ? <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">Tu cuenta no tiene un perfil académico asignado. Solicita al administrador que habilite tu acceso.</p> : null}
          {user && !profileLoading && profile && !['admin', 'teacher', 'student'].includes(profile.role) ? <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-body-sm font-body-sm text-on-error-container">El rol de esta cuenta no está habilitado para el sistema académico.</p> : null}
          {success ? <p className="rounded-lg bg-secondary-fixed px-4 py-3 text-body-sm font-body-sm text-on-secondary-fixed">{success}</p> : null}

          <button
            className="mt-2 flex items-center justify-center gap-2 rounded-md bg-primary-container py-3 text-label-md font-label-md text-on-primary-container transition-colors hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            <span>{loading ? (mode === 'register' ? 'Creando cuenta...' : 'Ingresando...') : mode === 'register' ? 'Registrarse' : 'Iniciar sesión'}</span>
            <span className="material-symbols-outlined text-[18px]">{mode === 'register' ? 'person_add' : 'login'}</span>
          </button>
        </form>

        <button
          type="button"
          className="text-label-md font-label-md uppercase tracking-wider text-primary hover:text-primary-container"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'register' : 'login'))
            setError('')
            setSuccess('')
          }}
        >
          {mode === 'login' ? 'Crear cuenta' : 'Volver a iniciar sesión'}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-outline">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          <span className="text-label-md font-label-md uppercase tracking-wider">Acceso Seguro</span>
        </div>
      </section>
    </main>
  )
}