import React, { useState } from "react";
import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import WorkoutAnalytics from "./workoutAnalytics";
import Chatbot from "./chatbot";
import "./HomePage.css";
import "./chatbot.css";

const HomePage = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("uploadWorkout"); // Default to the first tab
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [workouts, setWorkouts] = useState([]);

  // Modified here to also switch to the "uploadWorkout" tab after setting the editingWorkout
  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout);
    setActiveTab("uploadWorkout"); // <-- This line ensures the tab switches.
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
        <button onClick={onLogout}>Sign Out</button>
      </header>

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "uploadWorkout" ? "active" : ""}`}
          onClick={() => setActiveTab("uploadWorkout")}
        >
          Upload Workout
        </button>
        <button
          className={`tab-btn ${activeTab === "viewWorkouts" ? "active" : ""}`}
          onClick={() => setActiveTab("viewWorkouts")}
        >
          View Workouts
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "uploadWorkout" && (
          <UploadWorkout
            onWorkoutSave={handleWorkoutSave}
            editingWorkout={editingWorkout}
          />
        )}
        {activeTab === "viewWorkouts" && (
          <GetWorkouts
            refreshTrigger={refreshTrigger}
            onEditWorkout={handleEditWorkout}
            setWorkouts={setWorkouts} // Pass workouts to HomePage state
          />
        )}
        {activeTab === "analytics" && <WorkoutAnalytics workouts={workouts} />}
      </div>

      {/* Chatbot Section */}
      <div className="chatbot-container">
        <Chatbot workouts={workouts} />
      </div>
    </div>
  );
};

export default HomePage;
