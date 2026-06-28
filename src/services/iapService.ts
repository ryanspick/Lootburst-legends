// IAP service — bridges frontend purchase flow to the Stripe backend.
//
// Flow:
//   1. call initiatePurchase(productId)
//   2. backend creates a Stripe Checkout session and returns sessionUrl
//   3. user is redirected to Stripe-hosted checkout page
//   4. on success Stripe redirects to /?iap_session=<sessionId>&product=<productId>
//   5. App.tsx detects the query params and calls verifySession()
//   6. backend verifies the session with Stripe and returns { gems, gold }
//   7. caller grants gems/gold via gameStore

const API_BASE = import.meta.env.VITE_IAP_API ?? 'http://localhost:3001'

export interface IAPSession {
  sessionId: string
  sessionUrl: string
}

export interface IAPVerifyResult {
  ok: boolean
  gems?: number
  gold?: number
  productId?: string
  error?: string
}

export interface IAPPurchaseError {
  code: 'network' | 'server' | 'cancelled' | 'unconfigured'
  message: string
}

export async function createCheckoutSession(productId: string): Promise<IAPSession> {
  const res = await fetch(`${API_BASE}/api/iap/create-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<IAPSession>
}

export async function verifySession(sessionId: string): Promise<IAPVerifyResult> {
  const res = await fetch(`${API_BASE}/api/iap/verify/${sessionId}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    return { ok: false, error: body.error ?? `HTTP ${res.status}` }
  }
  return res.json() as Promise<IAPVerifyResult>
}

// Check URL params on app load — call this once in App.tsx on mount.
// Returns the verified result if this is a Stripe redirect-back, otherwise null.
export async function handleIAPRedirect(): Promise<IAPVerifyResult | null> {
  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('iap_session')
  if (!sessionId) return null

  // Clean up URL so the params don't persist on refresh
  const cleanUrl = window.location.pathname + (window.location.hash || '')
  window.history.replaceState({}, '', cleanUrl)

  return verifySession(sessionId)
}

// Initiate a purchase — redirects away from the app to Stripe Checkout.
// On return, handleIAPRedirect() will pick up the result.
export async function initiatePurchase(productId: string): Promise<void> {
  const session = await createCheckoutSession(productId)
  window.location.href = session.sessionUrl
}

// Check if the IAP backend is reachable.
export async function checkIAPHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}
