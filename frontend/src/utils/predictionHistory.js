const PREDICTION_HISTORY_STORAGE_KEY = "autovaluelk_prediction_history";

export function loadPredictionHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PREDICTION_HISTORY_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item === "object")
      .sort((a, b) => (b.predictedAt || 0) - (a.predictedAt || 0));
  } catch (error) {
    console.error("Failed to load prediction history:", error);
    return [];
  }
}

export function savePredictionHistoryEntry(entry) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const existing = loadPredictionHistory();
    const next = [
      {
        id: entry.id || `prediction-${Date.now()}`,
        brand: entry.brand,
        model: entry.model,
        year: entry.year,
        predictedPrice: entry.predictedPrice,
        predictedAt: entry.predictedAt || Date.now(),
      },
      ...existing,
    ].slice(0, 50);

    window.localStorage.setItem(PREDICTION_HISTORY_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("Failed to save prediction history:", error);
    return loadPredictionHistory();
  }
}

export function deletePredictionHistoryEntry(entryId) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const existing = loadPredictionHistory();
    const next = existing.filter((item) => item?.id !== entryId);
    window.localStorage.setItem(PREDICTION_HISTORY_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("Failed to delete prediction history entry:", error);
    return loadPredictionHistory();
  }
}

export { PREDICTION_HISTORY_STORAGE_KEY };
