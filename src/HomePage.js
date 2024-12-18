import React, { useState } from "react";
import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import WorkoutAnalytics from "./workoutAnalytics";
import Chatbot from "./chatbot";
import "./HomePage.css";
import "./chatbot.css"; // Import chatbot styles as well

const HomePage = ({ onLogout }) => {
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [workouts, setWorkouts] = useState([]);

  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout);
  };

  const handleWorkoutSave = () => {
    setEditingWorkout(null);
    setRefreshTrigger(refreshTrigger + 1); // Refresh the list after saving
  };

  return (
    <div className="home-container">
      {/* Title and Sign Out Button */}
      <header className="home-header">
        <h1 className="main-title">GD Fitness Tracker</h1>
        <button onClick={onLogout}>
          Sign Out
        </button>
      </header>

      {/* Workout and Analytics Sections */}
      <div className="card-container">
        <UploadWorkout
          onWorkoutSave={handleWorkoutSave}
          editingWorkout={editingWorkout}
        />
      </div>

      <div className="card-container">
        <GetWorkouts
          refreshTrigger={refreshTrigger}
          onEditWorkout={handleEditWorkout}
          setWorkouts={setWorkouts} // Pass workouts to HomePage state
        />
      </div>

      <div className="card-container">
        <WorkoutAnalytics workouts={workouts} />
      </div>

      {/* Chatbot Section */}
      <div className="chatbot-container">
        <Chatbot />
      </div>
    </div>
  );
};

export default HomePage;
