import React from "react";
import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import "./HomePage.css";

const HomePage = ({ onLogout }) => {
  return (
    <div className="home-container">
      <div className="card-container">
        <UploadWorkout />
      </div>

      <div className="card-container">
        <GetWorkouts />
      </div>
    </div>
  );
};

export default HomePage;
