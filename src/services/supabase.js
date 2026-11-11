import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const cloudEnabled = Boolean(url && key)
export const supabase = cloudEnabled ? createClient(url, key) : null

export async function getCloudUser() {
  if (!supabase) return null
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

export async function signInToCloud(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpForCloud(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signOutFromCloud() {
  if (supabase) await supabase.auth.signOut()
}
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
  if (error) throw error
}

export async function subscribeToCloudChanges(callback) {
  const user = await getCloudUser()
  if (!supabase || !user) return () => {}
  const channel = supabase.channel(`shop-data-${user.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `owner_id=eq.${user.id}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `owner_id=eq.${user.id}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `owner_id=eq.${user.id}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_ledger', filter: `owner_id=eq.${user.id}` }, callback).subscribe()
  return () => supabase.removeChannel(channel)
}
