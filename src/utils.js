// Shared utility: strip workout data down to only what the AI/chatbot needs
export const transformWorkouts = (rawWorkouts) =>
  rawWorkouts.map((workout) => ({
    workoutName: workout.workoutName,
    workoutDate: workout.workoutDate,
    exercises: (workout.exercises || []).map((ex) => ({
      exercise: ex.exercise,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      isAssistance: ex.isAssistance,
    })),
  }));
