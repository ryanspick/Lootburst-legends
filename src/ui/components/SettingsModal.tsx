import { useGameStore } from '@/store/gameStore'
import { playSound } from '@/audio/soundEvents'
import styles from './SettingsModal.module.css'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const soundMuted   = useGameStore(s => s.soundMuted)
  const soundVolume  = useGameStore(s => s.soundVolume)
  const vfxReduced   = useGameStore(s => s.vfxReduced)
  const setSoundMuted  = useGameStore(s => s.setSoundMuted)
  const setSoundVolume = useGameStore(s => s.setSoundVolume)
  const setVfxReduced  = useGameStore(s => s.setVfxReduced)

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value)
    setSoundVolume(v)
    if (!soundMuted) playSound('ui_hover_tick', { volume: v })
  }

  function handleMuteToggle() {
    setSoundMuted(!soundMuted)
    if (soundMuted) playSound('ui_button_pop')  // plays on unmute
  }

  function handleClearSave() {
    if (!confirm('Clear all save data? This cannot be undone.')) return
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>⚙️ SETTINGS</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Sound */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>SOUND</div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>Mute</span>
            <button
              className={`${styles.toggle} ${soundMuted ? styles.toggleOn : ''}`}
              onClick={handleMuteToggle}
            >
              <div className={styles.toggleThumb} />
            </button>
          </div>

          <div className={`${styles.row} ${soundMuted ? styles.rowDisabled : ''}`}>
            <span className={styles.rowLabel}>Volume</span>
            <div className={styles.sliderWrap}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={handleVolumeChange}
                disabled={soundMuted}
                className={styles.slider}
              />
              <span className={styles.sliderVal}>{Math.round(soundVolume * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Graphics */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>GRAPHICS</div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Reduce VFX</span>
              <span className={styles.rowHint}>Fewer particles, no screen shake</span>
            </div>
            <button
              className={`${styles.toggle} ${vfxReduced ? styles.toggleOn : ''}`}
              onClick={() => setVfxReduced(!vfxReduced)}
            >
              <div className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        {/* Data */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>DATA</div>
          <button className={styles.dangerBtn} onClick={handleClearSave}>
            🗑️ Clear Save Data
          </button>
        </div>

        <div className={styles.version}>Lootburst Legends v0.1.0</div>
      </div>
    </div>
  )
}
