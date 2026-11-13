import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ThemeSwitcher from '../components/layout/ThemeSwitcher'

export default function Login() {
  const navigate = useNavigate()
  const { user, profile, profileLoading, signIn, signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [lastName, setLastName] = useState('')
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
      const fullName = [username.trim(), lastName.trim()].filter(Boolean).join(' ')
      if (!username.trim()) {
        setError('El nombre de usuario es obligatorio.')
        setLoading(false)
        return
      }

      const { error: signUpError } = await signUp(email, password, fullName, username)

      if (signUpError) {
        setError('No se pudo crear la cuenta. El usuario puede estar ocupado o los datos no ser válidos.')
      } else {
        setSuccess('Cuenta creada con rol de estudiante. Ya puedes iniciar sesión con tu usuario y contraseña.')
        setMode('login')
      }

      setLoading(false)
      return
    }

    const { error: signInError } = await signIn(username, password)

    if (signInError) {
      setError('No se pudo iniciar sesión. Verifica tus credenciales y que tu perfil esté habilitado.')
    }

    setLoading(false)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-margin-mobile text-on-surface md:px-margin-desktop md:py-margin-desktop">
      <div className="fixed right-4 top-4 z-30">
        <ThemeSwitcher />
      </div>
      <section className="flex w-full max-w-[420px] flex-col gap-8 rounded-xl border border-outline-variant bg-surface p-8 shadow-[0px_2px_4px_rgba(30,58,95,0.05)] md:p-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              task_alt
            </span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-primary tracking-tight">CrafLab</h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Portal de Gestión Académica</p>
        </header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-body-sm text-on-surface-variant" htmlFor="username">
                  Nombre (usuario para iniciar sesión)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">person</span>
                  <input
                    id="username"
                    className="w-full rounded-md border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="ej. miguel95"
                    required
                    type="text"
                    autoComplete="username"
                    minLength={3}
                    maxLength={32}
                    pattern="[A-Za-z0-9._-]{3,32}"
                    title="Usa de 3 a 32 letras, números, puntos, guiones o guiones bajos."
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
                <p className="text-xs text-on-surface-variant">El mismo nombre se mostrará en tu perfil y servirá para iniciar sesión.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-body-sm text-on-surface-variant" htmlFor="lastName">
                  Apellido (opcional)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">badge</span>
                  <input
                    id="lastName"
                    className="w-full rounded-md border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    placeholder="Tu apellido"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}

          {mode === 'register' ? (
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
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-body-sm text-on-surface-variant" htmlFor="username">
                Nombre de usuario
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">person</span>
                <input
                  id="username"
                  className="w-full rounded-md border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                  placeholder="Tu nombre de usuario"
                  required
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
            </div>
          )}

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
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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