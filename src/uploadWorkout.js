import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./uploadWorkout.css";

const UploadWorkout = ({ onWorkoutSave }) => {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(""); // New state for workout date
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState({
    muscleGroup: "",
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
  });

  const muscleGroups = ["Chest", "Legs", "Back", "Shoulders", "Arms"];
  const exercisesList = {
    Chest: [
      "Dumbbell Bench Press",
      "Dumbbell Incline Press",
      "Barbell Bench Press",
      "Barbell Incline Press",
      "Chest Press Machine",
      "Cable Crossovers",
      "Incline Cable Crossovers",
      "Decline Cable Crossovers",
      "Dips",
      "Assisted Dips",
    ],
    Legs: [
      "Leg Extensions",
      "Hamstring Curls",
      "Calf Raises",
      "Glute Machine",
      "Hip Thrusts",
      "Abductor Machine",
      "Adductor Machine",
      "Leg Press",
      "Squats",
      "Deadlifts",
    ],
    Back: [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups",
      "Dumbbell Rows",
      "Barbell Rows",
      "Cable Rows",
      "Lat Pulldown",
      "High Row Machine",
      "Low Row Machine",
      "Back Extensions Bench",
      "Back Extensions Machine",
    ],
    Arms: [
      "Tricep Press Machine",
      "Tricep Extensions",
      "Dumbbell Kickbacks",
      "Bicep Curls Dumbbell",
      "Bicep Curls Barbell",
      "Bicep Curls Cable",
      "Reverse Curls Cable",
      "Reverse Curls Dumbbell",
      "Reverse Curls Barbell",
    ],
    Shoulders: [
      "Shoulder Press Machine",
      "Front Raises",
      "Lateral Raises",
      "Face Pulls",
      "Rotator Cuff Band",
    ],
  };

  const handleInputChange = (field, value) => {
    setCurrentExercise({
      ...currentExercise,
      [field]: value,
    });
  };

  const addExercise = () => {
    if (
      !currentExercise.muscleGroup ||
      !currentExercise.exercise ||
      !currentExercise.sets ||
      !currentExercise.reps ||
      !currentExercise.weight
    ) {
      toast.error("Please fill out all fields for the exercise.");
      return;
    }

    setExercises([...exercises, { ...currentExercise }]);
    setCurrentExercise({
      muscleGroup: "",
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    if (!workoutDate) {
      toast.error("Please provide a workout date.");
      return;
    }

    if (exercises.length === 0) {
      toast.error("Please add at least one exercise to save the workout.");
      return;
    }

    const workoutData = {
      userID,
      workoutName: workoutName || "Untitled Workout", // Default to "Untitled Workout" if no name provided
      workoutDate,
      exercises: exercises.map((exercise) => ({
        muscleGroup: exercise.muscleGroup,
        exercise: exercise.exercise,
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weight: Number(exercise.weight),
      })),
    };

    try {
      await axios.post(
        "https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/saveWorkout",
        workoutData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Workout saved successfully!");
      setWorkoutName("");
      setWorkoutDate("");
      setExercises([]);
      if (onWorkoutSave) {
        onWorkoutSave();
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout. Please try again.");
    }
  };

  return (
    <div className="upload-workout-container">
      <h3 className="card-header">Create a New Workout</h3>
      <form onSubmit={handleSubmit} className="workout-form">
        <div className="workout-name-container">
          <input
            type="text"
            placeholder="Workout Name (Optional)"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="input-workout-name"
          />
        </div>
        <div className="workout-date-container">
          <label htmlFor="workout-date">Workout Date:</label>
          <input
            type="date"
            id="workout-date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="input-workout-date"
            required
          />
        </div>
        <div className="exercise-card">
          <div className="exercise-header">
            <h4>Add an Exercise</h4>
          </div>
          <div className="exercise-inputs">
            <select
              value={currentExercise.muscleGroup}
              onChange={(e) => handleInputChange("muscleGroup", e.target.value)}
              className="select-input"
            >
              <option value="">Select Muscle Group</option>
              {muscleGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <select
              value={currentExercise.exercise}
              onChange={(e) => handleInputChange("exercise", e.target.value)}
              disabled={!currentExercise.muscleGroup}
              className="select-input"
            >
              <option value="">Select Exercise</option>
              {currentExercise.muscleGroup &&
                exercisesList[currentExercise.muscleGroup].map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
            </select>
            <input
              type="number"
              placeholder="Sets"
              value={currentExercise.sets}
              onChange={(e) => handleInputChange("sets", e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Reps"
              value={currentExercise.reps}
              onChange={(e) => handleInputChange("reps", e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              value={currentExercise.weight}
              onChange={(e) => handleInputChange("weight", e.target.value)}
              className="input-field"
            />
          </div>
          <div className="button-group">
            <button type="button" className="add-btn" onClick={addExercise}>
              Add Exercise
            </button>
          </div>
        </div>
        <div className="button-group">
          <button type="submit" className="save-btn">
            Save Workout
          </button>
        </div>
      </form>

      {/* Current Workout Summary */}
      <div className="current-workout-summary">
        <h4>Current Workout</h4>
        {workoutName && <h5>{workoutName}</h5>}
        {workoutDate && <p>Date: {workoutDate}</p>}
        {exercises.length > 0 && (
          <ul className="exercise-summary-list">
            {exercises.map((exercise, index) => (
              <li key={index} className="exercise-summary-item">
                <strong>{exercise.exercise}</strong> - {exercise.sets} sets of{" "}
                {exercise.reps} reps at {exercise.weight} kg (
                {exercise.muscleGroup})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UploadWorkout;
