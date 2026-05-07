import React from "react";

const PRESETS = [60, 90, 120, 180];

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const formatPresetLabel = (s) => (s >= 120 ? `${s / 60}m` : `${s}s`);

const RestTimer = ({ seconds, duration, isRunning, onStart, onStop, showPresets }) => {
  if (isRunning) {
    return (
      <div className="rest-timer">
        <span className="rest-timer-display">Rest: {formatTime(seconds)}</span>
        <button type="button" className="rest-timer-stop" onClick={onStop}>
          Skip
        </button>
      </div>
    );
  }

  if (!showPresets) return null;

  return (
    <div className="rest-timer-presets">
      <span className="rest-timer-label">Rest:</span>
      {PRESETS.map((s) => (
        <button
          key={s}
          type="button"
          className={`rest-preset-btn ${duration === s ? "active" : ""}`}
          onClick={() => onStart(s)}
        >
          {formatPresetLabel(s)}
        </button>
      ))}
    </div>
  );
};

export default RestTimer;
