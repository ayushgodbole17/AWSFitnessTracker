import React from "react";
import "./BottomNav.css";

const BottomNav = ({ items, activeKey, onChange }) => (
  <nav className="bottom-nav" aria-label="Primary">
    <div className="bottom-nav__inner">
      {items.map(({ key, label, icon: Icon }) => {
        const active = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            className={`bottom-nav__item ${active ? "is-active" : ""}`}
            onClick={() => onChange(key)}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
