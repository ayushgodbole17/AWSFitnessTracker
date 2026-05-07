import React from "react";
import "./SegmentedControl.css";

const SegmentedControl = ({ options, value, onChange, ariaLabel }) => (
  <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={String(opt.value)}
          type="button"
          role="radio"
          aria-checked={active}
          className={`segmented__item ${active ? "is-active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
