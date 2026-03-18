import React, { useState, useEffect } from "react";
import apiClient from "./apiClient";

import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import WorkoutAnalytics from "./workoutAnalytics";
import Chatbot from "./chatbot";
import "./HomePage.css";
import "./chatbot.css";

const HomePage = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("uploadWorkout");
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  // Whenever we need to refresh (or on initial mount), fetch the workouts
  useEffect(() => {
    fetchAllWorkouts();
  }, [refreshTrigger]);

  const fetchAllWorkouts = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    setLoadingWorkouts(true);
    try {
      const response = await apiClient.get("/GetPastWorkouts", { params: { email } });
      if (response.data && Array.isArray(response.data)) {
        setWorkouts(response.data);
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoadingWorkouts(false);
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
        {loadingWorkouts && activeTab !== "uploadWorkout" && (
          <p style={{ textAlign: "center", color: "#6c757d" }}>Loading workouts...</p>
        )}
        {activeTab === "uploadWorkout" && (
          <UploadWorkout
            onWorkoutSave={handleWorkoutSave}
            editingWorkout={editingWorkout}
          />
        )}
        {activeTab === "viewWorkouts" && (
          <GetWorkouts
            workouts={workouts}
            onEditWorkout={handleEditWorkout}
            onDeleteSuccess={() => setRefreshTrigger((prev) => prev + 1)}
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
