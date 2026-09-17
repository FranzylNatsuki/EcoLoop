import { createClient, type Session } from '@supabase/supabase-js'
import { ref } from 'vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const currentUserSession = ref<Session | null>(null)

export const initializeAuth = async () => {
  const { data } = await supabase.auth.getSession()
  currentUserSession.value = data.session

  console.log('Initial Session Load:', currentUserSession.value)

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUserSession.value = session
    console.log(`Auth Event [${_event}]:`, session)
  })
}
