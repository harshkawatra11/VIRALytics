import 'server-only'
import Stripe from 'stripe'
import { PLAN_CONFIG, type Plan } from '@viralytics/core'

let _stripe: Stripe | undefined

/** Lazy singleton — avoids constructing (and throwing) at build/module-load time. */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia', typescript: true })
  }
  return _stripe
}

/** Map each paid plan to its Stripe Price ID (set in env). */
export const PLAN_PRICE_IDS: Record<Exclude<Plan, 'free'>, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
}

/** Reverse lookup: Stripe Price ID -> our plan (for webhook handling). */
export function planFromPriceId(priceId: string | undefined): Plan {
  if (!priceId) return 'free'
  for (const [plan, id] of Object.entries(PLAN_PRICE_IDS)) {
    if (id && id === priceId) return plan as Plan
  }
  return 'free'
}

/** The manager.* fields a plan change must write (kept consistent with PLAN_CONFIG). */
export function planUpdate(plan: Plan) {
  return {
    plan,
    account_limit: PLAN_CONFIG[plan].accountLimit,
    sync_interval_seconds: PLAN_CONFIG[plan].syncIntervalSeconds,
  }
}
