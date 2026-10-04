import { createClient } from '@supabase/supabase-js'

// Note: This should ONLY be used in server environments (Server Actions, API routes)
// where you need to bypass Row Level Security (RLS).
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
