import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./uploadWorkout.css";

const UploadWorkout = ({ onWorkoutSave, editingWorkout }) => {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState("");
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState({
    muscleGroup: "",
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    weightType: "kg",
    isAssistance: false,
  });
  const [editIndex, setEditIndex] = useState(null);

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
  const weightTypes = ["kg", "machine"];

  useEffect(() => {
    if (editingWorkout) {
      console.log("Editing workout:", editingWorkout);
      setWorkoutName(editingWorkout.workoutName || "");
      setWorkoutDate(editingWorkout.workoutDate || "");
      setExercises(editingWorkout.exercises || []);
    } else {
      resetForm();
    }
  }, [editingWorkout]);

  const resetForm = () => {
    setWorkoutName("");
    setWorkoutDate("");
    setExercises([]);
    setCurrentExercise({
      muscleGroup: "",
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
      weightType: "kg",
      isAssistance: false,
    });
    setEditIndex(null);
  };

  const handleInputChange = (field, value) => {
    setCurrentExercise({
      ...currentExercise,
      [field]: value,
    });
  };

  const addOrUpdateExercise = () => {
    const { muscleGroup, exercise, sets, reps, weight } = currentExercise;

    if (!muscleGroup || !exercise || !sets || !reps || !weight) {
      toast.error("Please fill out all fields for the exercise.");
      return;
    }

    const newExercise = { ...currentExercise };

    if (editIndex !== null) {
      const updatedExercises = [...exercises];
      updatedExercises[editIndex] = newExercise;
      setExercises(updatedExercises);
      setEditIndex(null);
      toast.success("Exercise updated successfully!");
    } else {
      setExercises([...exercises, newExercise]);
      toast.success("Exercise added successfully!");
    }

    setCurrentExercise({
      muscleGroup: "",
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
      weightType: "kg",
      isAssistance: false,
    });
  };

  const editExercise = (index) => {
    setCurrentExercise(exercises[index]);
    setEditIndex(index);
  };

  const deleteExercise = (index) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
    toast.success("Exercise removed.");
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

    const workoutData = {
      userID,
      workoutID: editingWorkout?.workoutID || null,
      workoutName: workoutName || "Untitled Workout",
      workoutDate,
      exercises: exercises.map((exercise) => ({
        muscleGroup: exercise.muscleGroup,
        exercise: exercise.exercise,
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weight: exercise.isAssistance
          ? -Math.abs(Number(exercise.weight))
          : Math.abs(Number(exercise.weight)),
        weightType: exercise.weightType,
        isAssistance: exercise.isAssistance,
      })),
    };

    const url = editingWorkout
      ? `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/updateWorkout`
      : `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/saveWorkout`;

    try {
      console.log("Submitting workout data:", JSON.stringify(workoutData, null, 2));
      const response = await axios.post(url, workoutData);
      console.log("Workout saved successfully:", response.data);
      toast.success(editingWorkout ? "Workout updated successfully!" : "Workout saved successfully!");
      onWorkoutSave();
      resetForm();
    } catch (error) {
      console.error("Error saving workout:", error.response || error);
      toast.error("Failed to save workout. Please try again.");
    }
  };

  return (
    <div className="upload-workout-container">
      <h3>{editingWorkout ? "Edit Workout" : "Create a New Workout"}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Workout Name (Optional)"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="exercise-input"
          />
          <input
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="exercise-input"
            required
          />
        </div>
        <div className="exercise-card">
          <h4>{editIndex !== null ? "Edit Exercise" : "Add Exercise"}</h4>
          <div className="exercise-input-row">
            <label className="form-label">Muscle Group:</label>
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

            <label className="form-label">Exercise:</label>
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
          </div>

          <div className="exercise-input-row">
            <label className="form-label">Sets:</label>
            <input
              type="number"
              placeholder="Sets"
              value={currentExercise.sets}
              onChange={(e) => handleInputChange("sets", e.target.value)}
              className="short-input"
            />

            <label className="form-label">Reps:</label>
            <input
              type="number"
              placeholder="Reps"
              value={currentExercise.reps}
              onChange={(e) => handleInputChange("reps", e.target.value)}
              className="short-input"
            />

            <label className="form-label">Weight:</label>
            <input
              type="number"
              placeholder="Weight"
              value={currentExercise.weight}
              onChange={(e) => handleInputChange("weight", e.target.value)}
              className="short-input"
            />
          </div>

          <div className="exercise-input-row">
            <label className="form-label">Weight Type:</label>
            <select
              value={currentExercise.weightType}
              onChange={(e) => handleInputChange("weightType", e.target.value)}
              className="select-input"
            >
              {weightTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label className="form-label">Assistance:</label>
            <select
              value={currentExercise.isAssistance}
              onChange={(e) =>
                handleInputChange("isAssistance", e.target.value === "true")
              }
              className="select-input"
            >
              <option value="false">Regular</option>
              <option value="true">Assisted</option>
            </select>
          </div>
          <div className="button-group">
            <button type="button" onClick={addOrUpdateExercise}>
              {editIndex !== null ? "Update Exercise" : "Add Exercise"}
            </button>
          </div>
        </div>
        <div className="current-workout-summary">
          <h4>Current Exercises</h4>
          {exercises.length > 0 && (
            <ul>
              {exercises.map((exercise, index) => (
                <li key={index}>
                  {exercise.exercise} - {exercise.sets} sets of {exercise.reps} reps at{" "}
                  {exercise.weight} {exercise.weightType} (
                  {exercise.isAssistance ? "Assisted" : "Regular"})
                  <button onClick={() => editExercise(index)}>Edit</button>
                  <button onClick={() => deleteExercise(index)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit">{editingWorkout ? "Update Workout" : "Save Workout"}</button>
      </form>
    </div>
  );
};

export default UploadWorkout;
