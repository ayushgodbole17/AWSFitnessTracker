import React, { useState, useEffect } from "react";
import axios from "axios";

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

  // Whenever we need to refresh (or on initial mount), fetch the workouts
  useEffect(() => {
    fetchAllWorkouts();
  }, [refreshTrigger]);

  const fetchAllWorkouts = async () => {
    const email = localStorage.getItem("email");
    if (!email) {
      console.error("No user email found in localStorage.");
      return;
    }

    try {
      // Your existing API endpoint
      const response = await axios.get(
        "https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/GetPastWorkouts",
        { params: { email } }
      );

      if (response.data && Array.isArray(response.data)) {
        // Sort or transform if desired
        setWorkouts(response.data);
      } else {
        console.error("Invalid workout data format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  };

  // Switch to "uploadWorkout" tab after editing
  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout);
    setActiveTab("uploadWorkout");
  };

  // After saving, increment refreshTrigger to re-fetch
  const handleWorkoutSave = () => {
    setEditingWorkout(null);
    setRefreshTrigger((prev) => prev + 1); 
  };

  return (
    <div className="home-container">
      {/* Title and Sign Out Button */}
      <header className="home-header">
      <h1 className="main-title">GD Fitness Tracker</h1>
      <button onClick={onLogout} className="sign-out-btn">Sign Out</button>
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
            // We no longer fetch inside this component
            // We just pass the workouts down for display
            workouts={workouts}
            onEditWorkout={handleEditWorkout}
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
