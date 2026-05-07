import axios from "axios";

const CHATBOT_URL = process.env.REACT_APP_CHATBOT_API_URL;

const minimalWorkouts = (workouts) =>
  workouts.map((w) => ({
    workoutName: w.workoutName,
    workoutDate: w.workoutDate,
    exercises: (w.exercises || []).map((ex) => ({
      exercise: ex.exercise,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      isAssistance: ex.isAssistance,
    })),
  }));

export const requestAIInsights = async (workouts) => {
  const { data } = await axios.post(
    CHATBOT_URL,
    { userInput: "Analyze my workouts", workoutHistory: minimalWorkouts(workouts) },
    { headers: { "Content-Type": "application/json" } }
  );
  return data?.response || "No insights available.";
};
