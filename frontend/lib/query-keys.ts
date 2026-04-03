export const queryKeys = {
  albums: {
    all: ['albums'] as const,
    detail: (id: string) => ['albums', id] as const,
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
} as const
