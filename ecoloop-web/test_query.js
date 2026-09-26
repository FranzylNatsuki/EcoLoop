import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf-8')
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key + '='))?.split('=')[1]

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'))

async function test() {
  const { data, error } = await supabase
    .from('events')
    .select(`id, materials_needed`)
    .eq('id', '9c644057-7620-4689-9d96-61081a5aa992')
    .single()
  
  console.log("Data:", JSON.stringify(data, null, 2))
  console.log("Error:", error)
}

test()
