import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.")
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables.")
  }

  // Basic JWT format check for the anon key
  if (!supabaseKey.startsWith("eyJ")) {
    console.error("Invalid Supabase API key format. The anon key should be a valid JWT starting with 'eyJ'.")
    throw new Error("Invalid Supabase API key format. The anon key should be a valid JWT starting with 'eyJ'. Please check your Supabase Project Settings > API.")
  }

  const client = createBrowserClient(supabaseUrl, supabaseKey)
  
  // Test the client connection asynchronously
  client.auth.getSession().catch(err => {
    console.error("Failed to verify Supabase connection on startup:", err)
  })

  return client
}
