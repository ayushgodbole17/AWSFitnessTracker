import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import apiClient from "./apiClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./uploadWorkout.css";

const UploadWorkout = ({ onWorkoutSave = () => {}, editingWorkout, workouts = [] }) => {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
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
  const [setLogging, setSetLogging] = useState(false);

  // Rest timer state
  const [restSeconds, setRestSeconds] = useState(0);
  const [restDuration, setRestDuration] = useState(90);
  const timerRef = useRef(null);

  const muscleGroups = ["Chest", "Legs", "Back", "Shoulders", "Arms", "Abs"];
  const exercisesList = {
    Chest: [
      "Pushups",
      "Deficit Pushups",
      "Dips",
      "Dumbbell Bench Press",
      "Dumbbell Incline Press",
      "Barbell Bench Press",
      "Barbell Incline Press",
      "Smith Machine Bench Press",
      "Chest Press Machine",
      "Chest Press",
      "Incline Press Machine",
      "Flat Press Machine",
      "Cable Crossovers",
      "Incline Cable Crossovers",
      "Decline Cable Crossovers",
      "Pec Deck"
    ],
    Legs: [
      "Barbell Squats",
      "Smith Machine Squats",
      "Hack Squat",
      "Leg Press",
      "Leg Extensions",
      "Deadlifts",
      "Seated Hamstring Curls",
      "Lying Hamstring Curl",
      "Smith Machine Goodmornings",
      "Romanian Deadlifts",
      "Bulgarian Split Squats",
      "Calf Raises",
      "Seated Calf Raises",
      "Tib Raises",
      "Lying Glute Machine",
      "Standing Glute Machine",
      "Hip Thrusts",
      "Abductor Machine",
      "Adductor Machine",
      "Dumbbell Lunges",
      "Sprinter Lunges Dumbbell",
      "Sprinter Lunges Smith Machine",
      "Perfect Squat Machine",
      "Perfect Squat Machine Calf Raises"
    ],
    Back: [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups",
      "Lat Pulldown",
      "Lat Pulldown C-Curve",
      "Straight Arm Cable Pulldown",
      "Dumbbell Rows",
      "Barbell Rows",
      "Cable Rows",
      "Single Arm Cable Rows",
      "T Bar Row",
      "High Row Machine",
      "Low Row Machine",
      "Back Extensions Bench",
      "Back Extensions Machine",
      "Seated Erector Rows",
      "Dumbbell Shrugs",
      "Barbell Shrugs",
      "Trap Bar Shrugs",
      "Incline Trap Raise"
    ],
    Arms: [
      "Tricep Press Machine",
      "Cable Overhead Tricep Extensions",
      "Tricep Pulldown Rope",
      "Tricep Pulldown Rope Single-Arm",
      "Dumbbell Kickbacks",
      "Cable Kickbacks",
      "Skullcrushers Neutral Grip Barbell",
      "Skullcrushers Pronated Grip Barbell",
      "Skullcrushers Plate",
      "Skullcrushers Dumbbells",
      "Bicep Curls Dumbbell",
      "Bicep Curls Barbell",
      "Bicep Curls Cable",
      "Bicep Curls Cable Non-Machine",
      "Bayesian Bicep Curls",
      "Reverse Curls Cable Non-Machine",
      "Reverse Curls Cable",
      "Reverse Curls Dumbbell",
      "Reverse Curls Barbell",
      "Hammer Curls Dumbbell",
      "Preacher Curls",
      "Preacher Curls Dumbbell",
      "Preacher Curls Cable",
      "Reverse Preacher Curls",
      "Forearm Curls Pronated",
      "Forearm Curls Pronated Single-Hand",
      "Forearm Curls Supinated",
      "Forearm Curls Supinated Single-Hand"
    ],
    Shoulders: [
      "Shoulder Press Machine",
      "Shoulder Press Dumbbell",
      "Shoulder Press Barbell",
      "Lateral Raises",
      "Cable Lateral Raises",
      "Lateral Raises Machine",
      "Face Pulls",
      "Rotator Cuff Band",
      "External Rotation Horizontal",
      "External Rotation Vertical",
      "Rotator Cuff Cable",
      "Reverse Pec Deck Flys",
      "Reverse Pec Deck Flys Sideways",
      "Reverse Cable Crossovers",
      "Rear Delt Bench Flys Dumbbell",
    ],
    Abs: [
      "Crunch Machine",
      "V-Crunch Machine",
      "Oblique Machine",
      "Hanging Leg Raises",
      "Elbow-Supported Hanging Leg Raises"
    ]
  };
  const weightTypes = ["kg", "machine"];

  // Recent unique workouts for "Repeat Workout" picker
  const recentWorkouts = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    return [...workouts]
      .sort((a, b) => new Date(b.workoutDate) - new Date(a.workoutDate))
      .slice(0, 15);
  }, [workouts]);

  const loadWorkoutTemplate = (workout) => {
    setWorkoutName(workout.workoutName || "");
    setExercises(
      workout.exercises.map((ex) => ({ ...ex }))
    );
    toast.success("Workout loaded — update weights and save.");
  };

  // Rest timer
  const startTimer = useCallback((duration) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestDuration(duration);
    setRestSeconds(duration);
    timerRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRestSeconds(0);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Find the most recent entry for the currently selected exercise
  const lastExerciseInfo = useMemo(() => {
    if (!currentExercise.exercise || !workouts || workouts.length === 0) return null;

    const sorted = [...workouts].sort(
      (a, b) => new Date(b.workoutDate) - new Date(a.workoutDate)
    );

    for (const workout of sorted) {
      const match = workout.exercises.find(
        (ex) => ex.exercise === currentExercise.exercise
      );
      if (match) {
        const date = new Date(workout.workoutDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const weight = match.isAssistance
          ? `${Math.abs(match.weight)} ${match.weightType} (assisted)`
          : `${Math.abs(match.weight)} ${match.weightType}`;
        return `Last: ${match.sets}x${match.reps} @ ${weight} on ${date}`;
      }
    }
    return null;
  }, [currentExercise.exercise, workouts]);

  useEffect(() => {
    // Load current workout from local storage on mount
    const storedWorkout = localStorage.getItem("currentWorkout");
    if (storedWorkout) {
      const parsedWorkout = JSON.parse(storedWorkout);
      setWorkoutName(parsedWorkout.workoutName || "");
      setWorkoutDate(parsedWorkout.workoutDate || "");
      setExercises(parsedWorkout.exercises || []);
      setCurrentExercise(parsedWorkout.currentExercise || {
        muscleGroup: "",
        exercise: "",
        sets: "",
        reps: "",
        weight: "",
        weightType: "kg",
        isAssistance: false,
      });
    }
  }, []);

  useEffect(() => {
    if (editingWorkout) {
      setWorkoutName(editingWorkout.workoutName || "");
      setWorkoutDate(editingWorkout.workoutDate || "");
      setExercises(editingWorkout.exercises || []);
    }
  }, [editingWorkout]);

  // Save current workout data to local storage whenever it changes
  useEffect(() => {
    const currentWorkoutData = {
      workoutName,
      workoutDate,
      exercises,
      currentExercise,
    };
    localStorage.setItem("currentWorkout", JSON.stringify(currentWorkoutData));
  }, [workoutName, workoutDate, exercises, currentExercise]);

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
    localStorage.removeItem("currentWorkout"); // Clear the local storage when resetting the form
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
      startTimer(restDuration);
    }

    if (setLogging) {
      // Keep muscle group, exercise, weightType, isAssistance — clear sets/reps/weight
      setCurrentExercise((prev) => ({
        muscleGroup: prev.muscleGroup,
        exercise: prev.exercise,
        sets: "1",
        reps: "",
        weight: "",
        weightType: prev.weightType,
        isAssistance: prev.isAssistance,
      }));
    } else {
      setCurrentExercise((prev) => ({
        muscleGroup: prev.muscleGroup,
        exercise: "",
        sets: "",
        reps: "",
        weight: "",
        weightType: "kg",
        isAssistance: false,
      }));
    }
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

    const endpoint = editingWorkout ? "/updateWorkout" : "/saveWorkout";

    try {
      await apiClient.post(endpoint, workoutData);
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

      {/* Repeat Workout Picker */}
      {!editingWorkout && recentWorkouts.length > 0 && (
        <div className="repeat-workout-section">
          <label className="form-label" style={{ minWidth: "unset", textAlign: "left" }}>
            Repeat a workout:
          </label>
          <select
            className="select-input"
            defaultValue=""
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (!isNaN(idx)) loadWorkoutTemplate(recentWorkouts[idx]);
              e.target.value = "";
            }}
          >
            <option value="" disabled>Select a recent workout...</option>
            {recentWorkouts.map((w, i) => (
              <option key={i} value={i}>
                {w.workoutName || "Untitled"} — {new Date(w.workoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ({w.exercises.length} exercises)
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* First row: Workout Name & Date */}
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

        {/* Exercise Info Section */}
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

        {lastExerciseInfo && (
          <p className="last-exercise-hint">{lastExerciseInfo}</p>
        )}

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

        {/* Set logging toggle */}
        <div className="set-logging-row">
          <label className="set-logging-label">
            <input
              type="checkbox"
              checked={setLogging}
              onChange={(e) => setSetLogging(e.target.checked)}
            />
            Log sets individually
          </label>
          {setLogging && (
            <span className="set-logging-hint">Each add = 1 set. Exercise stays selected.</span>
          )}
        </div>

        <div className="button-group">
          <button type="button" onClick={addOrUpdateExercise}>
            {editIndex !== null ? "Update Exercise" : setLogging ? "Log Set" : "Add Exercise"}
          </button>
        </div>

        {/* Rest Timer */}
        {restSeconds > 0 && (
          <div className="rest-timer">
            <span className="rest-timer-display">
              Rest: {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, "0")}
            </span>
            <button type="button" className="rest-timer-stop" onClick={stopTimer}>Skip</button>
          </div>
        )}
        {restSeconds === 0 && exercises.length > 0 && !timerRef.current && (
          <div className="rest-timer-presets">
            <span className="rest-timer-label">Rest:</span>
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                type="button"
                className={`rest-preset-btn ${restDuration === s ? "active" : ""}`}
                onClick={() => startTimer(s)}
              >
                {s >= 120 ? `${s / 60}m` : `${s}s`}
              </button>
            ))}
          </div>
        )}

        {/* Current Exercises */}
        <div className="current-workout-summary">
          <h4>Current Exercises</h4>
          {exercises.length > 0 && (
            <ul>
              {exercises.map((exercise, index) => (
                <li key={index}>
                  {exercise.exercise} - {exercise.sets} sets of {exercise.reps} reps at{" "}
                  {exercise.weight} {exercise.weightType} (
                  {exercise.isAssistance ? "Assisted" : "Regular"})
                  <button type="button" onClick={() => editExercise(index)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteExercise(index)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit">
          {editingWorkout ? "Update Workout" : "Save Workout"}
        </button>
      </form>
    </div>
  );
};

export default UploadWorkout;
