// Format a duration in seconds. Returns "—" if missing/zero.
//   < 1 min   → "<1m"
//   < 60 min  → "47m"
//   else      → "1h 15m"
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "—";
  const total = Math.round(seconds / 60);
  if (total < 1) return "<1m";
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// "6:23 PM"
export const formatTimeOfDay = (input) => {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const computeDurationSeconds = (startedAtMs, endedAtMs) => {
  if (!startedAtMs || !endedAtMs) return null;
  return Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000));
};
