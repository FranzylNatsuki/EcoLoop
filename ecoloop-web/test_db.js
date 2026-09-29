import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSelect() {
  const { data, error } = await supabase.rpc('query', { sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'' })
  console.log(data || error)
}

testSelect()
