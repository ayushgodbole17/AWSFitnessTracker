import { useEffect, useState } from "react";

// Returns elapsed seconds since `startedAtMs`, ticking every `tickMs`.
// Returns 0 when startedAtMs is null/undefined.
export const useElapsed = (startedAtMs, tickMs = 30000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAtMs) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [startedAtMs, tickMs]);

  if (!startedAtMs) return 0;
  return Math.max(0, Math.floor((now - startedAtMs) / 1000));
};
