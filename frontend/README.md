# Our Frame — Frontend

Next.js frontend for the Our Frame family photo vault.

## Stack

- **Next.js** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** · **Framer Motion** · **TanStack Query v5**
- **shadcn/ui** · **Lucide React** · **Yet Another React Lightbox**

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (requires backend running on :8000)
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## Further Reading

- [Frontend architecture & component reference](../docs/frontend.md)
- [Design system & token reference](../docs/design-system.md)
- [Root README for full project setup](../README.md)
