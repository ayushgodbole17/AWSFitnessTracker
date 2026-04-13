import React, { useState, useEffect } from "react";
import apiClient from "./apiClient";
import { toast } from "react-toastify";

import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import WorkoutAnalytics from "./workoutAnalytics";
import "./HomePage.css";

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
    if (!email) {
      setLoadingWorkouts(false);
      return;
    }

    setLoadingWorkouts(true);
    try {
      const response = await apiClient.get("/GetPastWorkouts", { params: { email } });
      if (response.data && Array.isArray(response.data)) {
        setWorkouts(response.data);
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
      toast.error("Failed to load workouts. Please try again.");
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
        {activeTab === "uploadWorkout" && (
          <UploadWorkout
            onWorkoutSave={handleWorkoutSave}
            editingWorkout={editingWorkout}
            workouts={workouts}
          />
        )}
        {activeTab === "viewWorkouts" && (
          loadingWorkouts ? (
            <p className="loading-msg">Loading workouts...</p>
          ) : (
            <GetWorkouts
              workouts={workouts}
              onEditWorkout={handleEditWorkout}
              onDeleteSuccess={() => setRefreshTrigger((prev) => prev + 1)}
            />
          )
        )}
        {activeTab === "analytics" && (
          loadingWorkouts ? (
            <p className="loading-msg">Loading workouts...</p>
          ) : (
            <WorkoutAnalytics workouts={workouts} />
          )
        )}
      </div>

    </div>
  );
};

export default HomePage;
