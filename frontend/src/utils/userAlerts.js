const ALERTS_BASE_KEY = "carpriceai_alerts";
const PREFS_BASE_KEY = "carpriceai_notification_prefs";

function normalizeUserKey(user) {
  return user?.id || user?.email || "guest";
}

export function getAlertsStorageKey(user) {
  return `${ALERTS_BASE_KEY}:${normalizeUserKey(user)}`;
}

export function getPrefsStorageKey(user) {
  return `${PREFS_BASE_KEY}:${normalizeUserKey(user)}`;
}

export function loadUserAlerts(user) {
  const scopedKey = getAlertsStorageKey(user);
  const scopedAlerts = JSON.parse(localStorage.getItem(scopedKey) || "null");

  if (Array.isArray(scopedAlerts)) {
    return scopedAlerts;
  }

  // One-time fallback for older shared local data so existing alerts do not disappear.
  const legacyAlerts = JSON.parse(localStorage.getItem(ALERTS_BASE_KEY) || "[]");
  if (legacyAlerts.length > 0) {
    localStorage.setItem(scopedKey, JSON.stringify(legacyAlerts));
    return legacyAlerts;
  }

  return [];
}

export function saveUserAlerts(user, alerts) {
  localStorage.setItem(getAlertsStorageKey(user), JSON.stringify(alerts));
}

export function upsertUserAlert(user, alert) {
  const existingAlerts = loadUserAlerts(user);
  const existingIndex = existingAlerts.findIndex(
    (item) => item.predictionKey && item.predictionKey === alert.predictionKey
  );

  if (existingIndex >= 0) {
    const updatedAlerts = [...existingAlerts];
    updatedAlerts[existingIndex] = { ...updatedAlerts[existingIndex], ...alert };
    saveUserAlerts(user, updatedAlerts);
    return updatedAlerts;
  }

  const updatedAlerts = [alert, ...existingAlerts];
  saveUserAlerts(user, updatedAlerts);
  return updatedAlerts;
}
