import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BarChart3, Dumbbell, ListChecks, RefreshCw } from "lucide-react";

import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import WorkoutAnalytics from "./workoutAnalytics";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import { useWorkouts } from "./hooks/useWorkouts";
import "./HomePage.css";

const errorMessage = (error) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403) return "Session expired — please sign out and back in.";
  if (status >= 500) return "Server error — try again in a moment.";
  if (!error?.response) return "Network error — check your connection.";
  return "Failed to load workouts.";
};

const ErrorState = ({ message, onRetry, retrying }) => (
  <div className="error-state">
    <p className="error-state__msg">{message}</p>
    <button
      type="button"
      className="error-state__btn"
      onClick={() => onRetry()}
      disabled={retrying}
    >
      <RefreshCw size={16} className={retrying ? "is-spinning" : ""} />
      {retrying ? "Retrying…" : "Try again"}
    </button>
  </div>
);

const TABS = [
  { key: "uploadWorkout", label: "Log", icon: Dumbbell },
  { key: "viewWorkouts", label: "History", icon: ListChecks },
  { key: "analytics", label: "Insights", icon: BarChart3 },
];

const HomePage = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("uploadWorkout");
  const [editingWorkout, setEditingWorkout] = useState(null);

  const { data: workouts = [], isLoading, isError, error, refetch, isFetching } = useWorkouts();

  useEffect(() => {
    if (isError) toast.error(errorMessage(error));
  }, [isError, error]);

  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout);
    setActiveTab("uploadWorkout");
  };

  const handleWorkoutSave = () => {
    setEditingWorkout(null);
  };

  return (
    <div className="app-shell">
      <TopBar title="GD Fitness Tracker" onSignOut={onLogout} />

      <main className="app-main">
        {activeTab === "uploadWorkout" && (
          <UploadWorkout
            onWorkoutSave={handleWorkoutSave}
            editingWorkout={editingWorkout}
          />
        )}
        {activeTab === "viewWorkouts" && (
          isLoading ? (
            <p className="loading-msg">Loading workouts…</p>
          ) : isError ? (
            <ErrorState message={errorMessage(error)} onRetry={refetch} retrying={isFetching} />
          ) : (
            <GetWorkouts
              workouts={workouts}
              onEditWorkout={handleEditWorkout}
              onEmptyAction={() => setActiveTab("uploadWorkout")}
            />
          )
        )}
        {activeTab === "analytics" && (
          isLoading ? (
            <p className="loading-msg">Loading workouts…</p>
          ) : isError ? (
            <ErrorState message={errorMessage(error)} onRetry={refetch} retrying={isFetching} />
          ) : (
            <WorkoutAnalytics workouts={workouts} />
          )
        )}
      </main>

      <BottomNav items={TABS} activeKey={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default HomePage;
