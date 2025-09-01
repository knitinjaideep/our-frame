export interface Photo {
    id: string
    name: string
    mimeType: string
    webViewLink: string
    thumbnailLink: string
    createdTime?: string
    modifiedTime?: string
    size?: string
  }
  
  export interface Album {
    id: string
    name: string
    description?: string
    theme?: string
    photoCount: number
    coverPhoto?: string
    createdTime: string
  }
  
  export interface BabyJournalEntry {
    id: string
    title: string
    date: string
    photoId?: string
    voiceRecording?: string
    aiCaption?: string
    milestone?: string
  }

  export interface DriveFolder {
    id: string
    name: string
    mimeType: string
    parents?: string[]
  }
  
  
  export type AppSection = 'home' | 'gallery' | 'albums' | 'baby-journal'
  