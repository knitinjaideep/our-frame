export const queryKeys = {
  albums: {
    all: ['albums'] as const,
    detail: (id: string) => ['albums', id] as const,
    buckets: ['albums', 'buckets'] as const,
  },
  favorites: {
    all: ['favorites'] as const,
  },
  homeFeed: {
    all: ['home-feed'] as const,
  },
  authStatus: {
    all: ['auth-status'] as const,
  },
  sections: {
    all: ['sections'] as const,
  },
  sectionMappings: {
    all: ['section-mappings'] as const,
  },
} as const
