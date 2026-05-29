import { z } from 'zod'
import { PLATFORMS } from './constants'

/** Hex color like #7C3AED. */
export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color (e.g. #7C3AED)')

/** Add a tracked account. `attestation` enforces the acceptable-use legal gate. */
export const addAccountSchema = z.object({
  input: z.string().trim().min(1, 'Paste a profile URL or @handle').max(2048),
  platform: z.enum(PLATFORMS).optional(),
  attestation: z.literal(true, {
    errorMap: () => ({
      message:
        'You must confirm you own this account or it is a public account you are authorized to monitor',
    }),
  }),
})
export type AddAccountInput = z.infer<typeof addAccountSchema>

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  color: hexColor.default('#7C3AED'),
})
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>

export const updateCollectionSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    color: hexColor.optional(),
  })
  .refine((v) => v.name !== undefined || v.color !== undefined, {
    message: 'Provide a name or color to update',
  })

export const assignAccountsSchema = z.object({
  accountIds: z.array(z.string().uuid()).min(1).max(500),
})

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number'),
})
export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

/** Query params for the paginated videos list. */
export const videosQuerySchema = z.object({
  platform: z.enum(PLATFORMS).optional(),
  collectionId: z.string().uuid().optional(),
  hashtag: z.string().trim().max(100).optional(),
  sortBy: z
    .enum(['views', 'viral_score', 'posted_at', 'engagement_rate', 'likes'])
    .default('viral_score'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  dateRange: z.enum(['7d', '30d', '90d', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})
export type VideosQuery = z.infer<typeof videosQuerySchema>
