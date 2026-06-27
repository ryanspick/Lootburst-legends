import type { Rarity } from '@/constants/palette'
import type { AnimationClipDefinition } from '@/types/art'
import { getManifestEntry } from './assetManifest'
import { getGeneratedSprite } from './generated'

const _loadedImages: Map<string, HTMLImageElement | null> = new Map()
const _missing: Set<string> = new Set()

function loadDataURL(dataUrl: string): HTMLImageElement {
  const img = new Image()
  img.src = dataUrl
  return img
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (_loadedImages.has(url)) return Promise.resolve(_loadedImages.get(url)!)
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => { _loadedImages.set(url, img); resolve(img) }
    img.onerror = () => {
      _loadedImages.set(url, null)
      _missing.add(url)
      if (import.meta.env.DEV) console.warn(`[AssetLoader] Missing: ${url}`)
      resolve(null)
    }
    img.src = url
  })
}

export async function getAsset(id: string): Promise<HTMLImageElement | null> {
  // Flat override — drop any PNG as /public/assets/sprites/{id}.png to replace procedural art
  const flat = await loadImage(`/assets/sprites/${id}.png`)
  if (flat) return flat

  const entry = getManifestEntry(id)
  if (!entry) {
    const dataUrl = getGeneratedSprite(id)
    if (dataUrl) return loadDataURL(dataUrl)
    _missing.add(id)
    return null
  }
  const img = await loadImage(entry.file)
  if (img) return img
  if (entry.placeholderFile) {
    const ph = await loadImage(entry.placeholderFile)
    if (ph) return ph
  }
  const dataUrl = getGeneratedSprite(id)
  if (dataUrl) return loadDataURL(dataUrl)
  return null
}

export async function getIcon(id: string): Promise<HTMLImageElement | null> {
  const entry = getManifestEntry(id)
  if (!entry?.iconFile) return null
  const img = await loadImage(entry.iconFile)
  if (!img && entry.placeholderFile) return loadImage(entry.placeholderFile)
  return img
}

export async function getPlaceholder(id: string): Promise<HTMLImageElement | null> {
  const entry = getManifestEntry(id)
  if (!entry?.placeholderFile) return null
  return loadImage(entry.placeholderFile)
}

export function getRarityFrame(rarity: Rarity): string {
  return `/assets/pixel/ui/frames/rarity-frame-${rarity}.png`
}

export async function getSpriteClip(
  _assetId: string,
  _clip: AnimationClipDefinition,
): Promise<HTMLImageElement | null> {
  const entry = getManifestEntry(_assetId)
  if (!entry) return null
  return getAsset(_assetId)
}

export function getMissingAssets(): string[] {
  return Array.from(_missing)
}

export function isAssetMissing(id: string): boolean {
  const entry = getManifestEntry(id)
  if (!entry) return true
  return _missing.has(entry.file)
}
