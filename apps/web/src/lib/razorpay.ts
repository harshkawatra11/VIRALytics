import 'server-only'
import Razorpay from 'razorpay'
import { PLAN_CONFIG, type Plan } from '@viralytics/core'

let _rz: Razorpay | undefined

export function getRazorpay(): Razorpay {
  if (!_rz) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set')
    _rz = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  return _rz
}

/** Map each paid plan to its Razorpay Plan ID (created once in RZ dashboard → set in env). */
export const PLAN_IDS: Record<Exclude<Plan, 'free'>, string | undefined> = {
  starter: process.env.RAZORPAY_PLAN_STARTER,
  pro: process.env.RAZORPAY_PLAN_PRO,
  agency: process.env.RAZORPAY_PLAN_AGENCY,
}

/** Reverse lookup: Razorpay Plan ID → our plan key. */
export function planFromRazorpayPlanId(planId: string | undefined): Plan {
  if (!planId) return 'free'
  for (const [plan, id] of Object.entries(PLAN_IDS)) {
    if (id && id === planId) return plan as Plan
  }
  return 'free'
}

export function planUpdate(plan: Plan) {
  return {
    plan,
    account_limit: PLAN_CONFIG[plan].accountLimit,
    sync_interval_seconds: PLAN_CONFIG[plan].syncIntervalSeconds,
  }
}

/** Verify Razorpay webhook signature (HMAC-SHA256). */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  const crypto = require('crypto') as typeof import('crypto')
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
