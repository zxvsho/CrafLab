import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,    // Guarda el token en el almacenamiento local del navegador
    autoRefreshToken: true,  // Renueva el token en segundo plano ANTES de que expire
    detectSessionInUrl: true // Detecta enlaces de autenticación si usas correos o proveedores
  }
})
