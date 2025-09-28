import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  role: z.string(),
  company: z.string(),
  host: z.string().url()
})
