import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'

const PORT = process.env.PORT ?? 3001
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? ''
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

if (!STRIPE_SECRET) {
  console.error('[IAP] STRIPE_SECRET_KEY not set — payment routes will fail')
}

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' })
const app = express()

app.use(cors({ origin: APP_URL }))

// Raw body needed for Stripe webhook signature verification
app.use('/api/iap/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

// ── Product catalogue ──────────────────────────────────────────────────────────
// Maps product IDs used in the frontend to their gem amounts.
// Create matching products + prices in your Stripe dashboard and put the
// price_xxx IDs here.
interface IAPProduct {
  gems: number
  gold?: number
  stripePriceId: string
}

const PRODUCTS: Record<string, IAPProduct> = {
  // Starter packs
  starter_bronze:  { gems: 80,   gold: 500,   stripePriceId: process.env.PRICE_STARTER_BRONZE  ?? '' },
  starter_silver:  { gems: 300,  gold: 1_500,  stripePriceId: process.env.PRICE_STARTER_SILVER  ?? '' },
  starter_gold:    { gems: 800,  gold: 5_000,  stripePriceId: process.env.PRICE_STARTER_GOLD    ?? '' },
  // Gem packs
  gems_80:         { gems: 80,               stripePriceId: process.env.PRICE_GEMS_80          ?? '' },
  gems_500:        { gems: 550,              stripePriceId: process.env.PRICE_GEMS_500         ?? '' },
  gems_1200:       { gems: 1_500,            stripePriceId: process.env.PRICE_GEMS_1200        ?? '' },
  gems_2500:       { gems: 3_500,            stripePriceId: process.env.PRICE_GEMS_2500        ?? '' },
  // Bundles
  bundle_rift:     { gems: 200,  gold: 3_000, stripePriceId: process.env.PRICE_BUNDLE_RIFT     ?? '' },
  bundle_hero:     { gems: 500,  gold: 5_000, stripePriceId: process.env.PRICE_BUNDLE_HERO     ?? '' },
}

// ── POST /api/iap/create-session ────────────────────────────────────────────────
// Body: { productId: string }
// Returns: { sessionId: string, sessionUrl: string }
app.post('/api/iap/create-session', async (req, res) => {
  const { productId } = req.body as { productId?: string }

  if (!productId || !PRODUCTS[productId]) {
    res.status(400).json({ error: 'Invalid productId' })
    return
  }

  const product = PRODUCTS[productId]

  if (!product.stripePriceId) {
    res.status(503).json({ error: 'Stripe price not configured for this product' })
    return
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      success_url: `${APP_URL}/?iap_session={CHECKOUT_SESSION_ID}&product=${productId}`,
      cancel_url:  `${APP_URL}/?iap_cancelled=1`,
      metadata: { productId, gems: String(product.gems), gold: String(product.gold ?? 0) },
    })

    res.json({ sessionId: session.id, sessionUrl: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[IAP] create-session error:', msg)
    res.status(500).json({ error: msg })
  }
})

// ── GET /api/iap/verify/:sessionId ─────────────────────────────────────────────
// Called by the client after redirect back; verifies payment was completed.
// Returns: { ok: boolean, gems: number, gold: number }
app.get('/api/iap/verify/:sessionId', async (req, res) => {
  const { sessionId } = req.params

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      res.status(402).json({ ok: false, reason: 'unpaid' })
      return
    }

    const gems = Number(session.metadata?.gems ?? 0)
    const gold = Number(session.metadata?.gold ?? 0)
    res.json({ ok: true, gems, gold, productId: session.metadata?.productId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[IAP] verify error:', msg)
    res.status(500).json({ ok: false, error: msg })
  }
})

// ── POST /api/iap/webhook ───────────────────────────────────────────────────────
// Stripe sends payment events here. Validate signature then fulfil.
// For server-side fulfillment (e.g., persistent DB grants), handle here.
app.post('/api/iap/webhook', (req, res) => {
  if (!WEBHOOK_SECRET) {
    console.warn('[IAP] Webhook secret not set — skipping signature verification')
    res.json({ received: true })
    return
  }

  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[IAP] Webhook signature verification failed:', msg)
    res.status(400).json({ error: msg })
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const gems = Number(session.metadata?.gems ?? 0)
    const gold = Number(session.metadata?.gold ?? 0)
    const productId = session.metadata?.productId ?? 'unknown'
    // TODO: persist fulfillment to database keyed on session.id
    console.log(`[IAP] Fulfilled: ${productId} → ${gems} gems, ${gold} gold (session ${session.id})`)
  }

  res.json({ received: true })
})

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, stripe: !!STRIPE_SECRET })
})

app.listen(PORT, () => {
  console.log(`[IAP] Server running at http://localhost:${PORT}`)
  console.log(`[IAP] Stripe configured: ${!!STRIPE_SECRET}`)
})
