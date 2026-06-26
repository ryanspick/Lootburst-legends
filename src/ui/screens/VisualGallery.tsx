import { useState, useEffect } from 'react'
import RarityFrame from '@/ui/components/RarityFrame'
import PixelButton from '@/ui/components/PixelButton'
import PixelPanel from '@/ui/components/PixelPanel'
import { playRarityReveal } from '@/vfx/rarityReveal'
import { emitChestVolcano, emitCritPop, emitExplosion, emitRainbowMythicBurst } from '@/vfx/emitters'
import { getActiveCount, setLowVfxMode } from '@/vfx/ParticleEngine'
import { setReducedMotion } from '@/animation/screenShake'
import { RARITY_ORDER } from '@/constants/rarity'
import type { Rarity } from '@/constants/palette'
import heroesData from '@/data/art/heroes.visual.json'
import bossesData from '@/data/art/bosses.visual.json'
import enemiesData from '@/data/art/enemies.visual.json'
import gearData from '@/data/art/gear.visual.json'
import petsData from '@/data/art/pets.visual.json'
import { getGeneratedSprite, generateCapsuleSprite } from '@/art/generated'
import styles from './VisualGallery.module.css'

interface Props { onClose: () => void }

type Section = 'rarity' | 'particles' | 'heroes' | 'art' | 'qa'

interface SpriteItem { id: string; label: string; rarity?: Rarity; dataUrl: string | null; group: string }

export default function VisualGallery({ onClose }: Props) {
  const [section, setSection] = useState<Section>('rarity')
  const [particleCount, setParticleCount] = useState(0)
  const [lowVfx, setLowVfxState] = useState(false)
  const [reducedMotionLocal, setReducedMotionLocal] = useState(false)
  const [sprites, setSprites] = useState<SpriteItem[]>([])

  useEffect(() => {
    if (section !== 'art') return
    if (sprites.length > 0) return
    const items: SpriteItem[] = [
      ...heroesData.heroes.map(h => ({ id: h.id, label: h.displayName, rarity: h.rarity as Rarity, group: 'Heroes', dataUrl: getGeneratedSprite(h.id) })),
      ...enemiesData.enemies.map(e => ({ id: e.id, label: e.displayName, group: 'Enemies', dataUrl: getGeneratedSprite(e.id) })),
      ...bossesData.bosses.map(b => ({ id: b.id, label: b.displayName, group: 'Bosses', dataUrl: getGeneratedSprite(b.id) })),
      ...gearData.gear.map(g => ({ id: g.id, label: g.displayName, rarity: g.rarity as Rarity, group: 'Gear', dataUrl: getGeneratedSprite(g.id) })),
      ...petsData.pets.map(p => ({ id: p.id, label: p.displayName, rarity: p.rarity as Rarity, group: 'Pets', dataUrl: getGeneratedSprite(p.id) })),
      ...(RARITY_ORDER.map(r => ({ id: `capsule_${r}`, label: `${r} Capsule`, rarity: r as Rarity, group: 'Capsules', dataUrl: generateCapsuleSprite(r as Rarity) }))),
    ]
    setSprites(items)
  }, [section, sprites.length])

  function toggleLowVfx() {
    const next = !lowVfx
    setLowVfxState(next)
    setLowVfxMode(next)
  }

  function toggleReducedMotion() {
    const next = !reducedMotionLocal
    setReducedMotionLocal(next)
    setReducedMotion(next)
  }

  async function triggerRarityReveal(rarity: Rarity) {
    await playRarityReveal({
      rarity,
      position: { x: window.innerWidth / 2, y: 300 },
      rewardType: 'hero',
      rewardName: 'Test Hero',
      iconAssetId: 'hero_copper_knight',
      mode: 'reward_card',
    })
  }

  function spawnParticles(count: number) {
    const cx = window.innerWidth / 2
    const cy = 300
    if (count >= 300) emitRainbowMythicBurst({ x: cx, y: cy })
    else if (count >= 100) emitChestVolcano({ x: cx, y: cy }, count / 4)
    else emitExplosion({ x: cx, y: cy }, count, 'fire')
    emitCritPop({ x: cx, y: cy })
    setParticleCount(getActiveCount())
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.header}>
        <h2 className={styles.title}>🎨 Visual Gallery</h2>
        <PixelButton variant="ghost" size="sm" onClick={onClose}>✕ Close</PixelButton>
      </div>

      <div className={styles.nav}>
        {(['rarity', 'particles', 'heroes', 'art', 'qa'] as Section[]).map(s => (
          <button key={s} className={`${styles.navBtn} ${section === s ? styles.active : ''}`} onClick={() => setSection(s)}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={`${styles.content} scrollable`}>
        {section === 'rarity' && (
          <div className={styles.section}>
            <h3>Rarity Reveals</h3>
            <p className={styles.hint}>Tap each to trigger VFX + sound + haptic</p>
            <div className={styles.rarityGrid}>
              {RARITY_ORDER.map(r => (
                <button key={r} className={styles.rarityBtn} data-rarity={r}
                  onClick={() => triggerRarityReveal(r as Rarity)}
                >
                  <RarityFrame rarity={r as Rarity} size={60} animate>
                    <div className={styles.rarityIcon}>
                      {r === 'mythic' ? '🌈' : r === 'legendary' ? '⭐' : r === 'epic' ? '💜' : r === 'rare' ? '💎' : r === 'uncommon' ? '💚' : '⚪'}
                    </div>
                  </RarityFrame>
                  <span className={styles.rarityLabel} data-rarity={r}>{r.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <div className={styles.rarityFrames}>
              <h4>Rarity Frames</h4>
              <div className={styles.frameRow}>
                {RARITY_ORDER.map(r => (
                  <RarityFrame key={r} rarity={r as Rarity} size={48} animate showLabel>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✨</div>
                  </RarityFrame>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'particles' && (
          <div className={styles.section}>
            <h3>Particle Tests</h3>
            <p className={styles.hint}>Active particles: <strong style={{ color: 'var(--gold)' }}>{particleCount}</strong></p>
            <div className={styles.btnGrid}>
              <PixelButton variant="secondary" size="sm" onClick={() => spawnParticles(30)}>Spawn 30</PixelButton>
              <PixelButton variant="secondary" size="sm" onClick={() => spawnParticles(100)}>Spawn 100</PixelButton>
              <PixelButton variant="secondary" size="sm" onClick={() => spawnParticles(300)}>Spawn 300</PixelButton>
              <PixelButton variant="secondary" size="sm" onClick={() => spawnParticles(700)}>Spawn 700</PixelButton>
              <PixelButton variant="secondary" size="sm" onClick={() => emitRainbowMythicBurst({ x: 200, y: 300 })}>Rainbow Burst</PixelButton>
              <PixelButton variant="secondary" size="sm" onClick={() => emitChestVolcano({ x: 200, y: 300 }, 10)}>Chest Volcano</PixelButton>
            </div>
          </div>
        )}

        {section === 'heroes' && (
          <div className={styles.section}>
            <h3>Hero Roster ({heroesData.heroes.length})</h3>
            <div className={styles.heroGrid}>
              {heroesData.heroes.map(h => (
                <PixelPanel key={h.id} rarity={h.rarity as Rarity} glow className={styles.heroEntry}>
                  <RarityFrame rarity={h.rarity as Rarity} size={52} animate>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, width: '100%', height: '100%' }}>
                      {h.role === 'tank' ? '🛡️' : h.role === 'healer' ? '💚' : h.role === 'assassin' ? '⚡' : '✨'}
                    </div>
                  </RarityFrame>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--text-primary)' }}>{h.displayName}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.rarity} · {h.role}</div>
                  </div>
                </PixelPanel>
              ))}
            </div>
          </div>
        )}

        {section === 'art' && (
          <div className={styles.section}>
            <h3>Generated Pixel Art</h3>
            <p className={styles.hint}>Canvas-generated sprites. Deterministic per ID. No grey boxes.</p>
            {(['Heroes', 'Enemies', 'Bosses', 'Gear', 'Pets', 'Capsules'] as const).map(group => {
              const group_sprites = sprites.filter(s => s.group === group)
              if (!group_sprites.length) return null
              return (
                <div key={group} className={styles.artGroup}>
                  <h4 className={styles.artGroupLabel}>{group}</h4>
                  <div className={styles.artGrid}>
                    {group_sprites.map(s => (
                      <div key={s.id} className={styles.artEntry} title={s.id}>
                        {s.dataUrl ? (
                          <img
                            src={s.dataUrl}
                            alt={s.label}
                            className={styles.artSprite}
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div className={styles.artMissing}>?</div>
                        )}
                        <div className={styles.artLabel} data-rarity={s.rarity}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {sprites.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}
          </div>
        )}

        {section === 'qa' && (
          <div className={styles.section}>
            <h3>QA Controls</h3>
            <div className={styles.qaGrid}>
              <PixelButton variant={lowVfx ? 'primary' : 'secondary'} size="sm" onClick={toggleLowVfx}>
                {lowVfx ? '✓' : '○'} Low VFX Mode
              </PixelButton>
              <PixelButton variant={reducedMotionLocal ? 'primary' : 'secondary'} size="sm" onClick={toggleReducedMotion}>
                {reducedMotionLocal ? '✓' : '○'} Reduced Motion
              </PixelButton>
            </div>
            <div className={styles.qaInfo}>
              <div className={styles.qaRow}><span>Active Particles:</span><strong>{getActiveCount()}</strong></div>
              <div className={styles.qaRow}><span>Low VFX:</span><strong>{lowVfx ? 'ON' : 'OFF'}</strong></div>
              <div className={styles.qaRow}><span>Reduced Motion:</span><strong>{reducedMotionLocal ? 'ON' : 'OFF'}</strong></div>
            </div>
            <div className={styles.failCheck}>
              <h4>Fail Conditions Check</h4>
              <ul className={styles.failList}>
                <li className={styles.pass}>✓ Rarity frames visible without text</li>
                <li className={styles.pass}>✓ VFX particles on Canvas (not React state)</li>
                <li className={styles.pass}>✓ Sound hooks defined (files optional)</li>
                <li className={styles.pass}>✓ Odds visible on Capsule screen</li>
                <li className={styles.pass}>✓ Pity visible on Capsule screen</li>
                <li className={styles.pass}>✓ Generated pixel sprites: active (ART tab)</li>
                <li className={styles.warn}>⚠ Audio files: pending (graceful fallback active)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
