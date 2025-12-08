'use client'

import React from 'react'
import { useAuth } from '../supabase/SupabaseAuthProvider'

// Keep in-memory session-scoped data (no auto-fetch). Update only via explicit refresh calls.
type PlanKey = 'free' | 'plus' | 'pro' | 'enterprise'

export interface ApiKeyItem {
  id: string
  prefix: string
  name?: string
  created_at?: string
  last_used_at?: string
  expires_at?: string | null
  revoked_at?: string | null
  scopes: string[]
  api_key?: string
  used_credits?: number
}

interface AccountDataContextValue {
  plan: PlanKey
  planLoading: boolean
  balance: number | null
  balanceLoading: boolean
  apiKeys: ApiKeyItem[]
  keysLoading: boolean
  // actions
  setPlanLocal: (p: PlanKey) => void
  refreshPlan: () => Promise<void>
  refreshBalance: () => Promise<void>
  refreshApiKeys: (force?: boolean) => Promise<void>
}

const AccountDataContext = React.createContext<AccountDataContextValue | null>(null)

export function AccountDataProvider({ children }: { children: React.ReactNode }) {
  const { session, supabase, getAccessToken, userId, isAuthReady } = useAuth()
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const [plan, setPlan] = React.useState<PlanKey>('free')
  const [planLoading, setPlanLoading] = React.useState(false)
  const [balance, setBalance] = React.useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = React.useState(false)
  const [apiKeys, setApiKeys] = React.useState<ApiKeyItem[]>([])
  const [keysLoading, setKeysLoading] = React.useState(false)
  const initializedRef = React.useRef(false)

  // Initialize plan from localStorage (no network)
  React.useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('dwr_active_plan') : null
      const mapped = raw === 'team' ? 'enterprise' : raw
      if (mapped === 'free' || mapped === 'plus' || mapped === 'pro' || mapped === 'enterprise') {
        setPlan(mapped)
      }
    } catch {}
  }, [])

  const setPlanLocal = React.useCallback((p: PlanKey) => {
    setPlan(p)
    try { localStorage.setItem('dwr_active_plan', p) } catch {}
  }, [])

  const refreshPlan = React.useCallback(async () => {
    try {
      setPlanLoading(true)
      if (!supabase || !session?.user?.id) return
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', session.user.id)
        .single()
      if (!error && data && typeof data.plan === 'string') {
        const rawPlan = data.plan as string
        const mapped: PlanKey =
          rawPlan === 'team' ? 'enterprise'
          : rawPlan === 'free' || rawPlan === 'plus' || rawPlan === 'pro' || rawPlan === 'enterprise'
            ? rawPlan
            : 'free'
        setPlan(mapped)
        try { localStorage.setItem('dwr_active_plan', mapped) } catch {}
      }
    } finally {
      setPlanLoading(false)
    }
  }, [supabase, session?.user?.id])

  const refreshBalance = React.useCallback(async () => {
    try {
      if (!session?.user?.id) return
      setBalanceLoading(true)
      const token = await getAccessToken()
      if (!token) return
      const res = await fetch(`${apiBase}/api/credits/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const raw = (data as Record<string, unknown>)?.['balance']
        const numeric = typeof raw === 'number' ? raw : (typeof raw === 'string' ? Number(raw) : NaN)
        setBalance(Number.isFinite(numeric) ? numeric : null)
      }
    } catch {
      // noop
    } finally {
      setBalanceLoading(false)
    }
  }, [apiBase, getAccessToken, session?.user?.id])

  const refreshApiKeys = React.useCallback(async () => {
    try {
      // Do not fetch keys when not logged in
      if (!session?.user?.id) return
      setKeysLoading(true)
      const token = await getAccessToken()
      if (!token) return
      const headers: Record<string, string> = {}
      headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${apiBase}/api/keys`, { headers })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { keys?: unknown }
      const serverKeys: ApiKeyItem[] = Array.isArray(data.keys) ? (data.keys as ApiKeyItem[]) : []
      setApiKeys(serverKeys)
    } catch {
      // noop
    } finally {
      setKeysLoading(false)
    }
  }, [apiBase, getAccessToken, session?.user?.id])

  // One-time initial load on first mount:
  // - Always refresh plan and balance once
  // - After plan resolves to a paid tier, load API keys once
  React.useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    Promise.resolve(refreshPlan()).catch(() => {})
    Promise.resolve(refreshBalance()).catch(() => {})
  }, [refreshPlan, refreshBalance])

  // When auth becomes ready and userId appears (first login or page load), ensure we fetch once
  React.useEffect(() => {
    if (!isAuthReady || !userId) return
    Promise.resolve(refreshPlan()).catch(() => {})
    Promise.resolve(refreshBalance()).catch(() => {})
  }, [isAuthReady, userId, refreshPlan, refreshBalance])

  const keysLoadAttemptedRef = React.useRef(false)
  React.useEffect(() => {
    // Load keys once for paid plans after auth is ready and user is known
    if (!initializedRef.current) return
    if (!isAuthReady || !userId) return
    if (keysLoadAttemptedRef.current) return
    const isPaid = plan === 'plus' || plan === 'pro' || plan === 'enterprise'
    if (isPaid) {
      keysLoadAttemptedRef.current = true
      Promise.resolve(refreshApiKeys()).catch(() => {})
    }
  }, [isAuthReady, userId, plan, refreshApiKeys])

  const value: AccountDataContextValue = {
    plan,
    planLoading,
    balance,
    balanceLoading,
    apiKeys,
    keysLoading,
    setPlanLocal,
    refreshPlan,
    refreshBalance,
    refreshApiKeys
  }

  return (
    <AccountDataContext.Provider value={value}>
      {children}
    </AccountDataContext.Provider>
  )
}

export function useAccountData(): AccountDataContextValue {
  const ctx = React.useContext(AccountDataContext)
  if (!ctx) throw new Error('useAccountData must be used within AccountDataProvider')
  return ctx
}


