export type ActiveTab = "home" | "albums" | "favorites" | "videos";


export interface DriveFolder {
  id: string;
  name: string;
}

export interface Photo {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}
