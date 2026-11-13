import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const profileRequest = useRef(0)

  const loadProfile = useCallback(async (sessionUser) => {
    const requestId = ++profileRequest.current
    if (!sessionUser) {
      if (requestId === profileRequest.current) {
        setProfile(null)
        setProfileLoading(false)
      }
      return null
    }

    setProfileLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()

    if (requestId !== profileRequest.current) return null

    if (error) {
      console.error('No se pudo cargar el perfil del usuario:', error.message)
    }

    setProfile(data ?? null)
    setProfileLoading(false)
    return data ?? null
  }, [])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!mounted) return

      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)

      setLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setTimeout(() => {
        void loadProfile(session?.user ?? null)
      }, 0)
    })

    bootstrap()

    return () => {
      mounted = false
      profileRequest.current += 1
      subscription.unsubscribe()
    }
  }, [loadProfile])

  async function signIn(username, password) {
    const { data, error: loginError } = await supabase.functions.invoke('login-with-username', {
      body: { username, password },
    })
    if (loginError) return { error: loginError }
    if (!data?.access_token || !data?.refresh_token) {
      return { error: new Error('El servidor devolvió una respuesta de inicio de sesión inválida.') }
    }

    const { error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    return { error }
  }

  async function signUp(email, password, fullName, username) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username.trim().toLowerCase(),
        },
      },
    })

    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    return loadProfile(user)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
