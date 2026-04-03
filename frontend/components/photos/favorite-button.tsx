'use client'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites'

interface FavoriteButtonProps {
  photoId: string
  photoName: string
  folderId?: string
  className?: string
}

export function FavoriteButton({ photoId, photoName, folderId, className }: FavoriteButtonProps) {
  const favoriteIds = useFavoriteIds()
  const { add, remove } = useToggleFavorite()
  const isFav = favoriteIds.has(photoId)
  const isPending = add.isPending || remove.isPending

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (isFav) {
      remove.mutate(photoId)
    } else {
      add.mutate({ photo_id: photoId, photo_name: photoName, folder_id: folderId })
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all',
        isFav
          ? 'bg-rose-500/80 text-white hover:bg-rose-600'
          : 'bg-black/40 text-white/60 hover:bg-black/60 hover:text-white',
        isPending && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Heart className={cn('h-4 w-4', isFav && 'fill-current')} />
    </button>
  )
}
