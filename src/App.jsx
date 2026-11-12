import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  getAll,
  getOutstandingBalances,
  getSettings,
  putSettings,
  save,
  seedProducts,
} from './services/db'
import {
  cloudEnabled,
  getCloudUser,
  subscribeToCloudChanges,
} from './services/supabase'
import Login from './pages/Login'
import Shell from './components/AppShell'

function App() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [invoices, setInvoices] = useState([])
  const [outstanding, setOutstanding] = useState({})
  const [settings, setSettings] = useState(getSettings)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState('')

  const notify = text => {
    setNotice(text)
    setTimeout(() => setNotice(''), 3500)
  }

  const loadData = async () => {
    let loadedProducts = await getAll('products')

    if (!loadedProducts.length && !localStorage.getItem('seh-seeded')) {
      for (const product of seedProducts) {
        await save('products', product)
      }
      localStorage.setItem('seh-seeded', 'yes')
      loadedProducts = await getAll('products')
    }

    const loadedCustomers = await getAll('customers')
    const loadedInvoices = await getAll('invoices')
    const loadedOutstanding = await getOutstandingBalances()

    return {
      products: loadedProducts.sort((a, b) => a.name.localeCompare(b.name)),
      customers: loadedCustomers.sort((a, b) => a.name.localeCompare(b.name)),
      invoices: loadedInvoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      outstanding: loadedOutstanding,
      settings: getSettings(),
    }
  }

  const applyData = data => {
    setProducts(data.products)
    setCustomers(data.customers)
    setInvoices(data.invoices)
    setOutstanding(data.outstanding)
    setSettings(data.settings)
    setReady(true)
  }

  const reload = async () => {
    applyData(await loadData())
  }

  useEffect(() => {
    let active = true

    const initialize = async () => {
      const data = await loadData()
      if (active) applyData(data)
    }

    initialize()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') reload()
    }

    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  useEffect(() => {
    if (!cloudEnabled || !ready) return undefined

    let active = true
    let unsubscribe = () => {}

    subscribeToCloudChanges(reload)
      .then(stop => {
        if (active) {
          unsubscribe = stop
        } else {
          stop()
        }
      })
      .catch(error => {
        console.error('Unable to subscribe to shared inventory updates.', error)
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [ready])

  const api = {
    products,
    customers,
    invoices,
    outstanding,
    settings,
    reload,
    notify,
    cloudEnabled,
    updateSettings: next => {
      putSettings(next)
      setSettings(next)
    },
  }

  if (!ready) {
    return <div className="loading">Loading your local shop data…</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login settings={settings} />} />
        <Route
          path="/*"
          element={
            <Protected settings={settings}>
              <Shell api={api} />
            </Protected>
          }
        />
      </Routes>
      {notice && <div className="toast">{notice}</div>}
    </BrowserRouter>
  )
}

function Protected({ settings, children }) {
  if (cloudEnabled) {
    return <CloudGate>{children}</CloudGate>
  }

  if (settings.pin && sessionStorage.getItem('seh-unlocked') !== 'yes') {
    return <Navigate to="/login" replace />
  }

  return children
}

function CloudGate({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let active = true

    getCloudUser()
      .then(currentUser => {
        if (active) setUser(currentUser)
      })
      .catch(error => {
        console.error('Unable to check the signed-in shop account.', error)
        if (active) setUser(null)
      })

    return () => {
      active = false
    }
  }, [])

  if (user === undefined) {
    return <div className="loading">Connecting to your shop…</div>
  }

  return user ? children : <Navigate to="/login" replace />
}

export default App
