import React, { useState } from "react";
import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import Chatbot from "./chatbot";
import { toast } from "react-toastify";
import "./HomePage.css";
import "./chatbot.css";

const HomePage = ({ onLogout }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingWorkout, setEditingWorkout] = useState(null);

  const handleWorkoutSave = () => {
    console.log("Workout save triggered.");
    setRefreshTrigger((prev) => prev + 1); // Trigger workout list refresh
    setEditingWorkout(null); // Reset editing state
  };

  const handleEditWorkout = (workout) => {
    console.log("Editing workout:", workout);
    setEditingWorkout(workout); // Pass workout to editing mode
    toast.info("Edit mode activated. Modify the workout in the form.");
  };

  return (
    <div className="container">
      <h2 className="page-title">Workout Tracker</h2>
      <button className="btn-danger" onClick={onLogout}>
        Sign Out
      </button>
      <div className="row">
        <div className="card">
          <UploadWorkout
            onWorkoutSave={handleWorkoutSave}
            editingWorkout={editingWorkout}
          />
        </div>
        <div className="card scroll-card">
          <GetWorkouts refreshTrigger={refreshTrigger} onEditWorkout={handleEditWorkout} />
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default HomePage;
