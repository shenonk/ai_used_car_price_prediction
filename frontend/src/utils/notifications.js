const READ_NOTIFICATIONS_KEY = "carpriceai_read_notifications"
const DISMISSED_NOTIFICATIONS_KEY = "carpriceai_dismissed_notifications"

function buildScopedKey(baseKey, user) {
  const scope =
    user?.id ||
    user?.email ||
    user?.username ||
    "guest"

  return `${baseKey}_${String(scope)}`
}

function readStoredIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeStoredIds(key, ids) {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]))
}

export function loadReadNotificationIds(user) {
  return readStoredIds(buildScopedKey(READ_NOTIFICATIONS_KEY, user))
}

export function loadDismissedNotificationIds(user) {
  return readStoredIds(buildScopedKey(DISMISSED_NOTIFICATIONS_KEY, user))
}

export function markNotificationAsRead(user, id) {
  const key = buildScopedKey(READ_NOTIFICATIONS_KEY, user)
  const readIds = readStoredIds(key)
  if (!readIds.includes(id)) {
    writeStoredIds(key, [...readIds, id])
  }
}

export function markAllNotificationsAsRead(user, ids) {
  const key = buildScopedKey(READ_NOTIFICATIONS_KEY, user)
  const readIds = readStoredIds(key)
  writeStoredIds(key, [...readIds, ...ids])
}

export function dismissNotification(user, id) {
  const key = buildScopedKey(DISMISSED_NOTIFICATIONS_KEY, user)
  const dismissedIds = readStoredIds(key)
  if (!dismissedIds.includes(id)) {
    writeStoredIds(key, [...dismissedIds, id])
  }
}

export function inferNotificationType(title = "") {
  const normalized = String(title).toLowerCase()
  if (normalized.includes("alert")) {
    return "info"
  }
  if (normalized.includes("rate") || normalized.includes("new")) {
    return "success"
  }
  return "default"
}
