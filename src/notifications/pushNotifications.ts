// Local Web Notifications, no server required.
// Schedules chest-ready and free-key-ready reminders via setTimeout.
// Persists scheduled times to localStorage so reminders survive soft reloads.

const STORAGE_KEY = 'lootburst_notif_schedule'

interface Schedule {
  chestAt:  number  // epoch ms
  freeKeyAt: number // epoch ms
}

function loadSchedule(): Schedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { chestAt: 0, freeKeyAt: 0 }
}

function saveSchedule(s: Schedule) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

let _chestTimer:  ReturnType<typeof setTimeout> | null = null
let _freeKeyTimer: ReturnType<typeof setTimeout> | null = null
let _permissionGranted = false

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationsGranted(): boolean {
  return notificationsSupported() && Notification.permission === 'granted'
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') { _permissionGranted = true; return true }
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  _permissionGranted = result === 'granted'
  return _permissionGranted
}

function show(title: string, body: string, tag: string) {
  if (!notificationsGranted()) return
  try {
    new Notification(title, {
      body,
      tag,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      silent: false,
    })
  } catch { /* some browsers block even with permission */ }
}

function scheduleTimer(
  msFromNow: number,
  fire: () => void,
  existing: ReturnType<typeof setTimeout> | null,
): ReturnType<typeof setTimeout> {
  if (existing !== null) clearTimeout(existing)
  if (msFromNow <= 0) { fire(); return null as unknown as ReturnType<typeof setTimeout> }
  return setTimeout(fire, Math.min(msFromNow, 2_147_483_647))
}

export function scheduleChestNotification(readyAtMs: number) {
  if (!notificationsSupported()) return
  const schedule = loadSchedule()
  schedule.chestAt = readyAtMs
  saveSchedule(schedule)

  const delay = readyAtMs - Date.now()
  _chestTimer = scheduleTimer(delay, () => {
    show(
      'Daily Chest Ready',
      'Your daily loot chest is waiting. Open it before your streak resets.',
      'daily_chest',
    )
  }, _chestTimer)
}

export function scheduleFreeKeyNotification(readyAtMs: number) {
  if (!notificationsSupported()) return
  const schedule = loadSchedule()
  schedule.freeKeyAt = readyAtMs
  saveSchedule(schedule)

  const delay = readyAtMs - Date.now()
  _freeKeyTimer = scheduleTimer(delay, () => {
    show(
      'Free Capsule Key Ready',
      'Open a hero capsule with your free key.',
      'free_key',
    )
  }, _freeKeyTimer)
}

export function cancelChestNotification() {
  if (_chestTimer !== null) { clearTimeout(_chestTimer); _chestTimer = null }
  const s = loadSchedule(); s.chestAt = 0; saveSchedule(s)
}

export function cancelFreeKeyNotification() {
  if (_freeKeyTimer !== null) { clearTimeout(_freeKeyTimer); _freeKeyTimer = null }
  const s = loadSchedule(); s.freeKeyAt = 0; saveSchedule(s)
}

export function restoreNotificationSchedule() {
  if (!notificationsGranted()) return
  const s = loadSchedule()
  if (s.chestAt  > Date.now()) scheduleChestNotification(s.chestAt)
  if (s.freeKeyAt > Date.now()) scheduleFreeKeyNotification(s.freeKeyAt)
}
