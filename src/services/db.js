import { openDB } from 'idb'
import defaultLogo from '../assets/star-electrical-logo.jpg'
import defaultSignature from '../assets/authorised-signature-transparent.png'

const DB_NAME = 'star-electrical-local'
const STORES = ['products', 'customers', 'invoices']

const db = () => openDB(DB_NAME, 1, {
  upgrade(database) {
    STORES.forEach((store) => { if (!database.objectStoreNames.contains(store)) database.createObjectStore(store, { keyPath: 'id' }) })
  },
})

export const getAll = async (store) => (await db()).getAll(store)
export const save = async (store, value) => (await db()).put(store, value)
export const remove = async (store, id) => (await db()).delete(store, id)
export const replaceAll = async (store, values) => {
  const database = await db(); const tx = database.transaction(store, 'readwrite')
  await tx.store.clear(); for (const value of values) await tx.store.put(value); await tx.done
}
export const clearAll = async () => { const database = await db(); const tx = database.transaction(STORES, 'readwrite'); for (const s of STORES) await tx.objectStore(s).clear(); await tx.done }

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
