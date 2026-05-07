// Signed-weight convention: negative weight => assisted lift (e.g. assisted dips).
// Direction tracks strength: less negative = stronger over time.

export const toSignedWeight = ({ weight, isAssistance }) => {
  const abs = Math.abs(Number(weight));
  return isAssistance ? -abs : abs;
};

export const isAssistedWeight = (signed) => signed < 0;

export const formatWeight = (signed, weightType = "kg") => {
  const abs = Math.abs(signed).toFixed(2).replace(/\.00$/, "");
  return isAssistedWeight(signed) ? `${abs} ${weightType} (assisted)` : `${abs} ${weightType}`;
};

export const formatVolume = (signed, weightType = "kg") => {
  const abs = Math.abs(signed).toFixed(2);
  return isAssistedWeight(signed) ? `${abs} ${weightType} (assisted)` : `${abs} ${weightType}`;
};

// Compact volume for tight stat tiles. Drops the unit suffix.
//   < 1000   → "789"
//   < 10000  → "1.2k"
//   else     → "12.3k"
export const formatCompactVolume = (signed) => {
  const abs = Math.abs(signed);
  if (abs < 1000) return Math.round(abs).toString();
  if (abs < 10000) return `${(abs / 1000).toFixed(1)}k`;
  return `${(abs / 1000).toFixed(0)}k`;
};
