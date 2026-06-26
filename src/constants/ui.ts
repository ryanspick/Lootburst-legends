export const UI = {
  // Touch targets
  minTouchTargetPx:   44,
  primaryButtonPx:    56,
  iconButtonPx:       48,

  // Typography
  bodyFontSize:       '15px',
  buttonFontSize:     '16px',
  labelFontSize:      '13px',
  headingFontSize:    '20px',
  heroNameFontSize:   '18px',

  // Spacing
  panelPaddingPx:     16,
  cardGapPx:          8,
  sectionGapPx:       24,

  // Border radii (pixel art uses minimal rounding)
  radiusSmallPx:      2,
  radiusMediumPx:     4,
  radiusLargePx:      6,

  // Bottom nav
  bottomNavHeightPx:  64,

  // Mobile breakpoints
  mobileMinWidthPx:   360,
  mobileMaxWidthPx:   428,

  // Particle canvas z-index layers
  zBgParticles:       0,
  zGround:            10,
  zCharacters:        20,
  zProjectileTrails:  30,
  zImpactParticles:   40,
  zDamageNumbers:     50,
  zLootDrops:         60,
  zRarityBeams:       70,
  zRewardOverlay:     80,
  zUI:                90,
  zModal:             100,
} as const

export const BOTTOM_NAV_TABS = [
  { id: 'run',      label: 'Run',      icon: '⚔️' },
  { id: 'squad',    label: 'Squad',    icon: '👥' },
  { id: 'capsule',  label: 'Capsule',  icon: '🔮' },
  { id: 'gear',     label: 'Gear',     icon: '🛡️' },
  { id: 'progress', label: 'Progress', icon: '📦' },
] as const

export type TabId = typeof BOTTOM_NAV_TABS[number]['id']
