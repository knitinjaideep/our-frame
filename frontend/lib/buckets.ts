/**
 * The 4 top-level Drive buckets shown throughout the app.
 * id = actual Google Drive folder ID — update if a folder is deleted and recreated.
 */
export const BUCKETS = [
  {
    id: '1JMutj12MQTZcbkhzBE1W8pH0TCt2GxVf',
    eyebrow: 'Growing Up, Frame by Frame',
    description: 'Every milestone, every laugh. A timeline written in light.',
    accentColor: 'oklch(0.70 0.145 58)',
    gradient: 'linear-gradient(135deg, oklch(0.13 0.018 48) 0%, oklch(0.20 0.025 55) 60%, oklch(0.16 0.022 52) 100%)',
  },
  {
    id: '1xbcuOKAcRofSo0KwjEykYV3rXnmAmd8J',
    eyebrow: 'Stories From Everywhere',
    description: 'Roads taken, cities explored, memories carried home.',
    accentColor: 'oklch(0.65 0.130 200)',
    gradient: 'linear-gradient(135deg, oklch(0.12 0.015 210) 0%, oklch(0.19 0.022 200) 60%, oklch(0.14 0.018 205) 100%)',
  },
  {
    id: '1fyt_9BebLuyEyx7w8El1Bo4Nfs9h-59A',
    eyebrow: 'Anchor Memories',
    description: 'The days that changed everything. Held forever.',
    accentColor: 'oklch(0.72 0.14 350)',
    gradient: 'linear-gradient(135deg, oklch(0.12 0.015 345) 0%, oklch(0.19 0.020 355) 60%, oklch(0.14 0.016 350) 100%)',
  },
  {
    id: '1PMDy1-M23ZRkPxuaQ8IL3y_BorDEiepb',
    eyebrow: 'People & Moments',
    description: 'Friends, family, ordinary days. Everything that makes us us.',
    accentColor: 'oklch(0.62 0.095 300)',
    gradient: 'linear-gradient(135deg, oklch(0.12 0.012 295) 0%, oklch(0.18 0.018 300) 60%, oklch(0.13 0.015 305) 100%)',
  },
] as const

export type BucketDef = (typeof BUCKETS)[number]
