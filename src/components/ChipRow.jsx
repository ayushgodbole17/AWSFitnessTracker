import React from "react";
import "./ChipRow.css";

const ChipRow = ({ options, value, onChange, ariaLabel }) => (
  <div className="chip-row" role="radiogroup" aria-label={ariaLabel}>
    {options.map((opt) => {
      const optionValue = typeof opt === "string" ? opt : opt.value;
      const optionLabel = typeof opt === "string" ? opt : opt.label;
      const active = optionValue === value;
      return (
        <button
          key={optionValue}
          type="button"
          role="radio"
          aria-checked={active}
          className={`chip ${active ? "is-active" : ""}`}
          onClick={() => onChange(optionValue)}
        >
          {optionLabel}
        </button>
      );
    })}
  </div>
);

export default ChipRow;
