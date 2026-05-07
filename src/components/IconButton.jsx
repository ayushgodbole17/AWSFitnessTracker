import React from "react";
import "./IconButton.css";

const IconButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  size = 44,
  type = "button",
  disabled = false,
}) => (
  <button
    type={type}
    className={`icon-button icon-button--${variant}`}
    onClick={onClick}
    aria-label={label}
    title={label}
    disabled={disabled}
    style={{ width: size, height: size }}
  >
    <Icon size={Math.round(size * 0.45)} strokeWidth={2} />
  </button>
);

export default IconButton;
