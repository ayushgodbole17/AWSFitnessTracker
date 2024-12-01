import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./getWorkouts.css";

const GetWorkouts = ({ refreshTrigger, onEditWorkout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);

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
        `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/GetPastWorkouts`,
        { params: { email } }
      );
      console.log("Fetched workouts:", response.data); // Directly use response.data
      setWorkouts(response.data || []); // Set state with the array of workouts
    } catch (error) {
      console.error("Error fetching workouts:", error);
      toast.error("Failed to fetch workouts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutID) => {
    const userID = localStorage.getItem("email"); // Retrieve the userID
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }
  
    if (!window.confirm("Are you sure you want to delete this workout?")) return;
  
    try {
      console.log("Deleting workout with ID:", workoutID, "for user:", userID);
      const response = await axios.delete(
        `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/deleteWorkout`,
        {
          params: {
            workoutID,
            userID,
          },
        }
      );
      console.log("Workout deleted successfully:", response.data);
      toast.success("Workout deleted successfully.");
      fetchWorkouts(); // Refresh the workouts list
    } catch (error) {
      console.error("Error deleting workout:", error.response || error);
      toast.error("Failed to delete workout. Please try again.");
    }
  };
  

  useEffect(() => {
    fetchWorkouts();
  }, [refreshTrigger]);

  return (
    <div className="workouts-container">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : workouts.length > 0 ? (
        <ul className="workout-list">
          {workouts.map((workout) => (
            <li key={workout.workoutID} className="workout-item">
              <div className="workout-header">
                <h4 className="workout-title">
                  {workout.workoutName || "Untitled Workout"}
                </h4>
                <p className="workout-date">
                  Date:{" "}
                  {workout.workoutDate
                    ? new Date(workout.workoutDate).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <ul className="exercise-list">
                {workout.exercises.map((exercise, index) => (
                  <li key={index} className="exercise-item">
                    <strong>{exercise.exercise}</strong> - {exercise.sets} sets of{" "}
                    {exercise.reps} reps at {exercise.weight} {exercise.weightType} (
                    {exercise.isAssistance ? "Assisted" : "Regular"})
                  </li>
                ))}
              </ul>
              <div className="workout-actions">
                <button
                  className="edit-btn"
                  onClick={() => onEditWorkout(workout)}
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
  );
};

export default GetWorkouts;
