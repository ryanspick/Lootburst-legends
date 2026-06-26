import { RARITY_COLOURS, ELEMENT_COLOURS } from '@/constants/palette'
import type { Rarity } from '@/constants/palette'
import { lighten, darken } from './pixelCanvas'

export interface SpritePalette {
  K: string  // outline (dark)
  H: string  // head/skin
  B: string  // body main
  A: string  // body accent / highlight
  D: string  // body dark / shadow
  L: string  // legs
  F: string  // feet
  P: string  // prop / weapon
  X: string  // eyes
  E: string  // eye highlight
  G: string  // rarity glow accent
  S: [string, number]  // ground shadow (color + alpha)
}

const SKIN_TONES: Record<string, string> = {
  fire:    '#e8c87a',
  ice:     '#c8e0f0',
  poison:  '#c8e890',
  holy:    '#ffe0a0',
  shadow:  '#b0a0c8',
  storm:   '#c0d8f0',
  machine: '#d4b896',
  nature:  '#c8d890',
  gold:    '#e8d070',
  void:    '#a890c8',
}

const PROP_COLORS: Record<string, string> = {
  tank:     '#8888aa',
  healer:   '#44cc88',
  ranged:   '#b09060',
  caster:   '#cc88ff',
  assassin: '#ff4488',
  support:  '#ffcc44',
  slime:    '#44ddaa',
  golem:    '#887766',
  beast:    '#cc7744',
}

export function makeSpritePalette(element: string, rarity: Rarity, role = 'tank'): SpritePalette {
  const bodyBase = ELEMENT_COLOURS[element] ?? '#8888cc'
  const rarityCol = RARITY_COLOURS[rarity]
  const skinCol = SKIN_TONES[element] ?? '#e8d0a0'
  const propCol = PROP_COLORS[role] ?? '#aaaacc'

  return {
    K: '#111122',
    H: skinCol,
    B: bodyBase,
    A: lighten(bodyBase, 60),
    D: darken(bodyBase, 50),
    L: darken(bodyBase, 30),
    F: darken(bodyBase, 60),
    P: propCol,
    X: '#1a1a2e',
    E: '#ffffffcc',
    G: rarityCol.glow,
    S: ['#000000', 0.25],
  }
}

export function makeGearPalette(element: string, rarity: Rarity): SpritePalette {
  const bodyBase = ELEMENT_COLOURS[element] ?? '#8888cc'
  const rarityCol = RARITY_COLOURS[rarity]
  return {
    K: '#111122',
    H: lighten(bodyBase, 80),
    B: bodyBase,
    A: lighten(bodyBase, 50),
    D: darken(bodyBase, 40),
    L: darken(bodyBase, 60),
    F: '#333344',
    P: rarityCol.primary,
    X: rarityCol.glow,
    E: '#ffffff',
    G: rarityCol.glow,
    S: ['#000000', 0.2],
  }
}

export function makeBossPalette(element: string): SpritePalette {
  const bodyBase = ELEMENT_COLOURS[element] ?? '#8888cc'
  return {
    K: '#000000',
    H: lighten(bodyBase, 40),
    B: bodyBase,
    A: lighten(bodyBase, 80),
    D: darken(bodyBase, 50),
    L: darken(bodyBase, 30),
    F: darken(bodyBase, 70),
    P: '#ffd700',   // gold crown/accents
    X: '#ff4444',   // menacing red eyes
    E: '#ffffff',
    G: '#ffd700',   // gold boss glow
    S: ['#000000', 0.35],
  }
}

// Seeded deterministic RNG
export function seededRng(id: string) {
  let seed = 0
  for (let i = 0; i < id.length; i++) {
    seed = ((seed << 5) - seed + id.charCodeAt(i)) | 0
  }
  seed = Math.abs(seed) || 12345
  return function() {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0
    return (seed >>> 0) / 0x100000000
  }
}
