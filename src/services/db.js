import { openDB } from 'idb'
import defaultLogo from '../assets/star-electrical-logo.jpg'
import defaultSignature from '../assets/authorised-signature-transparent.png'
import { cloudEnabled, getCloudUser, supabase } from './supabase'

const DB_NAME = 'star-electrical-local'
const STORES = ['products', 'customers', 'invoices']

const db = () => openDB(DB_NAME, 1, {
  upgrade(database) {
    STORES.forEach((store) => { if (!database.objectStoreNames.contains(store)) database.createObjectStore(store, { keyPath: 'id' }) })
  },
})

const localGetAll = async store => (await db()).getAll(store)
const localSave = async (store, value) => (await db()).put(store, value)
const localRemove = async (store, id) => (await db()).delete(store, id)
const cloudUser = async () => cloudEnabled ? getCloudUser() : null
const cloudError = (error, action) => { if (error) throw new Error(`Cloud ${action} failed: ${error.message}`) }

export const getAll = async (store) => {
  const user = await cloudUser()
  if (!user) return localGetAll(store)
  const { data, error } = await supabase.from('shop_records').select('payload').eq('store', store).order('updated_at', { ascending: false })
  cloudError(error, 'load')
  return data.map(row => row.payload)
}
export const save = async (store, value) => {
  const user = await cloudUser()
  if (!user) return localSave(store, value)
  const { error } = await supabase.from('shop_records').upsert({ owner_id: user.id, store, record_id: value.id, payload: value, updated_at: new Date().toISOString() }, { onConflict: 'owner_id,store,record_id' })
  cloudError(error, 'save')
}
export const remove = async (store, id) => {
  const user = await cloudUser()
  if (!user) return localRemove(store, id)
  const { error } = await supabase.from('shop_records').delete().eq('store', store).eq('record_id', id)
  cloudError(error, 'delete')
}
export const replaceAll = async (store, values) => {
  const user = await cloudUser()
  if (user) {
    const { error: removeError } = await supabase.from('shop_records').delete().eq('store', store)
    cloudError(removeError, 'replace')
    if (values.length) {
      const { error } = await supabase.from('shop_records').insert(values.map(value => ({ owner_id: user.id, store, record_id: value.id, payload: value })))
      cloudError(error, 'replace')
    }
    return
  }
  const database = await db(); const tx = database.transaction(store, 'readwrite')
  await tx.store.clear(); for (const value of values) await tx.store.put(value); await tx.done
}
export const clearAll = async () => { const database = await db(); const tx = database.transaction(STORES, 'readwrite'); for (const s of STORES) await tx.objectStore(s).clear(); await tx.done }

export const migrateLocalDataToCloud = async () => {
  const user = await cloudUser()
  if (!user) throw new Error('Sign in before uploading local data.')
  for (const store of STORES) {
    const values = await localGetAll(store)
    if (values.length) {
      const { error } = await supabase.from('shop_records').upsert(values.map(value => ({ owner_id: user.id, store, record_id: value.id, payload: value, updated_at: new Date().toISOString() })), { onConflict: 'owner_id,store,record_id' })
      cloudError(error, 'migration')
    }
  }
}

export const defaults = {
  name: 'STAR ELECTRICAL HAZARIBAGH', address: 'Opp. Patna House, Pugmil, Hazaribagh, Jharkhand, 825301', mobile: '6207295457',
  invoicePrefix: 'SEH-', nextInvoice: 1, invoiceType: 'Bill of Supply', terms: 'Goods once sold will not be taken back or exchanged.',
  lowStockThreshold: 5, storeMetadata: true, pin: '', logo: defaultLogo, signature: defaultSignature, signatureAssetVersion: 2
}
export const getSettings = () => {
  const stored = JSON.parse(localStorage.getItem('seh-settings') || '{}')
  // Replace the original black-background bundled JPG saved by earlier versions.
  // New user-uploaded assets remain untouched once this version has been saved.
  const signature = stored.signatureAssetVersion === 2 && stored.signature ? stored.signature : defaultSignature
  return { ...defaults, ...stored, signature, signatureAssetVersion: 2 }
}
export const putSettings = (settings) => localStorage.setItem('seh-settings', JSON.stringify(settings))

export const seedProducts = [
  ['1.5MM LOCAL WIRE', 'Wire', 'WIRE-15', 'Local', 'MTR', 18, 120], ['2.5MM COPPER WIRE', 'Wire', 'WIRE-25', 'Copper', 'MTR', 35, 90],
  ['10A SP C MCB REO', 'MCB', 'MCB-10A', 'REO', 'PCS', 180, 18], ['LED BULB', 'Lighting', 'LED-09W', 'Generic', 'PCS', 95, 40],
  ['SWITCH', 'Switches', 'SW-6A', 'Generic', 'PCS', 65, 45], ['SOCKET', 'Switches', 'SOCK-6A', 'Generic', 'PCS', 75, 30],
  ['FAN', 'Fans', 'FAN-1200', 'Generic', 'PCS', 1450, 8], ['PVC PIPE', 'Conduit', 'PVC-25', 'Generic', 'MTR', 52, 100],
  ['ELECTRICAL TAPE', 'Accessories', 'TAPE-01', 'Generic', 'PCS', 20, 55], ['DISTRIBUTION BOARD', 'DB', 'DB-04', 'Generic', 'PCS', 850, 10],
].map(([name, category, sku, brand, unit, sellingPrice, stock]) => ({ id: crypto.randomUUID(), name, category, sku, brand, unit, purchasePrice: '', sellingPrice, gst: 0, stock, lowStock: 5, description: '', createdAt: new Date().toISOString() }))
