import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Warning: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables. Using placeholder to prevent build crash.");
  }

  // Basic JWT format check for the anon key
  if (supabaseKey && !supabaseKey.startsWith("eyJ") && supabaseKey !== 'placeholder') {
    console.warn("Warning: Invalid Supabase API key format. The anon key should be a valid JWT starting with 'eyJ'.");
  }

  const client = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
  )
  
  // Test the client connection asynchronously
  client.auth.getSession().catch(err => {
    console.error("Failed to verify Supabase connection on startup:", err)
  })

  return client
}
