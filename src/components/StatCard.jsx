import React from "react";
import "./StatCard.css";

const StatCard = ({ value, label, icon: Icon }) => (
  <div className="stat-card">
    {Icon && (
      <div className="stat-card__icon">
        <Icon size={18} strokeWidth={2.2} />
      </div>
    )}
    <div className="stat-card__value">{value}</div>
    <div className="stat-card__label">{label}</div>
  </div>
);

export default StatCard;
