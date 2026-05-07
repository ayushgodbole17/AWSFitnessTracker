import { useCallback, useEffect, useRef, useState } from "react";

export const useRestTimer = (defaultDuration = 90) => {
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(defaultDuration);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(0);
  }, []);

  const start = useCallback((nextDuration) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDuration(nextDuration);
    setSeconds(nextDuration);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { seconds, duration, isRunning: seconds > 0, start, stop };
};
