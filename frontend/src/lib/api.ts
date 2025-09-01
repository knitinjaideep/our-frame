import axios from 'axios'
import type { Photo } from '../types'

/**
 * API client helpers.
 * Assumes your FastAPI backend exposes:
 *   GET /photos        -> Photo[]
 *   GET /albums        -> Album[]
 *   ...
 * Adjust baseURL as needed.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 20_000,
})

export async function fetchPhotos(): Promise<Photo[]> {
  const { data } = await api.get<Photo[]>('/photos')
  return data
}
