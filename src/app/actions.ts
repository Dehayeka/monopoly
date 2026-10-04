'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const identifier = formData.get('identifier') as string
  const password = formData.get('password') as string

  let email = identifier
  
  // If identifier doesn't look like an email, assume it's a username and look up the email
  if (!identifier.includes('@')) {
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('user_id')
      .eq('username', identifier)
      .single()

    if (!profile) {
      return { error: 'Username atau password salah.' }
    }
    
    // We can't directly get the email, but Supabase auth requires email.
    // Wait, Supabase auth signInWithPassword requires email. 
    // We need to look up the email in auth.users, which requires admin access.
    const { data: userAuth } = await adminSupabase.auth.admin.getUserById(profile.user_id)
    if (!userAuth.user) {
       return { error: 'Username atau password salah.' }
    }
    email = userAuth.user.email!
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Username atau password salah.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard') // We will create this page later
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const displayName = formData.get('displayName') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Password tidak cocok.' }
  }

  // Check if username is taken
  const { data: existingUser } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { error: 'Username sudah digunakan.' }
  }

  // Sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Create profile bypassing RLS
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        username,
        display_name: displayName,
        role: 'PLAYER'
      })

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(data.user.id)
      return { error: 'Gagal membuat profil pengguna.' }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
