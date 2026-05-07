import React from "react";
import { LogOut } from "lucide-react";
import IconButton from "./IconButton";
import "./TopBar.css";

const TopBar = ({ title, onSignOut }) => (
  <header className="top-bar">
    <div className="top-bar__inner">
      <h1 className="top-bar__title">{title}</h1>
      {onSignOut && (
        <IconButton icon={LogOut} label="Sign out" onClick={onSignOut} variant="ghost" />
      )}
    </div>
  </header>
);

export default TopBar;
