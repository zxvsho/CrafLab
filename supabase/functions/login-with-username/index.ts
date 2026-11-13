import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, string>, status: number) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Falta configuración de Supabase para el inicio por usuario.')
    return jsonResponse({ error: 'El inicio por nombre de usuario no está configurado.' }, 500)
  }

  let credentials: { username?: unknown; password?: unknown }
  try {
    credentials = await request.json()
  } catch {
    return jsonResponse({ error: 'Solicitud inválida.' }, 400)
  }

  const rawUsername = typeof credentials.username === 'string' ? credentials.username : ''
  const username = rawUsername
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const password = credentials.password

  if (!/^[a-z0-9._-]{3,80}$/.test(username) || typeof password !== 'string' || password.length === 0) {
    return jsonResponse({ error: 'Usuario o contraseña incorrectos.' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('email')
    .eq('username', username)
    .maybeSingle()

  if (profileError) {
    console.error('No se pudo resolver el usuario para iniciar sesión:', profileError.message)
    return jsonResponse({ error: 'No se pudo completar el inicio de sesión.' }, 500)
  }
  if (!profile?.email) {
    return jsonResponse({ error: 'Usuario o contraseña incorrectos.' }, 401)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await authClient.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (error || !data.session) {
    return jsonResponse({ error: 'Usuario o contraseña incorrectos.' }, 401)
  }

  return jsonResponse({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  }, 200)
})
