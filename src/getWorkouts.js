import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./getWorkouts.css";

const GetWorkouts = ({ refreshTrigger, onEditWorkout, setWorkouts }) => {
  const [workouts, setWorkoutList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState(null);

  // Fetch user's workouts from API
  const fetchWorkouts = async () => {
    const email = localStorage.getItem("email");
    if (!email) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching workouts for email:", email);
      const response = await axios.get(
        "https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/GetPastWorkouts",
        { params: { email } }
      );
      console.log("Fetched workouts:", response.data);

      // Sort workouts by date (newest first)
      const sortedWorkouts = [...(response.data || [])].sort((a, b) => {
        // If a date is missing, keep it at the bottom
        if (!a.workoutDate) return 1;
        if (!b.workoutDate) return -1;
        return new Date(b.workoutDate) - new Date(a.workoutDate);
      });

      // Update local state (for display) and parent state (for analytics)
      setWorkoutList(sortedWorkouts);
      setWorkouts(sortedWorkouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      toast.error("Failed to fetch workouts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a workout
  const handleDeleteWorkout = async (workoutID) => {
    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this workout?")) return;

    try {
      console.log("Deleting workout with ID:", workoutID, "for user:", userID);
      await axios.delete(
        "https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/deleteWorkout",
        {
          params: {
            workoutID,
            userID,
          },
        }
      );
      toast.success("Workout deleted successfully.");
      // Refetch workouts to update the list
      fetchWorkouts();
    } catch (error) {
      console.error("Error deleting workout:", error.response || error);
      toast.error("Failed to delete workout. Please try again.");
    }
  };

  // Expand/Collapse a workout’s details
  const toggleExpandWorkout = (workoutID) => {
    setExpandedWorkout((prev) => (prev === workoutID ? null : workoutID));
  };

  // Fetch workouts whenever refreshTrigger changes
  useEffect(() => {
    fetchWorkouts();
    // eslint-disable-next-line
  }, [refreshTrigger]);

  return (
    <div className="main-container">
      {/* Section Heading */}
      <div className="section-divider">
        <h2 className="section-heading">Your Workouts</h2>
      </div>

      {/* Past Workouts */}
      <div className="workouts-container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : workouts.length > 0 ? (
          <ul className="workout-list">
            {workouts.map((workout) => (
              <li key={workout.workoutID} className="workout-item">
                <div
                  className="workout-header"
                  onClick={() => toggleExpandWorkout(workout.workoutID)}
                >
                  <h4 className="workout-title">
                    {workout.workoutName || "Untitled Workout"} -{" "}
                    {workout.workoutDate
                      ? new Date(workout.workoutDate).toLocaleDateString()
                      : "Unknown Date"}
                  </h4>
                </div>
                {expandedWorkout === workout.workoutID && (
                  <ul className="exercise-list">
                    {(workout.exercises || []).map((exercise, index) => (
                      <li key={index} className="exercise-item">
                        <strong>{exercise.exercise}</strong> - {exercise.sets}{" "}
                        sets of {exercise.reps} reps at {exercise.weight}{" "}
                        {exercise.weightType} (
                        {exercise.isAssistance ? "Assisted" : "Regular"})
                      </li>
                    ))}
                  </ul>
                )}
                <div className="workout-actions">
                  <button
                    className="edit-btn"
                    onClick={() => {
                      if (typeof onEditWorkout === "function") {
                        onEditWorkout(workout);
                      } else {
                        console.error("onEditWorkout is not a function");
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteWorkout(workout.workoutID)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-workouts">No workouts found.</p>
        )}
      </div>
    </div>
  );
};

export default GetWorkouts;
