type HapticStyle = 'light' | 'medium' | 'heavy' | 'double'

let _hapticsEnabled = true

export function setHapticsEnabled(v: boolean) { _hapticsEnabled = v }

export function haptic(style: HapticStyle) {
  if (!_hapticsEnabled) return
  if (!navigator.vibrate) return

  switch (style) {
    case 'light':  navigator.vibrate(10); break
    case 'medium': navigator.vibrate(20); break
    case 'heavy':  navigator.vibrate([30, 10, 30]); break
    case 'double': navigator.vibrate([20, 10, 20, 10, 40]); break
  }
}
