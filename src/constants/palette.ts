export const PALETTE = {
  // backgrounds
  bgDeepNavy:    '#0a0d1a',
  bgBlueBlack:   '#060810',
  bgCharcoal:    '#1a1c2c',
  bgDarkIndigo:  '#12152e',
  bgDungeonStone:'#1e1f2e',

  // reward colours
  gold:          '#ffd700',
  goldDark:      '#c8a400',
  goldLight:     '#ffe566',
  pink:          '#ff69b4',
  pinkHot:       '#ff1493',
  cyan:          '#00ffff',
  cyanShield:    '#00e5ff',
  lime:          '#aaff00',
  orange:        '#ff6600',
  orangeLight:   '#ff9933',
  purple:        '#8a2be2',
  purpleDeep:    '#5c0a9e',
  white:         '#ffffff',
  whiteCrit:     '#fffde7',

  // element colours
  fire:          '#ff6600',
  ice:           '#00e5ff',
  poison:        '#aaff00',
  holy:          '#ffd700',
  shadow:        '#8a2be2',
  storm:         '#00ffff',
  machine:       '#cd7f32',
  nature:        '#22c55e',

  // UI neutrals
  panelBg:       '#0f1225',
  panelBorder:   '#1e2a4a',
  textPrimary:   '#e8eaf6',
  textSecondary: '#7986cb',
  textMuted:     '#3949ab',

  // rainbow mythic stops
  rainbow: ['#ff0000','#ff6600','#ffff00','#00ff00','#00ffff','#0066ff','#ff00ff'],
} as const

export const ELEMENT_COLOURS: Record<string, string> = {
  fire:    PALETTE.fire,
  ice:     PALETTE.ice,
  poison:  PALETTE.poison,
  holy:    PALETTE.holy,
  shadow:  PALETTE.shadow,
  storm:   PALETTE.storm,
  machine: PALETTE.machine,
  nature:  PALETTE.nature,
  gold:    PALETTE.gold,
  void:    PALETTE.purple,
  earth:   '#886644',
  arcane:  '#ff88ee',
}

export const RARITY_COLOURS = {
  common:   { primary: '#c8c8c8', secondary: '#a0a0a0', glow: '#ffffff' },
  uncommon: { primary: '#22c55e', secondary: '#16a34a', glow: '#86efac' },
  rare:     { primary: '#3b82f6', secondary: '#1d4ed8', glow: '#93c5fd' },
  epic:     { primary: '#a855f7', secondary: '#7c3aed', glow: '#d8b4fe' },
  legendary:{ primary: '#ffd700', secondary: '#c8a400', glow: '#fef08a' },
  mythic:   { primary: '#ff00ff', secondary: '#00ffff', glow: '#ffffff' },
} as const

export type Rarity = keyof typeof RARITY_COLOURS
