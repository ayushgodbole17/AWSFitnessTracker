import { useEffect, useRef } from "react";

const DEBOUNCE_MS = 400;

// Debounced localStorage persistence. Avoids writes on every keystroke and
// exposes clearDraft() to call after a successful submit.
export const useFormDraft = (key, value) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignore quota errors.
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [key, value]);
};

export const loadDraft = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearDraft = (key) => {
  localStorage.removeItem(key);
};
