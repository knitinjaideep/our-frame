import { useEffect, useState } from 'react'
import type { Photo } from '../types'
import { fetchPhotos } from '../lib/api'

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await fetchPhotos()
        if (alive) setPhotos(data)
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Failed to load photos')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return { photos, loading, error }
}
