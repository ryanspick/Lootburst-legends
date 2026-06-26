// Coordinate constants for the circular combat arena.
// Canvas 360×780 (portrait phone fill). Heroes at bottom; enemies orbit ellipse above them.

export const CANVAS_W = 360
export const CANVAS_H = 780

export const CENTER_X = 180
export const CENTER_Y = 300    // hero + enemy combat centre

// Spawn ring at screen edges so enemies always march in from off-screen
export const ENEMY_SPAWN_RADIUS_X = 168  // left edge ≈ x=12, right edge ≈ x=348
export const ENEMY_SPAWN_RADIUS_Y = 272  // top edge ≈ y=28, bottom edge ≈ y=572

// Enemies stop drifting when within this distance of centre (ring around heroes)
export const ENEMY_ENGAGE_RADIUS = 80

// Boss always spawns top-center
export const BOSS_X = CENTER_X
export const BOSS_Y_POS = 85

// Enemy drift speed in px/ms
export const ENEMY_DRIFT_SPEED = 0.055
export const ELITE_DRIFT_SPEED  = 0.035

// Hero formations — centered inside the spawn ring (CENTER_X=180, CENTER_Y=300)
export const HERO_SLOTS_3 = [
  { x: 155, y: 315 },  // left
  { x: 180, y: 290 },  // top-center
  { x: 205, y: 315 },  // right
]
export const HERO_SLOTS_2 = [
  { x: 160, y: 305 },
  { x: 200, y: 305 },
]
export const HERO_SLOTS_1 = [
  { x: 180, y: 300 },
]

export function getHeroSlot(idx: number, total: number): { x: number; y: number } {
  const arr = total === 1 ? HERO_SLOTS_1 : total === 2 ? HERO_SLOTS_2 : HERO_SLOTS_3
  return arr[idx] ?? arr[arr.length - 1]
}

// Angle offset per wave index — varied directions
export const WAVE_ANGLE_OFFSETS: Record<number, number> = {
  0:  Math.PI / 2,          // bottom (first wave enters below hero cluster)
  1:  0,                    // right
  2: -Math.PI / 4,          // top-right
  3: -Math.PI / 2,          // top
  4:  Math.PI,              // left
  5:  Math.PI * 3 / 4,      // bottom-left
}
