import type { DbShape } from './types'
import { seedDb } from './seed'

const KEY = 'wanderlust.db.v1'

export const loadDb = (): DbShape => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedDb()
    const parsed = JSON.parse(raw) as Partial<DbShape>
    const base = seedDb()
    return {
      users: (parsed.users ?? base.users).map((u) => ({
        ...u,
        verification: u.verification ?? { status: 'unverified' },
      })),
      events: parsed.events ?? base.events,
      orders: parsed.orders ?? base.orders,
      saved: parsed.saved ?? base.saved,
      sessionUserId: parsed.sessionUserId ?? null,
      onboarded: parsed.onboarded ?? false,
      theme: parsed.theme ?? base.theme,
    }
  } catch {
    return seedDb()
  }
}

export const saveDb = (db: DbShape): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* quota or private mode — the session keeps working in memory */
  }
}

export const resetDb = (): void => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Reads a picked file and downsizes it before it ever reaches storage —
 * the spec asks for automatic compression plus a preview, and localStorage
 * would blow past quota on raw camera output.
 */
export const readImageCompressed = (
  file: File,
  maxEdge = 1200,
  quality = 0.72,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not an image'))
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(String(reader.result))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
