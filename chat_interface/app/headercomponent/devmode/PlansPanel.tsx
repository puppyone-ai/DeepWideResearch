'use client'

import React from 'react'
import { useAuth } from '../../supabase/SupabaseAuthProvider'
import { PRIMARY_BUTTON_COLORS, getPrimaryButtonStyle } from './primaryButtonStyles'
import ContactSalesPanel from './ContactSalesPanel'

export default function PlansPanel() {
  const { session, supabase, getAccessToken } = useAuth()
  const [activePlan, setActivePlan] = React.useState<'free' | 'plus' | 'pro' | 'enterprise'>('free')
  const [showContactSales, setShowContactSales] = React.useState(false)

  const productId15 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_15
  const productId100 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_100
  const productIdsJson = process.env.NEXT_PUBLIC_POLAR_PRODUCT_IDS_JSON
  const parsedProductIds = React.useMemo<Record<string, string> | null>(() => {
    try {
      return productIdsJson ? JSON.parse(productIdsJson) : null
    } catch {
      return null
    }
  }, [productIdsJson])
  const resolvedProductId15 = productId15 || parsedProductIds?.['15'] || parsedProductIds?.['plus'] || parsedProductIds?.['PLUS'] || null
  const resolvedProductId100 = productId100 || parsedProductIds?.['100'] || parsedProductIds?.['pro'] || parsedProductIds?.['PRO'] || null
  const canBuyPlus = !!resolvedProductId15
  const canBuyPro = !!resolvedProductId100
  const plusButtonDisabled = !canBuyPlus
  const proButtonDisabled = !canBuyPro
  const plusBaseBackground = plusButtonDisabled ? PRIMARY_BUTTON_COLORS.disabled : PRIMARY_BUTTON_COLORS.base
  const proBaseBackground = proButtonDisabled ? PRIMARY_BUTTON_COLORS.disabled : PRIMARY_BUTTON_COLORS.base
  const contactBaseBackground = 'transparent'
  const contactHoverBackground = 'rgba(59,130,246,0.12)'

  React.useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('dwr_active_plan') : null
      if (saved === 'team') {
        setActivePlan('enterprise')
      } else if (saved === 'free' || saved === 'plus' || saved === 'pro' || saved === 'enterprise') {
        setActivePlan(saved)
      }
    } catch {}
  }, [])

  const fetchPlan = React.useCallback(async () => {
    try {
      if (!supabase || !session?.user?.id) return
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', session.user.id)
        .single()
      if (!error && data && typeof data.plan === 'string') {
        const rawPlan = data.plan as string
        const mappedPlan = rawPlan === 'team' ? 'enterprise' : rawPlan
        if (mappedPlan === 'free' || mappedPlan === 'plus' || mappedPlan === 'pro' || mappedPlan === 'enterprise') {
          setActivePlan(mappedPlan)
          try { localStorage.setItem('dwr_active_plan', mappedPlan) } catch {}
        }
      }
    } catch (e) {
      console.warn('Failed to load plan', e)
    }
  }, [supabase, session?.user?.id])

  const gotoCheckout = React.useCallback((productId?: string | null, planKey?: 'plus' | 'pro') => {
    let url = '/api/polar/checkout'
    const pid = productId
    if (!pid) {
      alert('Billing not configured: missing product id')
      return
    }
    const q = url.includes('?') ? '&' : '?'
    url = `${url}${q}products=${encodeURIComponent(pid)}`
    const email = session?.user?.email
    if (email) {
      url += `&customerEmail=${encodeURIComponent(email)}`
    }
    const userId = session?.user?.id
    if (userId) {
      url += `&metadata.user_id=${encodeURIComponent(userId)}`
      url += `&metadata[user_id]=${encodeURIComponent(userId)}`
      url += `&metadata[supabase_user_id]=${encodeURIComponent(userId)}`
      try {
        const metaObj: Record<string, string> = { user_id: userId }
        if (planKey) metaObj.plan = planKey
        url += `&metadata=${encodeURIComponent(JSON.stringify(metaObj))}`
      } catch {}
    }
    if (planKey) {
      url += `&metadata.plan=${encodeURIComponent(planKey)}`
      url += `&metadata[plan]=${encodeURIComponent(planKey)}`
    }
    try {
      const successUrl = `${window.location.origin}/?success=1`
      url += `&success_url=${encodeURIComponent(successUrl)}`
    } catch {}
    if (planKey) {
      try { localStorage.setItem('dwr_pending_plan', planKey) } catch {}
    }
    try {
      window.location.href = url
    } catch {
      try { window.open(url, '_blank', 'noopener') } catch {}
    }
  }, [session?.user?.email, session?.user?.id])

  // Prefer server-side upgrade flow (handles existing subscriptions) and fallback to Next route
  const paymentsApiBase = React.useMemo(() => {
    const base =
      (process.env.NEXT_PUBLIC_PAYMENTS_API_URL || process.env.NEXT_PUBLIC_API_URL || '').trim()
    return base.endsWith('/') ? base.slice(0, -1) : base
  }, [])

  const startPurchaseOrUpgrade = React.useCallback(
    async (target: 'plus' | 'pro', productId?: string | null) => {
      try {
        const token = await getAccessToken()
        if (paymentsApiBase && token) {
          const resp = await fetch(`${paymentsApiBase}/api/polar/upgrade`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ target }),
          })
          type UpgradeResponse = { checkout_url?: string; mode?: string }
          const data = (await resp.json().catch(() => ({}))) as UpgradeResponse
          if (resp.ok) {
            if ((data.checkout_url || data.mode === 'checkout')) {
              try { localStorage.setItem('dwr_pending_plan', target) } catch {}
              if (data.checkout_url) {
                window.location.href = String(data.checkout_url)
              } else {
                gotoCheckout(productId, target)
              }
              return
            }
            // Direct upgrade (no checkout needed)
            try { localStorage.setItem('dwr_active_plan', target) } catch {}
            alert(target === 'pro' ? '已升级到 Pro 计划' : '已切换到 Plus 计划')
            await fetchPlan()
            return
          }
        }
      } catch {}
      // Fallback to Next.js adapter route
      gotoCheckout(productId, target)
    },
    [paymentsApiBase, getAccessToken, gotoCheckout, fetchPlan, activePlan]
  )

  React.useEffect(() => {
    fetchPlan().catch(() => {})
  }, [fetchPlan])

  return (
    <div className='space-y-4'>
      <div>
        <div className='text-[12px] font-semibold text-[#9CA3AF] mb-2'>All plans</div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          <div className='border border-white/20 bg-black/20 p-4 md:p-5 flex flex-col relative rounded-xl'>
            {activePlan==='free' && (<div className='absolute top-0 right-0 bg-[#2CAC58] px-2 py-0.5 text-[10px] font-bold text-white rounded-bl-md'>Current</div>)}
            <div className='text-[16px] font-semibold text-foreground/90 mb-1'>Free</div>
            <div className='mt-1 mb-4'>
              <span className='text-[22px] font-bold text-foreground/90'>$0</span>
              <span className='text-[12px] text-foreground/50 ml-1'>/ month</span>
            </div>
            <div className='space-y-2 text-[12px] text-foreground/70 mb-4 flex-grow'>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <div>
                  <div><strong className='text-[#4599DF]'>100</strong> <span className='text-foreground/90'>credits</span> per month</div>
                  <div className='text-[10px] text-foreground/50 mt-0.5'>≈ 5 full deep wide researches</div>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <span>Community support</span>
              </div>
            </div>
          </div>

          <div className='border border-white/20 bg-black/20 p-4 md:p-5 flex flex-col relative rounded-xl'>
            {activePlan==='plus' && (<div className='absolute top-0 right-0 bg-[#2CAC58] px-2 py-0.5 text-[10px] font-bold text-white rounded-bl-md'>Current</div>)}
            <div className='text-[16px] font-semibold text-foreground/90 mb-1'>Plus</div>
            <div className='mt-1 mb-4'>
              <span className='text-[22px] font-bold text-foreground/90'>$15</span>
              <span className='text-[12px] text-foreground/50 ml-1'>/ month</span>
            </div>
            <div className='space-y-2 text-[12px] text-foreground/70 mb-4 flex-grow'>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <div>
                  <div><strong className='text-[#4599DF]'>2,000</strong> <span className='text-foreground/90'>credits</span> per month</div>
                  <div className='text-[10px] text-foreground/50 mt-0.5'>≈ 100 full deep wide researches</div>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <span>API & SDK access</span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <span>Priority support</span>
              </div>
            </div>
            {(activePlan !== 'plus' && activePlan !== 'pro' && activePlan !== 'enterprise') && (
              <button
                type='button'
                onClick={() => startPurchaseOrUpgrade('plus', resolvedProductId15)}
                disabled={plusButtonDisabled}
                style={getPrimaryButtonStyle({ disabled: plusButtonDisabled, fullWidth: true })}
                onMouseEnter={(e) => {
                  if (plusButtonDisabled) return
                  e.currentTarget.style.background = PRIMARY_BUTTON_COLORS.hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = plusBaseBackground
                }}
              >
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M12 19V5M5 12l7-7 7 7'/>
                </svg>
                <span>{plusButtonDisabled ? 'Configure' : 'Choose Plan'}</span>
              </button>
            )}
          </div>

          <div className='border border-white/20 bg-black/20 p-4 md:p-5 flex flex-col relative rounded-xl'>
            {activePlan==='pro' && (<div className='absolute top-0 right-0 bg-[#2CAC58] px-2 py-0.5 text-[10px] font-bold text-white rounded-bl-md'>Current</div>)}
            <div className='text-[16px] font-semibold text-foreground/90 mb-1'>Pro</div>
            <div className='mt-1 mb-4'>
              <span className='text-[22px] font-bold text-foreground/90'>$100</span>
              <span className='text-[12px] text-foreground/50 ml-1'>/ month</span>
            </div>
            <div className='space-y-2 text-[12px] text-foreground/70 mb-4 flex-grow'>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <div>
                  <div><strong className='text-[#4599DF]'>15,000</strong> <span className='text-foreground/90'>credits</span> per month</div>
                  <div className='text-[10px] text-foreground/50 mt-0.5'>≈ 750 full deep wide researches</div>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <span>API & SDK access</span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <span>Dedicated support</span>
              </div>
            </div>
            {(activePlan !== 'pro' && activePlan !== 'enterprise') && (
              <button
                type='button'
                onClick={() => startPurchaseOrUpgrade('pro', resolvedProductId100)}
                disabled={proButtonDisabled}
                style={getPrimaryButtonStyle({ disabled: proButtonDisabled, fullWidth: true })}
                onMouseEnter={(e) => {
                  if (proButtonDisabled) return
                  e.currentTarget.style.background = PRIMARY_BUTTON_COLORS.hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = proBaseBackground
                }}
              >
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M12 19V5M5 12l7-7 7 7'/>
                </svg>
                <span>{proButtonDisabled ? 'Configure' : 'Choose Plan'}</span>
              </button>
            )}
          </div>

          <div className='border border-white/20 bg-black/20 p-4 md:p-5 flex flex-col relative rounded-xl'>
            {activePlan==='enterprise' && (<div className='absolute top-0 right-0 bg-[#2CAC58] px-2 py-0.5 text-[10px] font-bold text-white rounded-bl-md'>Current</div>)}
            <div className='text-[16px] font-semibold text-foreground/90 mb-2'>Enterprise</div>
            <div className='mt-1 mb-4'>
              <span className='text-[18px] font-bold text-foreground/90'>Custom</span>
            </div>
            <div className='space-y-2 text-[12px] text-foreground/70 mb-4 flex-grow'>
              <div className='flex items-start gap-2'>
                <span className='text-[#2CAC58]'>[✓]</span>
                <div>
                  <div><strong className='text-[#4599DF]'>Unlimited</strong> <span className='text-foreground/90'>credits</span></div>
                  <div className='text-[10px] text-foreground/50 mt-0.5'>≈ Unlimited full deep wide researches</div>
                </div>
              </div>
              <div className='flex items-start gap-2'><span className='text-[#2CAC58]'>[✓]</span><span>API & SDK access</span></div>
              <div className='flex items-start gap-2'><span className='text-[#2CAC58]'>[✓]</span><span>24/7 dedicated support</span></div>
              <div className='flex items-start gap-2'><span className='text-[#2CAC58]'>[✓]</span><span>Custom integrations</span></div>
              <div className='flex items-start gap-2'><span className='text-[#2CAC58]'>[✓]</span><span>SLA & compliance</span></div>
            </div>
            <button
              type='button'
              onClick={() => setShowContactSales(true)}
              style={getPrimaryButtonStyle({ fullWidth: true, variant: 'ghost' })}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = contactHoverBackground
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = contactBaseBackground
              }}
            >
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M12 19V5M5 12l7-7 7 7'/>
              </svg>
              <span>Contact Sales</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contact Sales Modal */}
      <ContactSalesPanel 
        open={showContactSales} 
        onClose={() => setShowContactSales(false)} 
      />
    </div>
  )
}

