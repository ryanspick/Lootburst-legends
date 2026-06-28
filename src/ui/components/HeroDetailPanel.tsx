import type { Rarity } from '@/constants/palette'
import { ELEMENT_COLOURS, RARITY_COLOURS } from '@/constants/palette'
import RarityFrame from './RarityFrame'
import SpriteCharacter from './SpriteCharacter'
import StarMeter from './StarMeter'
import PixelButton from './PixelButton'
import styles from './HeroDetailPanel.module.css'

const XP_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000]
const MAX_LEVEL = 10

interface OwnedData {
  stars: number
  shards: number
  level?: number
  xp?: number
}

interface Props {
  id: string
  displayName: string
  rarity: Rarity
  element: string
  role: string
  tags?: string[]
  stars: number
  maxStars: number
  owned?: OwnedData
  globalShards?: number
  inSquad?: boolean
  skillDesc?: string
  ultDesc?: string
  onAddToSquad?: () => void
  onUpgrade?: () => void
}

const ROLE_ICONS: Record<string, string> = {
  tank: '🛡', healer: '💚', ranged: '🏹', caster: '🔮',
  assassin: '⚡', support: '🎺', blob: '🫧', reaper: '💀',
}

const SHARDS_PER_STAR = 20

export default function HeroDetailPanel({
  id, displayName, rarity, element, role, tags = [],
  stars, maxStars, owned, globalShards = 0, inSquad,
  skillDesc, ultDesc,
  onAddToSquad, onUpgrade,
}: Props) {
  const ec = ELEMENT_COLOURS[element] ?? '#8888cc'
  const rc = RARITY_COLOURS[rarity]
  const upgradeCost = owned ? (owned.stars + 1) * SHARDS_PER_STAR : 0
  const totalShards = (owned?.shards ?? 0) + globalShards
  const canUpgrade = owned != null && owned.stars < maxStars && totalShards >= upgradeCost

  return (
    <div className={styles.panel} data-rarity={rarity} style={{ '--ec': ec, '--rc': rc.primary } as React.CSSProperties}>
      {/* Rarity glow background */}
      <div className={styles.glowBg} style={{ background: `radial-gradient(ellipse at top, ${rc.glow} 0%, transparent 60%)` }} />

      <div className={styles.top}>
        {/* Sprite */}
        <div className={styles.spriteArea}>
          <RarityFrame rarity={rarity} size={84} animate>
            <SpriteCharacter assetId={id} rarity={rarity} size={70} animate />
          </RarityFrame>
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <span className={styles.name} style={{ color: rc.primary }}>{displayName}</span>
            {owned?.level != null && (
              <span className={styles.levelBadge}>Lv.{owned.level}</span>
            )}
          </div>
          <div className={styles.meta}>
            <span className={styles.element} style={{ color: ec, borderColor: ec }}>
              {element.toUpperCase()}
            </span>
            <span className={styles.role}>
              {ROLE_ICONS[role] ?? '✦'} {role}
            </span>
          </div>
          <StarMeter stars={stars} maxStars={maxStars} size="md" animate />
          {owned?.level != null && owned.level < MAX_LEVEL && (
            <div className={styles.xpBar}>
              <div
                className={styles.xpFill}
                style={{ width: `${Math.min(100, ((owned.xp ?? 0) / XP_THRESHOLDS[owned.level]) * 100)}%` }}
              />
              <span className={styles.xpLabel}>
                {owned.xp ?? 0} / {XP_THRESHOLDS[owned.level]} XP
              </span>
            </div>
          )}
          {owned?.level === MAX_LEVEL && (
            <div className={styles.xpMaxed}>MAX LEVEL</div>
          )}
          {owned && (
            <div className={styles.shards}>
              🔮 {owned.shards}{globalShards > 0 ? `+${globalShards}` : ''} / {upgradeCost} shards
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map(t => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
        </div>
      )}

      {/* Abilities */}
      {(skillDesc || ultDesc) && (
        <div className={styles.abilities}>
          {skillDesc && (
            <div className={styles.ability}>
              <span className={styles.abilityLabel} style={{ color: ec }}>◆ SKILL</span>
              <span className={styles.abilityDesc}>{skillDesc}</span>
            </div>
          )}
          {ultDesc && (
            <div className={styles.ability}>
              <span className={styles.abilityLabel} style={{ color: rc.primary }}>★ ULTIMATE</span>
              <span className={styles.abilityDesc}>{ultDesc}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!owned && !onAddToSquad ? (
        <div className={styles.lockedHint}>
          🔒 Pull in Capsule to unlock
        </div>
      ) : (
        <div className={styles.actions}>
          <PixelButton
            variant="secondary"
            size="sm"
            onClick={onAddToSquad}
            disabled={inSquad || !onAddToSquad}
          >
            {inSquad ? '✓ In Squad' : '+ Add to Squad'}
          </PixelButton>
          <PixelButton
            variant="ghost"
            size="sm"
            onClick={onUpgrade}
            disabled={!canUpgrade}
          >
            ⬆ Star Up {canUpgrade ? `(${totalShards}/${upgradeCost} 🔮)` : ''}
          </PixelButton>
        </div>
      )}
    </div>
  )
}
