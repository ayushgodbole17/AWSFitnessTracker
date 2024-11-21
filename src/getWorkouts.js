import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./getWorkouts.css";

const GetWorkouts = ({ refreshTrigger }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch workouts data
  const fetchWorkouts = async () => {
    const email = localStorage.getItem("email");
    if (!email) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/GetPastWorkouts?email=${email}`
      );
      setWorkouts(response.data);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      toast.error("Failed to fetch workouts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger the fetch when the component mounts and when refreshTrigger changes
  useEffect(() => {
    fetchWorkouts();
  }, [refreshTrigger]);

  return (
    <div className="workouts-container">
      {loading ? (
        <div>Loading...</div>
      ) : workouts.length > 0 ? (
        <ul className="workout-list">
          {workouts.map((workout, workoutIndex) => (
            <li key={workout.workoutID} className="workout-item">
              <h4 className="workout-title">
                {workout.workoutName || `Workout ${workoutIndex + 1}`}
              </h4>
              <p className="workout-date">
                Date: {new Date(workout.date).toLocaleDateString()}
              </p>
              <ul className="exercise-list">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <li key={exerciseIndex} className="exercise-item">
                    <strong>{exercise.exercise}</strong> - {exercise.sets} sets of {exercise.reps} reps at{" "}
                    {exercise.weight} kg ({exercise.muscleGroup})
                  </li>
                ))}
              </ul>
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
