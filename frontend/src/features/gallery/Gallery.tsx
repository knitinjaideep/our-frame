import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import type { Photo, DriveFolder } from '../../types'
import {
  Loader2, RefreshCw, Album, Image as ImageIcon, ChevronLeftCircle,
  Maximize2, Download, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { Lightbox } from '../../components/Lightbox'
import { PhotoCard } from '../../components/PhotoCard'

type ChildrenResponse = {
  parentId?: string
  folders?: DriveFolder[]
  files?: Photo[]
  needsAuth?: boolean
  authUrl?: string
}

const API = (p: string) => `http://localhost:8000${p}`

// Use backend proxies so thumbnails always load and previews are fast
const thumbSrc = (p: Photo, size = 600) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/thumbnail?s=${size}`)

const previewSrc = (p: Photo, width = 1600) =>
  API(`/drive/file/${encodeURIComponent(p.id)}/preview?w=${width}`)

const fullSrcOriginal = (p: Photo) => {
  const mt = p.mimeType?.toLowerCase() || ''
  return mt.includes('heic') || mt.includes('heif')
    ? p.webViewLink
    : API(`/drive/file/${encodeURIComponent(p.id)}/content`)
}

export default function Gallery() {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [rootFolderId, setRootFolderId] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const handleAuthBounce = (data: ChildrenResponse) => {
    if (data?.needsAuth && data?.authUrl) {
      window.location.href = API(data.authUrl)
      return true
    }
    return false
  }

  const loadChildren = async (parentId?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = parentId ? API(`/drive/children?parentId=${encodeURIComponent(parentId)}`) : API('/drive/children')
      const { data } = await axios.get<ChildrenResponse>(url)
      if (handleAuthBounce(data)) return

      if (!parentId && !rootFolderId && data?.parentId) setRootFolderId(data.parentId)
      setCurrentFolderId(data?.parentId ?? null)
      setFolders(data?.folders ?? [])
      setPhotos(data?.files ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load Drive items.')
      console.error('Drive load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChildren() }, []) // initial

  const isAtRoot = !rootFolderId || currentFolderId === rootFolderId
  const refresh = () => loadChildren(currentFolderId ?? undefined)
  const openFolder = (id: string) => loadChildren(id)
  const backToRoot = () => loadChildren(undefined)

  // Prefetch preview images for snappier next/prev
  useEffect(() => {
    if (!isPreviewOpen || photos.length === 0) return
    const ids = [previewIndex, (previewIndex + 1) % photos.length, (previewIndex - 1 + photos.length) % photos.length]
    ids.forEach((i) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = previewSrc(photos[i], 1600)
    })
  }, [isPreviewOpen, previewIndex, photos])

  const next = useCallback(() => setPreviewIndex(i => (i + 1) % photos.length), [photos.length])
  const prev = useCallback(() => setPreviewIndex(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const openPreviewAll = () => { if (photos.length) { setPreviewIndex(0); setIsPreviewOpen(true) } }

  const SectionHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div className="section-header">
      <h2>{title}</h2>
      <div className="actions">{children}</div>
    </div>
  )

  const FoldersView = () => (
    <>
      <SectionHeader title="Folders">
        <button onClick={refresh} disabled={loading} className="btn-gradient">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
      </SectionHeader>

      {error && (
        <div className="state-card">
          <p className="mb-3">{error}</p>
          <button onClick={refresh} className="btn-gradient">Try Again</button>
        </div>
      )}

      {loading && !error && (
        <div className="state-card">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-2">Loading folders…</p>
        </div>
      )}

      {!loading && !error && (
        <div className="folder-grid">
          {folders.map((f) => (
            <button key={f.id} className="folder-card" onClick={() => openFolder(f.id)} title={f.name}>
              <Album size={22} />
              <span className="folder-name">{f.name}</span>
            </button>
          ))}
          {folders.length === 0 && (
            <div className="state-card col-span-full">
              <ImageIcon size={48} className="mx-auto mb-2" />
              <p className="font-semibold">No folders found</p>
              <p className="text-sm opacity-80">Create subfolders in your root Drive folder, then click Refresh.</p>
            </div>
          )}
        </div>
      )}
    </>
  )

  const PhotosView = () => (
    <>
      <SectionHeader title="Photos">
        <button onClick={backToRoot} className="btn-white" title="Back to folders">
          <ChevronLeftCircle size={18} /> Back
        </button>
        {photos.length > 0 && (
          <button onClick={openPreviewAll} className="btn-white" title="Preview all">
            <Maximize2 size={18} /> Preview All
          </button>
        )}
        <button onClick={refresh} disabled={loading} className="btn-gradient">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
      </SectionHeader>

      {error && (
        <div className="state-card">
          <p className="mb-3">{error}</p>
          <button onClick={refresh} className="btn-gradient">Try Again</button>
        </div>
      )}

      {loading && !error && (
        <div className="state-card">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-2">Loading photos…</p>
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="state-card">
          <ImageIcon size={48} className="mx-auto mb-2" />
          <p className="font-semibold">No photos in this folder</p>
          <p className="text-sm opacity-80">Choose another folder or go back.</p>
        </div>
      )}

      {!loading && !error && photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="photo-card group relative">
              <PhotoCard
                photo={photo}
                thumbSrc={thumbSrc(photo, 600)}
                thumbSrcLg={thumbSrc(photo, 1200)}
                fullSrc={previewSrc(photo, 1600)}
                onClick={() => { setPreviewIndex(idx); setIsPreviewOpen(true) }}
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <a
                  className="view-button"
                  href={API(`/drive/file/${photo.id}/download`)}
                  title="Download"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPreviewOpen && photos.length > 0 && (
        <div className="lightbox" onClick={() => setIsPreviewOpen(false)}>
          <button className="lb-btn lb-close" onClick={() => setIsPreviewOpen(false)} title="Close">
            <X size={18} />
          </button>
          <button className="lb-btn lb-prev" onClick={(e) => { e.stopPropagation(); prev() }} title="Previous">
            <ChevronLeft size={22} />
          </button>

          {/* show fast resized preview in lightbox */}
          <Lightbox
            src={previewSrc(photos[previewIndex], 1600)}
            onClose={() => setIsPreviewOpen(false)}
            onPrev={prev}
            onNext={next}
          />

          <button className="lb-btn lb-next" onClick={(e) => { e.stopPropagation(); next() }} title="Next">
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </>
  )

  return <div className="space-y-4">{isAtRoot ? <FoldersView /> : <PhotosView />}</div>
}
